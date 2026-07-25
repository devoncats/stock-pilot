import { existsSync } from "node:fs";
import { PrismaService } from "@/shared/prisma/prisma.service.js";
import { runSeed } from "./seed.js";

const num = (value: string | undefined, fallback: number): number =>
    value === undefined ? fallback : Number(value);

async function main(): Promise<void> {
    const path =
        process.env.SEED_WEEKLY_DEMAND_PATH ?? "../../data/weekly-demand.csv";

    if (!existsSync(path)) {
        console.error(
            `Missing ${path}.\n` +
                "Run the aggregation first: cd services/machine-learning && " +
                "uv run python -m stock_pilot_ml.cli",
        );
        process.exit(1);
    }

    if (!process.env.DATABASE_URL) {
        console.error(
            "DATABASE_URL is not set. Copy .env.example to .env at the repo root, " +
                "or start the database with pnpm compose:up.",
        );
        process.exit(1);
    }

    const prisma = new PrismaService();

    try {
        const summary = await runSeed(prisma, {
            path,
            count: num(process.env.SEED_SYNTH_COUNT, 50),
            seed: num(process.env.SEED_RANDOM_SEED, 42),
            startWeek: process.env.SEED_START_WEEK ?? "2011-01-24",
            weeks: num(process.env.SEED_SYNTHETIC_WEEKS, 273),
        });

        console.log(
            `Seeded: ${summary.products} products · ` +
                `${summary.suppliers} suppliers · ` +
                `${summary.supplierProducts} sourcing rows · ` +
                `${summary.inventoryItems} inventory items · ` +
                `${summary.stockMovements} movements · ` +
                `${summary.demandWeeks} demand weeks`,
        );
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
