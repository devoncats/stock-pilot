import { Injectable } from "@nestjs/common";
import type {
    InventoryKpisDto,
    InventoryPositionDto,
    Page,
    StockMovementDto,
} from "@stock-pilot/shared";
import { Prisma } from "@/generated/prisma/client.js";
import type { StockMovementModel } from "@/generated/prisma/models.js";
import { type ProductId } from "@/modules/catalog/domain/product-id/product-id.js";
import type { InventoryItemWithProduct } from "@/modules/inventory/adapter/persistence/inventory-query/inventory-position.mapper.js";
import { InventoryPositionMapper } from "@/modules/inventory/adapter/persistence/inventory-query/inventory-position.mapper.js";
import { StockMovementViewMapper } from "@/modules/inventory/adapter/persistence/stock-movement/stock-movement-view.mapper.js";
import type {
    InventoryQuery,
    ListMovementsQueryParams,
    ListPositionsQueryParams,
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
import { PrismaService } from "@/shared/prisma/prisma.service.js";

interface CoverageWindow {
    anchor: Date;
    start: Date;
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

        const where = this.whereFor(search);
        const orderBy = this.orderByFor(sort, dir);

        const [rows, total]: [InventoryItemWithProduct[], number] =
            await this.prisma.$transaction([
                this.prisma.inventoryItem.findMany({
                    where,
                    include: { product: true },
                    ...(orderBy ? { orderBy, take: limit, skip: offset } : {}),
                }),
                this.prisma.inventoryItem.count({ where }),
            ]);

        const window = await this.coverageWindow();
        const demand = await this.averageWeeklyDemandByProduct(
            rows.map((row: InventoryItemWithProduct) => row.productId),
            window,
        );

        let positions = rows.map((row: InventoryItemWithProduct) =>
            InventoryPositionMapper.toDto(
                row,
                demand.get(row.productId) ?? null,
            ),
        );

        if (!orderBy) {
            positions = this.sortByValue(positions, dir).slice(
                offset,
                offset + limit,
            );
        }

        return { data: positions, offset, limit, total };
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
        if (sort === "onHand") {
            return { onHand: dir };
        }

        if (sort === "sku") {
            return { product: { sku: dir } };
        }

        return undefined;
    }

    private sortByValue(
        positions: InventoryPositionDto[],
        dir: ListPositionsQueryParams["dir"] = "asc",
    ): InventoryPositionDto[] {
        const sorted = [...positions].sort(
            (a, b) => a.valueCents - b.valueCents,
        );

        return dir === "desc" ? sorted.reverse() : sorted;
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
