import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
    try {
        process.loadEnvFile("../../.env");
    } catch {
        console.warn("No .env file found, relying on environment variables");
    }

    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: true }),
    );

    app.setGlobalPrefix("api/v1");

    await app.listen(process.env.PORT ?? 8080);
}

bootstrap();
