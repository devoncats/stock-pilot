import { exit } from "node:process";
import { HEALTH_CHECK_PATH } from "@stock-pilot/shared";

const port = process.env.PORT || 8080;
const timeout = AbortSignal.timeout(4000);

try {
    const response = await fetch(
        `http://localhost:${port}${HEALTH_CHECK_PATH}`,
        { signal: timeout },
    );
    exit(response.ok ? 0 : 1);
} catch (error) {
    console.error(`[health-check] Error: ${error}`);
    exit(1);
}
