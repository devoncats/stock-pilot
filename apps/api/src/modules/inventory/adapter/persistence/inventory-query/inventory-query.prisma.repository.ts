import { Injectable } from "@nestjs/common";
import type {
    InventoryKpisDto,
    InventoryPositionDto,
    Page,
    StockMovementDto,
} from "@stock-pilot/shared";
import { Prisma } from "@/generated/prisma/client.js";
import type { StockMovementModel } from "@/generated/prisma/models.js";
import type { InventoryItemWithProduct } from "@/modules/inventory/adapter/persistence/inventory-query/inventory-position.mapper.js";
import { InventoryPositionMapper } from "@/modules/inventory/adapter/persistence/inventory-query/inventory-position.mapper.js";
import { StockMovementViewMapper } from "@/modules/inventory/adapter/persistence/stock-movement/stock-movement-view.mapper.js";
import type {
    DirValue,
    InventoryQuery,
    ListMovementsQueryParams,
    ListPositionsQueryParams,
    SortValue,
} from "@/modules/inventory/application/queries/ports/inventory-query.repository.js";
import { calculateAverageWeeklyDemand } from "@/modules/inventory/domain/average-weekly-demand/calculate-average-weekly-demand.js";
import {
    COVERAGE_WINDOW_WEEKS,
    coverageWindowStart,
} from "@/modules/inventory/domain/coverage-weeks/coverage-window.js";
import {
    averageCoverageWeeks,
    skusOutOfStock,
} from "@/modules/inventory/domain/kpis/aggregate-kpis.js";
import { calculateInventoryValue } from "@/modules/inventory/domain/value/calculate-inventory-value.js";
import { type ProductId } from "@/shared/domain/product-id/product-id.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";

interface CoverageWindow {
    anchor: Date;
    start: Date;
}

interface PageRequest {
    search: string | undefined;
    offset: number;
    limit: number;
    dir: DirValue;
}

interface PositionPage {
    rows: InventoryItemWithProduct[];
    total: number;
}

@Injectable()
export class PrismaInventoryQuery implements InventoryQuery {
    constructor(private readonly prisma: PrismaService) {}

    async findPosition(
        productId: ProductId,
    ): Promise<InventoryPositionDto | null> {
        const row = await this.prisma.inventoryItem.findUnique({
            where: { productId },
            include: { product: true },
        });

        if (!row) {
            return null;
        }

        const window = await this.coverageWindow();
        const demand = await this.averageWeeklyDemandByProduct(
            [productId],
            window,
        );

        return InventoryPositionMapper.toDto(
            row,
            demand.get(productId) ?? null,
        );
    }

    async positionExists(productId: ProductId): Promise<boolean> {
        const row = await this.prisma.inventoryItem.findUnique({
            where: { productId },
            select: { productId: true },
        });

        return row !== null;
    }

    async listPositions(
        params: ListPositionsQueryParams,
    ): Promise<Page<InventoryPositionDto>> {
        const {
            search,
            offset = 0,
            limit = 25,
            sort = "sku",
            dir = "asc",
        } = params;

        const request: PageRequest = { search, offset, limit, dir };

        const { rows, total } =
            sort === "value"
                ? await this.pageByValue(request)
                : await this.pageByColumn({ ...request, sort });

        const window = await this.coverageWindow();
        const demand = await this.averageWeeklyDemandByProduct(
            rows.map((row) => row.productId),
            window,
        );

        const data = rows.map((row: InventoryItemWithProduct) =>
            InventoryPositionMapper.toDto(
                row,
                demand.get(row.productId) ?? null,
            ),
        );

        return { data, offset, limit, total };
    }

    async listMovements(
        productId: ProductId,
        params: ListMovementsQueryParams,
    ): Promise<Page<StockMovementDto>> {
        const { offset, limit } = params;
        const where = { productId };

        const [rows, total]: [StockMovementModel[], number] =
            await this.prisma.$transaction([
                this.prisma.stockMovement.findMany({
                    where,
                    orderBy: { createdAt: "desc" },
                    take: limit,
                    skip: offset,
                }),
                this.prisma.stockMovement.count({ where }),
            ]);

        return {
            data: rows.map(StockMovementViewMapper.toDto),
            offset,
            limit,
            total,
        };
    }

