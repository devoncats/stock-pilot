/**
 * Every failure crossing the API boundary, in one shape `error.tsx` can
 * render and the detail route can inspect.
 *
 * `status` is `null` when the request never got a response at all — the
 * API being down looks different from the API saying no, and the UI should
 * be able to tell the difference.
 */
export class ApiError extends Error {
    constructor(
        message: string,
        readonly status: number | null,
        readonly path: string,
    ) {
        super(message);
        this.name = "ApiError";
    }

    get isNotFound(): boolean {
        return this.status === 404;
    }
}
