import type { InventoryKpisDto } from "@stock-pilot/shared";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiCards } from "./kpi-cards";

const kpis: InventoryKpisDto = {
    totalSkus: 52,
    inventoryValueCents: 43_877_527,
    averageCoverageWeeks: 17.3,
    skusOutOfStock: 3,
    demandHistoryThroughWeek: "2026-01-19",
};

describe("KpiCards", () => {
    it("shows all four values", () => {
        render(<KpiCards kpis={kpis} />);

        expect(screen.getByText("52")).toBeInTheDocument();
        expect(screen.getByText("$438,775.27")).toBeInTheDocument();
        expect(screen.getByText("17.3 wk")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("labels every value", () => {
        render(<KpiCards kpis={kpis} />);

        for (const label of [
            "SKUs",
            "Inventory value",
            "Average coverage",
            "Out of stock",
        ]) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
    });

    it("renders an em dash when average coverage is unknown", () => {
        render(<KpiCards kpis={{ ...kpis, averageCoverageWeeks: null }} />);

        expect(screen.getByText("—")).toBeInTheDocument();
        expect(screen.queryByText("0 wk")).not.toBeInTheDocument();
    });

    it("says which week coverage is measured against", () => {
        render(<KpiCards kpis={kpis} />);

        expect(screen.getByText(/2026-01-19/)).toBeInTheDocument();
    });

    it("explains the absence of coverage when no demand history is loaded", () => {
        render(
            <KpiCards
                kpis={{
                    ...kpis,
                    averageCoverageWeeks: null,
                    demandHistoryThroughWeek: null,
                }}
            />,
        );

        expect(screen.getByText(/no demand history/i)).toBeInTheDocument();
    });
});
