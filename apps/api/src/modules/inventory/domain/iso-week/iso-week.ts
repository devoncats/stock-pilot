import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";

export class IsoWeek {
    private constructor(private readonly _monday: Date) {}

    static fromDate(date: Date): IsoWeek {
        if (Number.isNaN(date.getTime())) {
            throw new InvalidValueError("[IsoWeek]: Invalid date");
        }

        const monday = new Date(
            Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
            ),
        );

        const isoDayOfWeek = monday.getUTCDay() === 0 ? 7 : monday.getUTCDay();

        monday.setUTCDate(monday.getUTCDate() - (isoDayOfWeek - 1));

        return new IsoWeek(monday);
    }

    get value(): Date {
        return new Date(this._monday.getTime());
    }

    equals(other: IsoWeek): boolean {
        return this._monday.getTime() === other._monday.getTime();
    }

    toString(): string {
        return this._monday.toISOString().slice(0, 10);
    }
}
