import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { InventoryParams } from "@/lib/inventory-params/inventory-params";
import { SearchForm } from "./search-form";

const params: InventoryParams = {
    search: undefined,
    page: 1,
    limit: 25,
    sort: "sku",
    dir: "asc",
};

describe("SearchForm", () => {
    it("keeps the current search term in the box", () => {
        render(<SearchForm params={{ ...params, search: "widget" }} />);

        expect(
            screen.getByRole("searchbox", { name: /search by sku or name/i }),
        ).toHaveValue("widget");
    });

    it("starts empty when nothing is searched", () => {
        render(<SearchForm params={params} />);

        expect(screen.getByRole("searchbox")).toHaveValue("");
    });

    it("navigates by GET, so the result is a shareable URL", () => {
        const { container } = render(<SearchForm params={params} />);
        const form = container.querySelector("form");

        expect(form?.method).toBe("get");
        expect(form).toHaveAttribute("action", "/inventory");
    });

    it("carries a non-default sort through the search", () => {
        const { container } = render(
            <SearchForm params={{ ...params, sort: "value", dir: "desc" }} />,
        );

        expect(container.querySelector('input[name="sort"]')).toHaveValue(
            "value",
        );
        expect(container.querySelector('input[name="dir"]')).toHaveValue(
            "desc",
        );
    });

    it("omits sort and dir when they are already the default", () => {
        const { container } = render(<SearchForm params={params} />);

        expect(container.querySelector('input[name="sort"]')).toBeNull();
        expect(container.querySelector('input[name="dir"]')).toBeNull();
    });
});
