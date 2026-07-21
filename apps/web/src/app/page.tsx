import { isHealthStatus } from "@stock-pilot/shared";

export default function Home() {
    const ok = isHealthStatus({ status: "ok" });

    return (
        <main>
            <h1>StockPilot</h1>
            <p>Shared contract wired: {ok ? "yes" : "no"}</p>
        </main>
    );
}
