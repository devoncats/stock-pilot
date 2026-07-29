import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { InventoryParams } from "@/lib/inventory-params/inventory-params";
import { PaginationControls } from "./pagination-controls";

const params: InventoryParams = {
    search: undefined,
    page: 1,
    limit: 25,
    sort: "sku",
    dir: "asc",
};

describe("PaginationControls", () => {
    it("offers no previous link on the first page", () => {
        render(<PaginationControls params={params} total={52} />);

        expect(
            screen.queryByRole("link", { name: "Previous" }),
        ).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Next" })).toBeInTheDocument();
    });

    it("offers no next link on the last page", () => {
        render(
            <PaginationControls params={{ ...params, page: 3 }} total={52} />,
        );

        expect(
            screen.queryByRole("link", { name: "Next" }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Previous" }),
        ).toBeInTheDocument();
    });

    it("offers both in the middle, preserving the other params", () => {
        render(
            <PaginationControls
                params={{ ...params, page: 2, search: "syn", sort: "value" }}
                total={52}
            />,
        );

        expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
            "href",
            "/inventory?search=syn&sort=value",
        );
        expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
            "href",
            "/inventory?search=syn&sort=value&page=3",
        );
    });

    it("reports the visible range and the page count", () => {
        render(
            <PaginationControls params={{ ...params, page: 2 }} total={52} />,
        );

        expect(screen.getByText("Showing 26–50 of 52")).toBeInTheDocument();
        expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    });

    it("says so when there are no results", () => {
        render(<PaginationControls params={params} total={0} />);

        expect(screen.getByText("No results")).toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
});
