import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";

export type AverageWeeklyDemandInput = {
    totalQty: number;
    windowWeeks: number;
};

export function calculateAverageWeeklyDemand(
    input: AverageWeeklyDemandInput,
): number {
    if (input.windowWeeks === 0) {
        throw new InvalidValueError(
            "[calculateAverageWeeklyDemand]: windowWeeks cannot be 0",
        );
    }

    if (input.windowWeeks < 0) {
        throw new InvalidValueError(
            "[calculateAverageWeeklyDemand]: windowWeeks cannot be negative",
        );
    }

    if (!Number.isInteger(input.windowWeeks)) {
        throw new InvalidValueError(
            "[calculateAverageWeeklyDemand]: windowWeeks must be an integer",
        );
    }

    if (input.totalQty < 0) {
        throw new InvalidValueError(
            "[calculateAverageWeeklyDemand]: totalQty cannot be negative",
        );
    }

    if (!Number.isInteger(input.totalQty)) {
        throw new InvalidValueError(
            "[calculateAverageWeeklyDemand]: totalQty must be an integer",
        );
    }

    return input.totalQty / input.windowWeeks;
}
