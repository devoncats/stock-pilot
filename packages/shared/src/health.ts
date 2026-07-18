export type HealthStatus = { status: "ok" };

export function isHealthStatus(value: unknown): value is HealthStatus {
    return (
        typeof value === "object" &&
        value !== null &&
        "status" in value &&
        value.status === "ok"
    );
}
