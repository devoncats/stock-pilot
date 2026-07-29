import { describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({ redirectMock: vi.fn() }));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import Home from "@/app/page";

describe("Home", () => {
    it("redirects to the inventory dashboard", () => {
        Home();

        expect(redirectMock).toHaveBeenCalledWith("/inventory");
    });
});
