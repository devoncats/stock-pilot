import { describe, expect, it } from "vitest";
import {
    buildInventoryHref,
    type InventoryParams,
    movementsPageHref,
    pageHref,
    parseInventoryParams,
    positionHref,
    sortHref,
} from "./inventory-params";

const defaults: InventoryParams = {
    search: undefined,
    page: 1,
    limit: 25,
    sort: "sku",
    dir: "asc",
};

describe("buildInventoryHref", () => {
    it("omits every param that is already the default", () => {
        expect(buildInventoryHref(defaults)).toBe("/inventory");
    });

    it("keeps a search term", () => {
        expect(buildInventoryHref(defaults, { search: "widget" })).toBe(
            "/inventory?search=widget",
        );
    });

    it("keeps a non-default sort and direction", () => {
        expect(
            buildInventoryHref(defaults, { sort: "value", dir: "desc" }),
        ).toBe("/inventory?sort=value&dir=desc");
    });

    it("preserves the other params when changing one", () => {
        expect(
            buildInventoryHref(
                { ...defaults, search: "syn", sort: "value", dir: "desc" },
                { page: 2 },
            ),
        ).toBe("/inventory?search=syn&sort=value&dir=desc&page=2");
    });

    it("drops a search term that is cleared", () => {
        expect(
            buildInventoryHref(
                { ...defaults, search: "widget" },
                {
                    search: undefined,
                },
            ),
        ).toBe("/inventory");
    });
});

describe("sortHref", () => {
    it("sorts ascending on a new column", () => {
        expect(sortHref(defaults, "value")).toBe("/inventory?sort=value");
    });

    it("flips direction when the column is already active", () => {
        expect(sortHref({ ...defaults, sort: "value" }, "value")).toBe(
            "/inventory?sort=value&dir=desc",
        );
    });

    it("flips back to ascending on a third click", () => {
        expect(
            sortHref({ ...defaults, sort: "value", dir: "desc" }, "value"),
        ).toBe("/inventory?sort=value");
    });

    it("returns to page 1, since the old page may not exist in the new order", () => {
        expect(sortHref({ ...defaults, page: 3 }, "value")).toBe(
            "/inventory?sort=value",
        );
    });
});

describe("pageHref", () => {
    it("keeps the search and sort while moving pages", () => {
        expect(
            pageHref(
                { ...defaults, search: "syn", sort: "onHand", dir: "desc" },
                4,
            ),
        ).toBe("/inventory?search=syn&sort=onHand&dir=desc&page=4");
    });
});

describe("parseInventoryParams", () => {
    it("returns defaults for a bare URL", () => {
        expect(parseInventoryParams({})).toEqual(defaults);
    });

    it("reads every param", () => {
        expect(
            parseInventoryParams({
                search: "widget",
                page: "3",
                limit: "50",
                sort: "value",
                dir: "desc",
            }),
        ).toEqual({
            search: "widget",
            page: 3,
            limit: 50,
            sort: "value",
            dir: "desc",
        });
    });

    it("treats a blank search as no search", () => {
        expect(parseInventoryParams({ search: "   " }).search).toBeUndefined();
    });

    it("trims a search term", () => {
        expect(parseInventoryParams({ search: "  widget  " }).search).toBe(
            "widget",
        );
    });

    it("falls back on hand-edited nonsense rather than forwarding it", () => {
        expect(
            parseInventoryParams({
                page: "abc",
                limit: "9999",
                sort: "banana",
                dir: "sideways",
            }),
        ).toEqual({
            search: undefined,
            page: 1,
            limit: 100,
            sort: "sku",
            dir: "asc",
        });
    });

    it("round-trips a URL it built", () => {
        const params: InventoryParams = {
            search: "syn",
            page: 2,
            limit: 25,
            sort: "value",
            dir: "desc",
        };
        const href = buildInventoryHref(params);
        const query = Object.fromEntries(
            new URLSearchParams(href.split("?")[1] ?? ""),
        );

        expect(parseInventoryParams(query)).toEqual(params);
    });
});

describe("positionHref", () => {
    it("links to a SKU's detail page", () => {
        expect(positionHref("019f9e1d-b7db-7f75")).toBe(
            "/inventory/019f9e1d-b7db-7f75",
        );
    });

    it("escapes an id that would otherwise change the path", () => {
        expect(positionHref("a/b")).toBe("/inventory/a%2Fb");
    });
});

describe("movementsPageHref", () => {
    it("omits page 1, so the first page has one canonical URL", () => {
        expect(movementsPageHref("abc", 1)).toBe("/inventory/abc");
    });

    it("carries a later page", () => {
        expect(movementsPageHref("abc", 3)).toBe("/inventory/abc?page=3");
    });
});
