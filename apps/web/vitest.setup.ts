import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Testing Library registers this automatically only when Vitest globals are
 * enabled. This project sets `globals: false`, so without an explicit
 * `cleanup` every render stays mounted and later tests query a DOM
 * containing every previous test's output.
 */
afterEach(() => {
    cleanup();
});
