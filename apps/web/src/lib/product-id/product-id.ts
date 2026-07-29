/**
 * Mirrors `isUuid` in `apps/api/src/shared/domain/uuid` — the API's ids are
 * UUIDv7 but the check is version-agnostic, matching the API's own.
 *
 * A malformed id cannot identify a product, so the route answers 404 rather
 * than asking the API. That is also a workaround: `GET /inventory/:id`
 * currently 500s on a malformed id (Prisma P2007) and the movements route
 * 400s, so neither would produce the 404 this page needs.
 */
export function isProductId(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
    );
}
