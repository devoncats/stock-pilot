/**
 * Integer cents in, a display string out: `123456` → `"$1,234.56"`.
 *
 * The API sends and sums money as integer cents (F1-03) precisely so no
 * float ever accumulates. The single division here is the last step before
 * display and never feeds another calculation; `Intl` rounds to two
 * fraction digits, so the cents it prints are exact.
 */
export function formatMoneyCents(cents: number): string {
    return (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}
