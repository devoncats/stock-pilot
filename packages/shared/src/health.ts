export type HealthStatus = { status: "ok" };

export function isHealthStatus(value: unknown): value is HealthStatus {
    return false;
}
