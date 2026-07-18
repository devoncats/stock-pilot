import { Controller, Get } from "@nestjs/common";
import type { HealthStatus } from "@stock-pilot/shared";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    healthCheck(): HealthStatus {
        return this.healthService.healthCheck();
    }
}
