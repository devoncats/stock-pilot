import type { InventoryPositionDto } from "@stock-pilot/shared";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { InventoryParams } from "@/lib/inventory-params/inventory-params";
import { dataRow } from "@/test-support/table";
import { PositionsTable } from "./positions-table";

const params: InventoryParams = {
    search: undefined,
    page: 1,
    limit: 25,
    sort: "sku",
    dir: "asc",
};

function position(
    overrides: Partial<InventoryPositionDto> = {},
): InventoryPositionDto {
    return {
        productId: "019f9e1d-b7db-7f75-8b8d-89eba2b2d6b4",
        sku: "WIDGET_BLUE",
        name: "WIDGET BLUE",
        onHand: 40,
        reserved: 0,
        available: 40,
        onOrder: 0,
        backordered: 0,
        position: 40,
        unitCostCents: 1500,
        valueCents: 60_000,
        coverageWeeks: 17.3,
        ...overrides,
    };
}

describe("PositionsTable", () => {
    it("renders one row per SKU with its figures", () => {
        render(<PositionsTable positions={[position()]} params={params} />);

        const row = dataRow();

        expect(within(row).getByText("WIDGET_BLUE")).toBeInTheDocument();
        expect(within(row).getByText("WIDGET BLUE")).toBeInTheDocument();
        expect(within(row).getByText("$600.00")).toBeInTheDocument();
        expect(within(row).getByText("17.3 wk")).toBeInTheDocument();
    });

    it("renders a row for every position given", () => {
        render(
            <PositionsTable
                positions={[
                    position({ productId: "a", sku: "AAA-1" }),
                    position({ productId: "b", sku: "BBB-2" }),
                    position({ productId: "c", sku: "CCC-3" }),
                ]}
                params={params}
            />,
        );

        expect(screen.getAllByRole("row")).toHaveLength(4);
    });

    it("shows an em dash for a SKU with no demand history", () => {
        render(
            <PositionsTable
                positions={[position({ coverageWeeks: null })]}
                params={params}
            />,
        );

        expect(screen.getByText("—")).toBeInTheDocument();
        expect(screen.queryByText("0 wk")).not.toBeInTheDocument();
    });

    it("links each SKU to its detail page", () => {
        render(<PositionsTable positions={[position()]} params={params} />);

        expect(
            screen.getByRole("link", { name: "WIDGET_BLUE" }),
        ).toHaveAttribute(
            "href",
            "/inventory/019f9e1d-b7db-7f75-8b8d-89eba2b2d6b4",
        );
    });

    it("marks only the active column as sorted", () => {
        render(
            <PositionsTable
                positions={[position()]}
                params={{ ...params, sort: "value", dir: "desc" }}
            />,
        );

        expect(
            screen.getByRole("columnheader", { name: /value/i }),
        ).toHaveAttribute("aria-sort", "descending");
        expect(
            screen.getByRole("columnheader", { name: /sku/i }),
        ).toHaveAttribute("aria-sort", "none");
    });

    it("shows an explicit message instead of an empty table", () => {
        render(<PositionsTable positions={[]} params={params} />);

        expect(screen.getByText(/no skus match/i)).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
});
