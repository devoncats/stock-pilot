import {
    MovementType,
    ReferenceType,
    type StockMovementDto,
} from "@stock-pilot/shared";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dataRow } from "@/test-support/table";
import { MovementsTable } from "./movements-table";

function movement(overrides: Partial<StockMovementDto> = {}): StockMovementDto {
    return {
        id: "0192f8a0-0000-7000-8000-000000000001",
        type: MovementType.ADJUSTMENT,
        signedQty: 5,
        week: "2026-01-05",
        referenceType: ReferenceType.MANUAL,
        referenceId: null,
        reason: "stock count",
        createdAt: "2026-01-05T10:00:00.000Z",
        ...overrides,
    };
}

describe("MovementsTable", () => {
    it("renders type, quantity, week and reason", () => {
        render(<MovementsTable movements={[movement()]} />);

        const row = dataRow();

        expect(within(row).getByText("ADJUSTMENT")).toBeInTheDocument();
        expect(within(row).getByText("+5")).toBeInTheDocument();
        expect(within(row).getByText("2026-01-05")).toBeInTheDocument();
        expect(within(row).getByText("stock count")).toBeInTheDocument();
    });

    it("signs an outgoing movement negatively", () => {
        render(
            <MovementsTable
                movements={[
                    movement({ type: MovementType.SHIPMENT, signedQty: -12 }),
                ]}
            />,
        );

        expect(screen.getByText("-12")).toBeInTheDocument();
    });

    it("preserves the order it was given, newest first", () => {
        render(
            <MovementsTable
                movements={[
                    movement({ id: "b", reason: "newest" }),
                    movement({ id: "a", reason: "older" }),
                ]}
            />,
        );

        expect(within(dataRow(0)).getByText("newest")).toBeInTheDocument();
        expect(within(dataRow(1)).getByText("older")).toBeInTheDocument();
    });

    it("shows an em dash for a movement with no reason", () => {
        render(<MovementsTable movements={[movement({ reason: null })]} />);

        expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("shows an explicit message instead of an empty table", () => {
        render(<MovementsTable movements={[]} />);

        expect(screen.getByText(/no stock movements/i)).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
});