    async inventoryKpis(): Promise<InventoryKpisDto> {
        const rows: InventoryItemWithProduct[] =
            await this.prisma.inventoryItem.findMany({
                include: { product: true },
            });

        const window = await this.coverageWindow();
        const demand = await this.averageWeeklyDemandByProduct(
            rows.map((row: InventoryItemWithProduct) => row.productId),
            window,
        );

        const positions = rows.map((row: InventoryItemWithProduct) =>
            InventoryPositionMapper.toDto(
                row,
                demand.get(row.productId) ?? null,
            ),
        );

        return {
            totalSkus: positions.length,
            inventoryValueCents: calculateInventoryValue(
                positions.map((position: InventoryPositionDto) => ({
                    onHand: position.onHand,
                    unitCostCents: position.unitCostCents,
                })),
            ),
            averageCoverageWeeks: averageCoverageWeeks(
                positions.map(
                    (position: InventoryPositionDto) => position.coverageWeeks,
                ),
            ),
            skusOutOfStock: skusOutOfStock(
                positions.map((position: InventoryPositionDto) => ({
                    onHand: position.onHand,
                })),
            ),
            demandHistoryThroughWeek:
                window?.anchor.toISOString().slice(0, 10) ?? null,
        };
    }

    private async pageByColumn({
        search,
        offset,
        limit,
        sort,
        dir,
    }: PageRequest & {
        sort: Exclude<SortValue, "value">;
    }): Promise<PositionPage> {
        const where = this.whereFor(search);

        const [rows, total]: [InventoryItemWithProduct[], number] =
            await this.prisma.$transaction([
                this.prisma.inventoryItem.findMany({
                    where,
                    include: { product: true },
                    orderBy: this.orderByFor(sort, dir),
                    take: limit,
                    skip: offset,
                }),
                this.prisma.inventoryItem.count({ where }),
            ]);

        return { rows, total };
    }

    private async pageByValue({
        search,
        offset,
        limit,
        dir,
    }: PageRequest): Promise<PositionPage> {
        const direction = dir === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;

        const filter = search
            ? Prisma.sql`WHERE (p.sku ILIKE ${`%${search}%`} OR p.name ILIKE ${`%${search}%`})`
            : Prisma.empty;

        const [ordered, counted] = await this.prisma.$transaction([
            this.prisma.$queryRaw<{ product_id: string }[]>`
                SELECT i.product_id
                FROM inventory_items i
                JOIN products p ON p.id = i.product_id
                ${filter}
                ORDER BY i.on_hand * p.unit_cost ${direction}, p.sku ASC
                LIMIT ${limit} OFFSET ${offset}
            `,
            this.prisma.$queryRaw<{ total: number }[]>`
                SELECT COUNT(*)::int AS total
                FROM inventory_items i
                JOIN products p ON p.id = i.product_id
                ${filter}
            `,
        ]);

        const total = counted[0]?.total ?? 0;
        const ids = ordered.map((row) => row.product_id);

        if (ids.length === 0) {
            return { rows: [], total };
        }

        const rows = await this.prisma.inventoryItem.findMany({
            where: { productId: { in: ids } },
            include: { product: true },
        });

        const byId = new Map(rows.map((row) => [row.productId, row]));

        return { rows: ids.flatMap((id) => byId.get(id) ?? []), total };
    }

    private whereFor(
        search: ListPositionsQueryParams["search"],
    ): Prisma.InventoryItemWhereInput {
        if (!search) {
            return {};
        }

        return {
            product: {
                OR: [
                    { sku: { contains: search, mode: "insensitive" } },
                    { name: { contains: search, mode: "insensitive" } },
                ],
            },
        };
    }

    private orderByFor(
        sort: ListPositionsQueryParams["sort"] = "sku",
        dir: ListPositionsQueryParams["dir"] = "asc",
    ): Prisma.InventoryItemOrderByWithRelationInput | undefined {
        return sort === "onHand" ? { onHand: dir } : { product: { sku: dir } };
    }

    private async averageWeeklyDemandByProduct(
        productIds: string[],
        window: CoverageWindow | null,
    ): Promise<Map<string, number>> {
        if (productIds.length === 0 || !window) {
            return new Map();
        }

        const rows = await this.prisma.demandHistory.groupBy({
            by: ["productId"],
            where: {
                productId: { in: productIds },
                week: { gte: window.start },
            },
            _sum: { qty: true },
        });

        return new Map(
            rows.map((row) => [
                row.productId,
                calculateAverageWeeklyDemand({
                    totalQty: row._sum.qty ?? 0,
                    windowWeeks: COVERAGE_WINDOW_WEEKS,
                }),
            ]),
        );
    }

    private async coverageWindow(): Promise<CoverageWindow | null> {
        const latest = await this.prisma.demandHistory.aggregate({
            _max: { week: true },
        });

        const anchor = latest._max.week;

        if (!anchor) {
            return null;
        }

        const start = coverageWindowStart(anchor);

        return { anchor, start };
    }
}
