import { Injectable } from "@nestjs/common";
import type { HealthStatus } from "@stock-pilot/shared";

@Injectable()
export class HealthService {
    healthCheck(): HealthStatus {
        return { status: "ok" };
    }
}
