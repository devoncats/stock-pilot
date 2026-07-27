import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "@/app.module.js";
import { configureApp } from "@/app.setup.js";

describe("Health (e2e)", () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = configureApp(moduleRef.createNestApplication());
        await app.init();
    });

    afterAll(async () => {
        await app?.close();
    });

    it("GET /api/v1/health returns 200 with an ok status", async () => {
        const response = await request(app.getHttpServer()).get(
            "/api/v1/health",
        );

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ok" });
    });
});
