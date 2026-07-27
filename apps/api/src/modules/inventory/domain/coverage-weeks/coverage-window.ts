import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";

export const COVERAGE_WINDOW_WEEKS = 13;

export function coverageWindowStart(anchor: Date): Date {
    if (Number.isNaN(anchor.getTime())) {
        throw new InvalidValueError(
            "[coverageWindowStart]: anchor must be a valid date",
        );
    }

    const start = new Date(anchor);

    start.setUTCDate(start.getUTCDate() - (COVERAGE_WINDOW_WEEKS - 1) * 7);

    return start;
}
