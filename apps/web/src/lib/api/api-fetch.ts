import { API_PREFIX } from "@stock-pilot/shared";
import { resolveApiBaseUrl } from "./api-base-url";
import { ApiError } from "./api-error";
import { type QueryValue, toQueryString } from "./query-string";

const API_PREFIX_PATH = `/${API_PREFIX}`;

/**
 * Server-only. Reads `API_URL` (see `resolveApiBaseUrl`) and always sends
 * `cache: "no-store"`: Next would otherwise serve a cached page and show
 * stock that an adjustment has already changed — the failure that costs an
 * inventory dashboard its credibility.
 */
export async function apiFetch<T>(
    path: string,
    params: Record<string, QueryValue> = {},
): Promise<T> {
    const baseUrl = resolveApiBaseUrl({
        API_URL: process.env.API_URL,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    });
    const url = `${baseUrl}${API_PREFIX_PATH}${path}${toQueryString(params)}`;

    let response: Response;

    try {
        response = await fetch(url, { cache: "no-store" });
    } catch {
        throw new ApiError(`Could not reach the API at ${url}.`, null, path);
    }

    if (!response.ok) {
        throw new ApiError(
            `The API responded ${response.status} for ${path}.`,
            response.status,
            path,
        );
    }

    return (await response.json()) as T;
}
