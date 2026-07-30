import Link from "next/link";
import { INVENTORY_PATH } from "@/lib/inventory-params/inventory-params";

export default function PositionNotFound() {
    return (
        <main className="mx-auto w-full max-w-6xl p-6">
            <h1 className="font-semibold text-2xl">SKU not found</h1>

            <p className="mt-2 text-black/70 dark:text-white/70">
                No inventory position exists for that product id.
            </p>

            <Link
                href={INVENTORY_PATH}
                className="mt-6 inline-block text-sm underline underline-offset-2"
            >
                ← Back to inventory
            </Link>
        </main>
    );
}
