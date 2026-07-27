import { Injectable } from "@nestjs/common";
import type {
    InventoryKpisDto,
    InventoryPositionDto,
    Paginated,
    StockMovementDto,
} from "@stock-pilot/shared";
import { Prisma } from "@/generated/prisma/client.js";
import type { StockMovementModel } from "@/generated/prisma/models.js";
import type { InventoryItemWithProduct } from "@/modules/inventory/adapter/persistence/inventory-position.mapper.js";
import { InventoryPositionMapper } from "@/modules/inventory/adapter/persistence/inventory-position.mapper.js";
import { StockMovementMapper } from "@/modules/inventory/adapter/persistence/stock-movement.mapper.js";
import type {
    InventoryQuery,
    ListMovementsParams,
    ListPositionsParams,
} from "@/modules/inventory/application/ports/inventory-query.repository.js";
import {
    averageCoverageWeeks,
    skusOutOfStock,
} from "@/modules/inventory/domain/kpis/aggregate-kpis.js";
import { calculateInventoryValue } from "@/modules/inventory/domain/value/calculate-inventory-value.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";

@Injectable()
export class PrismaInventoryQuery implements InventoryQuery {
    constructor(private readonly prisma: PrismaService) {}

    async findPosition(
        productId: string,
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
        params: ListPositionsParams,
    ): Promise<Paginated<InventoryPositionDto>> {
        const { search, page, limit, sort = "sku", dir = "asc" } = params;
        const offset = (page - 1) * limit;
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

        return { data: positions, page, limit, total };
    }

    async listMovements(
        productId: string,
        params: ListMovementsParams,
    ): Promise<Paginated<StockMovementDto>> {
        const { page, limit } = params;
        const offset = (page - 1) * limit;
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
            data: rows.map(StockMovementMapper.toDto),
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
        search: string | undefined,
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
        sort: ListPositionsParams["sort"],
        dir: "asc" | "desc",
    ): Prisma.InventoryItemOrderByWithRelationInput | undefined {
        if (sort === "onHand") {
            return { onHand: dir };
        }

        if (sort === "sku") {
            return { product: { sku: dir } };
        }

        // "value" is handled in memory — see the comment in listPositions.
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

        const anchor = latest._max.week ?? new Date();
        const start = new Date(anchor);
        start.setUTCDate(start.getUTCDate() - 13 * 7);

        return start;
    }
}
