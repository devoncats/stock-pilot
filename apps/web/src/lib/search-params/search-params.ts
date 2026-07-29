/** What Next hands back for a single entry in `searchParams`. */
export type SearchParamValue = string | string[] | undefined;

/**
 * `?page=2&page=9` is a legal URL and arrives as `["2", "9"]`. Every param
 * reader takes the first value rather than letting an array reach `Number`
 * or a comparison and become `NaN`/never-matching.
 */
export function firstValue(raw: SearchParamValue): string | undefined {
    return Array.isArray(raw) ? raw[0] : raw;
}
