import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./shared/prisma/prisma.module.js";

@Module({
    imports: [HealthModule, PrismaModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
