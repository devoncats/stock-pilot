import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";
import { IsoWeek } from "./iso-week.js";

const originalTimezone = process.env.TZ;

describe("IsoWeek", () => {
    beforeAll(() => {
        process.env.TZ = "America/Bogota";
    });

    afterAll(() => {
        process.env.TZ = originalTimezone;
    });

    it("returns the Monday of the week for a Wednesday", () => {
        const wednesday = new Date("2026-07-22T12:00:00Z");
        const isoWeek = IsoWeek.fromDate(wednesday);

        expect(isoWeek.toString()).toBe("2026-07-20");
    });

    it("is idempotent on a Monday", () => {
        const monday = new Date("2026-07-20T12:00:00Z");
        const isoWeek = IsoWeek.fromDate(monday);

        expect(isoWeek.toString()).toBe("2026-07-20");
    });

    it("puts Sunday in the week that started the previous Monday", () => {
        const sunday = new Date("2026-07-26T23:59:59.999Z");
        const isoWeek = IsoWeek.fromDate(sunday);

        expect(isoWeek.toString()).toBe("2026-07-20");
    });

    it("computes in UTC, not local time, just after the Monday boundary", () => {
        const monday = new Date("2026-07-20T00:30:00Z");
        const isoWeek = IsoWeek.fromDate(monday);

        expect(isoWeek.toString()).toBe("2026-07-20");
    });

    it("computes in UTC, not local time, just before the Monday boundary", () => {
        const sunday = new Date("2026-07-19T23:30:00Z");
        const isoWeek = IsoWeek.fromDate(sunday);

        expect(isoWeek.toString()).toBe("2026-07-13");
    });

    it("crosses the year boundary into the previous December", () => {
        const sunday = new Date("2026-01-04T23:30:00Z");
        const isoWeek = IsoWeek.fromDate(sunday);

        expect(isoWeek.toString()).toBe("2025-12-29");
    });

    it("normalises to midnight UTC so the DATE column keeps its ISODOW", () => {
        const monday = new Date("2026-07-20T12:00:00Z");
        const isoWeek = IsoWeek.fromDate(monday);

        expect(isoWeek.value.toISOString()).toBe("2026-07-20T00:00:00.000Z");
    });

    it("rejects invalid dates", () => {
        expect(() => IsoWeek.fromDate(new Date("invalid date"))).toThrow(
            InvalidValueError,
        );
    });

    it("does not expose a mutable reference", () => {
        const monday = new Date("2026-07-20T12:00:00Z");
        const isoWeek = IsoWeek.fromDate(monday);

        isoWeek.value.setUTCDate(1);

        expect(isoWeek.toString()).toBe("2026-07-20");
    });

    it("compares by the Monday it represents", () => {
        const wednesday = new Date("2026-07-22T12:00:00Z");
        const friday = new Date("2026-07-24T12:00:00Z");
        const nextMonday = new Date("2026-07-27T12:00:00Z");

        const isoWeek1 = IsoWeek.fromDate(wednesday);
        const isoWeek2 = IsoWeek.fromDate(friday);
        const isoWeek3 = IsoWeek.fromDate(nextMonday);

        expect(isoWeek1.equals(isoWeek2)).toBe(true);
        expect(isoWeek1.equals(isoWeek3)).toBe(false);
    });
});
