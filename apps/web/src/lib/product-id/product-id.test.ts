import { describe, expect, it } from "vitest";
import { isProductId } from "./product-id";

describe("isProductId", () => {
    it("accepts a UUIDv7 as issued by the API", () => {
        expect(isProductId("019f9e1d-b7db-7f75-8b8d-89eba2b2d6b4")).toBe(true);
    });

    it("accepts uppercase hex", () => {
        expect(isProductId("019F9E1D-B7DB-7F75-8B8D-89EBA2B2D6B4")).toBe(true);
    });

    it.each([
        "fdassgsdfgsdfgsdfgs",
        "",
        "019f9e1d-b7db-7f75-8b8d",
        "019f9e1d-b7db-7f75-8b8d-89eba2b2d6b4-extra",
        "019f9e1d_b7db_7f75_8b8d_89eba2b2d6b4",
        "zzzzzzzz-b7db-7f75-8b8d-89eba2b2d6b4",
    ])("rejects %o", (value) => {
        expect(isProductId(value)).toBe(false);
    });
});
