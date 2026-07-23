import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Client } from "pg";
import type { TestProject } from "vitest/node";

export default async function setup(project: TestProject) {
    const container = await new PostgreSqlContainer("postgres:17")
        .withReuse()
        .start();
    const databaseUrl = container.getConnectionUri();

    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await client.end();

    execSync("pnpm exec prisma migrate deploy", {
        cwd: fileURLToPath(new URL("../../../", import.meta.url)),
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "inherit",
    });

    project.provide("databaseUrl", databaseUrl);
}
