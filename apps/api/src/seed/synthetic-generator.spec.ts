import { describe, expect, it } from "vitest";
import {
    GenerateParams,
    generateSyntheticSkus,
    SyntheticSku,
} from "./synthetic-generator.js";

const syntheticSkuParams = (
    override: Partial<GenerateParams> = {},
): GenerateParams => ({
    seed: 20,
    count: 5,
    weeks: 4,
    startWeek: "2026-01-05",
    ...override,
});

describe("generateSyntheticSkus", () => {
    it("same seed produces identical output", () => {
        const params = syntheticSkuParams();

        const skus1 = generateSyntheticSkus(params);
        const skus2 = generateSyntheticSkus(params);

        expect(skus1).toEqual(skus2);
    });

    it("different seeds produce different output", () => {
        const params1 = syntheticSkuParams({ seed: 20 });
        const params2 = syntheticSkuParams({ seed: 25 });

        const skus1 = generateSyntheticSkus(params1);
        const skus2 = generateSyntheticSkus(params2);

        expect(skus1).not.toEqual(skus2);
    });

    it("a SKU is stable regardless of count", () => {
        const params1 = syntheticSkuParams({ count: 5 });
        const params2 = syntheticSkuParams({ count: 10 });

        const skus1 = generateSyntheticSkus(params1);
        const skus2 = generateSyntheticSkus(params2);

        expect(skus2.slice(0, params1.count)).toEqual(skus1);
    });

    it("emits count SKUs with weeks consecutive Mondays from startWeek", () => {
        const params = syntheticSkuParams({
            startWeek: "2026-01-05",
            weeks: 4,
        });

        const skus = generateSyntheticSkus(params);

        expect(skus.length).toBe(params.count);

        for (const sku of skus) {
            expect(sku.weeklyDemand.map((w) => w.week)).toEqual([
                "2026-01-05",
                "2026-01-12",
                "2026-01-19",
                "2026-01-26",
            ]);
        }
    });

    it("every week falls on a Monday", () => {
        const params = syntheticSkuParams();

        const skus = generateSyntheticSkus(params);

        const weeks = skus.flatMap((sku) =>
            sku.weeklyDemand.map((w) => w.week),
        );

        for (const week of weeks) {
            expect(new Date(`${week}T00:00:00Z`).getUTCDay()).toBe(1);
        }
    });

    it("quantities are non-negative integers", () => {
        const params = syntheticSkuParams();

        const skus = generateSyntheticSkus(params);

        const quantities = skus.flatMap((sku) =>
            sku.weeklyDemand.map((w) => w.qty),
        );

        const invalid = quantities.filter(
            (qty) => !Number.isInteger(qty) || qty < 0,
        );

        expect(invalid).toEqual([]);
    });

    it("covers X/Y/Z and Z is intermittent", () => {
        const params = syntheticSkuParams({ count: 9, weeks: 52 });

        const skus = generateSyntheticSkus(params);

        expect(new Set(skus.map((sku) => sku.xyzClass))).toEqual(
            new Set(["X", "Y", "Z"]),
        );

        const zeroWeeks = (sku: SyntheticSku) =>
            sku.weeklyDemand.filter((w) => w.qty === 0).length;

        for (const sku of skus.filter((sku) => sku.xyzClass === "Z")) {
            expect(zeroWeeks(sku)).toBeGreaterThan(0);
        }

        for (const sku of skus.filter((sku) => sku.xyzClass === "X")) {
            expect(zeroWeeks(sku)).toBe(0);
        }
    });
});
