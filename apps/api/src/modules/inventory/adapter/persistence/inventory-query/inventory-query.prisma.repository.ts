import { Inject, Injectable } from "@nestjs/common";
import type {
    InventoryKpisDto,
    InventoryPositionDto,
    Page,
    StockMovementDto,
} from "@stock-pilot/shared";
import { Prisma } from "@/generated/prisma/client.js";
import type { StockMovementModel } from "@/generated/prisma/models.js";
import { type ProductId } from "@/modules/catalog/domain/product-id/product-id.js";
import { ListMovementsQueryDto } from "@/modules/inventory/adapter/http/dto/list-movements-query.dto.js";
import { ListPositionsQueryDto } from "@/modules/inventory/adapter/http/dto/list-positions-query.dto.js";
import type { InventoryItemWithProduct } from "@/modules/inventory/adapter/persistence/inventory-query/inventory-position.mapper.js";
import { InventoryPositionMapper } from "@/modules/inventory/adapter/persistence/inventory-query/inventory-position.mapper.js";
import { StockMovementViewMapper } from "@/modules/inventory/adapter/persistence/stock-movement/stock-movement-view.mapper.js";
import type { InventoryQuery } from "@/modules/inventory/application/queries/ports/inventory-query.repository.js";
import {
    averageCoverageWeeks,
    skusOutOfStock,
} from "@/modules/inventory/domain/kpis/aggregate-kpis.js";
import { calculateInventoryValue } from "@/modules/inventory/domain/value/calculate-inventory-value.js";
import { CLOCK, type Clock } from "@/shared/application/ports/clock.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";

@Injectable()
export class PrismaInventoryQuery implements InventoryQuery {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(CLOCK) private readonly clock: Clock,
    ) {}

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

        const demand = await this.averageWeeklyDemandByProduct([productId]);

        return InventoryPositionMapper.toDto(
            row,
            demand.get(productId) ?? null,
        );
    }

    async listPositions(
        params: ListPositionsQueryDto,
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

        const demand = await this.averageWeeklyDemandByProduct(
            rows.map((row: InventoryItemWithProduct) => row.productId),
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

        const page = Math.floor(offset / limit) + 1;

        return { data: positions, page, limit, total };
    }

    async listMovements(
        productId: ProductId,
        params: ListMovementsQueryDto,
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

        const page = Math.floor(offset / limit) + 1;

        return {
            data: rows.map(StockMovementViewMapper.toDto),
            page,
            limit,
            total,
        };
    }

    async inventoryKpis(): Promise<InventoryKpisDto> {
        const rows: InventoryItemWithProduct[] =
            await this.prisma.inventoryItem.findMany({
                include: { product: true },
            });

        const demand = await this.averageWeeklyDemandByProduct(
            rows.map((row: InventoryItemWithProduct) => row.productId),
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
        };
    }

    private whereFor(
        search: ListPositionsQueryDto["search"],
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
        sort: ListPositionsQueryDto["sort"] = "sku",
        dir: ListPositionsQueryDto["dir"] = "asc",
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
        dir: "asc" | "desc",
    ): InventoryPositionDto[] {
        const sorted = [...positions].sort(
            (a, b) => a.valueCents - b.valueCents,
        );

        return dir === "desc" ? sorted.reverse() : sorted;
    }

    private async averageWeeklyDemandByProduct(
        productIds: string[],
    ): Promise<Map<string, number>> {
        if (productIds.length === 0) {
            return new Map();
        }

        const windowStart = await this.coverageWindowStart();

        const rows = await this.prisma.demandHistory.groupBy({
            by: ["productId"],
            where: {
                productId: { in: productIds },
                week: { gte: windowStart },
            },
            _avg: { qty: true },
        });

        return new Map(rows.map((row) => [row.productId, row._avg.qty ?? 0]));
    }

    private async coverageWindowStart(): Promise<Date> {
        const latest = await this.prisma.demandHistory.aggregate({
            _max: { week: true },
        });

        const anchor = latest._max.week ?? this.clock.now();
        const start = new Date(anchor);
        start.setUTCDate(start.getUTCDate() - 13 * 7);

        return start;
    }
}
