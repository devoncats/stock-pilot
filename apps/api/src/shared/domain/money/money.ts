import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";

export class Money {
    private constructor(private readonly _cents: number) {}

    static fromCents(cents: number): Money {
        if (!Number.isInteger(cents)) {
            throw new InvalidValueError(
                `[Money]: Cents must be an integer, got ${cents}`,
            );
        }

        if (cents < 0) {
            throw new InvalidValueError(
                `[Money]: Cents must be a non-negative number, got ${cents}`,
            );
        }

        return new Money(cents);
    }

    static fromDecimalString(value: string): Money {
        const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());

        if (!match) {
            throw new InvalidValueError(
                `[Money]: Invalid decimal string: ${value}`,
            );
        }

        const [, sign, whole, fraction = ""] = match;
        const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

        return Money.fromCents(sign === "-" ? -cents : cents);
    }

    get cents(): number {
        return this._cents;
    }

    toDecimalString(): string {
        const whole = Math.floor(this._cents / 100);
        const fraction = (this._cents % 100).toString().padStart(2, "0");

        return `${whole}.${fraction}`;
    }

    equals(other: Money): boolean {
        return this._cents === other._cents;
    }
}
