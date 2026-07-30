export type QueryValue = string | number | undefined;

/**
 * Builds the query portion of an API URL, including the leading `?`, or an
 * empty string when nothing survives.
 *
 * Values that are `undefined` or empty strings are dropped rather than
 * serialised. The API validates with `forbidNonWhitelisted: true` and
 * `@IsIn(...)` on `sort`/`dir` (F1-03), so a stray `sort=undefined` would
 * come back as a 400 for the whole page, not a quietly ignored param.
 */
export function toQueryString(params: Record<string, QueryValue>): string {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === "") {
            continue;
        }

        search.set(key, String(value));
    }

    const query = search.toString();

    return query === "" ? "" : `?${query}`;
}
