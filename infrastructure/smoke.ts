import { spawnSync } from "node:child_process";

const COMPOSE_FILE = "infrastructure/docker-compose.yaml";
const HTTP_TIMEOUT_MS = 5_000;

type Check = {
    name: string;
    run: () => void | Promise<void>;
};

try {
    process.loadEnvFile();
} catch {
    // No .env yet — fall back to the documented defaults.
}

const apiPort = process.env.API_PORT ?? "8080";
const webPort = process.env.WEB_PORT ?? "3000";
const withApps = process.argv.includes("--apps");

function composeExec(service: string, command: string): string {
    const result = spawnSync(
        "docker",
        [
            "compose",
            "-f",
            COMPOSE_FILE,
            "exec",
            "-T",
            service,
            "sh",
            "-c",
            command,
        ],
        { encoding: "utf8" },
    );

    if (result.error) {
        throw new Error(`docker not available: ${result.error.message}`);
    }
    if (result.status !== 0) {
        throw new Error(
            result.stderr.trim() || `exited with code ${result.status}`,
        );
    }

    return result.stdout.trim();
}

async function httpGet(url: string): Promise<Response> {
    let response: Response;

    try {
        response = await fetch(url, {
            signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
        });
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`${url} unreachable: ${reason}`);
    }

    if (!response.ok) {
        throw new Error(`${url} returned ${response.status}, expected 200`);
    }

    return response;
}

function assertEquals(actual: string, expected: string, what: string): void {
    if (actual !== expected) {
        throw new Error(`${what}: expected "${expected}", got "${actual}"`);
    }
}

const backingChecks: Check[] = [
    {
        name: "db",
        run: () => {
            const output = composeExec(
                "db",
                'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select 1"',
            );
            assertEquals(output, "1", "SELECT 1");
        },
    },
    {
        name: "redis",
        run: () => {
            assertEquals(
                composeExec("redis", "redis-cli ping"),
                "PONG",
                "PING",
            );
        },
    },
];

const appChecks: Check[] = [
    {
        name: "api",
        run: async () => {
            const response = await httpGet(
                `http://localhost:${apiPort}/api/v1/health`,
            );

            let body: unknown;
            try {
                body = await response.json();
            } catch {
                throw new Error("/api/v1/health did not return valid JSON");
            }

            if (
                typeof body !== "object" ||
                body === null ||
                !("status" in body) ||
                body.status !== "ok"
            ) {
                throw new Error(
                    `/api/v1/health returned ${JSON.stringify(body)}, expected {"status":"ok"}`,
                );
            }
        },
    },
    {
        name: "web",
        run: async () => {
            await httpGet(`http://localhost:${webPort}/`);
        },
    },
];

const checks = withApps ? [...backingChecks, ...appChecks] : backingChecks;
let failed = 0;

for (const check of checks) {
    try {
        await check.run();
        console.log(`✔ ${check.name.padEnd(6)} ok`);
    } catch (error) {
        failed += 1;
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`✘ ${check.name.padEnd(6)} ${reason}`);
    }
}

console.log(
    failed === 0
        ? `\n${checks.length} checks passed`
        : `\n${failed} of ${checks.length} checks failed`,
);

process.exitCode = failed === 0 ? 0 : 1;
