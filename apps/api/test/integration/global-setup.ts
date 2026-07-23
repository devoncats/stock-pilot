import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

export default async function setup(project: TestProject) {
    const container = await new PostgreSqlContainer("postgres:17")
        .withReuse()
        .start();
    const databaseUrl = container.getConnectionUri();

    execSync("pnpm exec prisma migrate deploy", {
        cwd: fileURLToPath(new URL("../../", import.meta.url)),
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "inherit",
    });

    project.provide("databaseUrl", databaseUrl);
}
