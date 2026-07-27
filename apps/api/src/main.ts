import { NestFactory } from "@nestjs/core";
import { configureApp } from "@/app.setup.js";
import { AppModule } from "./app.module.js";

async function bootstrap() {
    try {
        process.loadEnvFile("../../.env");
    } catch {
        console.warn("No .env file found, relying on environment variables");
    }

    const app = configureApp(await NestFactory.create(AppModule));

    await app.listen(process.env.PORT ?? 8080);
}

bootstrap().catch((error: unknown) => {
    console.error("[bootstrap]: Failed to bootstrap the application", error);
    process.exit(1);
});
