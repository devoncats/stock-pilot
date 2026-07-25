import { createPrng } from "./prng.js";

const COST_RATIO = 0.65;

const CLASSES = ["X", "Y", "Z"] as const;
const CATEGORIES = ["FOOD", "HOUSEHOLD", "HOBBIES"] as const;

export type XyzClass = (typeof CLASSES)[number];

type Category = (typeof CATEGORIES)[number];

export interface SyntheticWeek {
    week: string;
    qty: number;
}

export interface SyntheticSku {
    sku: string;
    category: Category;
    price: number;
    unitCost: number;
    xyzClass: XyzClass;
    weeklyDemand: SyntheticWeek[];
}

export interface GenerateParams {
    seed: number;
    count: number;
    weeks: number;
    startWeek: string;
}

function mondaysFrom(startWeek: string, count: number): string[] {
    const start = new Date(`${startWeek}T00:00:00Z`);

    const mondays: string[] = Array.from({ length: count }, (_, w) => {
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + w * 7);

        return date.toISOString().slice(0, 10);
    });

    return mondays;
}

function weeklyQuantities(
    xyzClass: XyzClass,
    base: number,
    weeks: number,
    random: () => number,
): number[] {
    const raw = Array.from({ length: weeks }, (_, w) => {
        switch (xyzClass) {
            case "X": {
                const stable = base * (0.9 + random() * 0.2);

                return stable;
            }
            case "Y": {
                const variable =
                    base *
                    (1 + (w / weeks) * 0.3) *
                    (1 + 0.2 * Math.sin((2 * Math.PI * w) / 52)) *
                    (0.8 + random() * 0.4);

                return variable;
            }
            case "Z": {
                const intermittent =
                    random() < 0.6 ? 0 : base * (0.5 + random() * 1.5);

                return intermittent;
            }
            default:
                throw new Error(`[weeklyDemand] Unknown xyzClass: ${xyzClass}`);
        }
    });

    return raw.map((value) => Math.max(0, Math.round(value)));
}

export function generateSyntheticSku(params: GenerateParams): SyntheticSku[] {
    const mondays = mondaysFrom(params.startWeek, params.weeks);

    const syntheticSkus: SyntheticSku[] = Array.from(
        { length: params.count },
        (_, i) => {
            const random = createPrng(params.seed + i);

            const category = CATEGORIES[
                Math.floor(random() * CATEGORIES.length)
            ] as Category;
            const price = Math.round((5 + random() * 55) * 100) / 100;
            const base = 20 + random() * 180;
            const xyzClass = CLASSES[i % CLASSES.length] as XyzClass;
            const weeklyDemand = weeklyQuantities(
                xyzClass,
                base,
                params.weeks,
                random,
            ).map((qty, w) => ({ week: mondays[w], qty })) as SyntheticWeek[];

            const sku: SyntheticSku = {
                sku: `SYN-${String(i + 1).padStart(4, "0")}`,
                category,
                price,
                unitCost: Math.round(price * COST_RATIO * 100) / 100,
                xyzClass,
                weeklyDemand,
            };

            return sku;
        },
    );

    return syntheticSkus;
}
