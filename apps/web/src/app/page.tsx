import { redirect } from "next/navigation";
import { INVENTORY_PATH } from "@/lib/inventory-params/inventory-params";

/**
 * The dashboard has one entry point. `/` exists only to send visitors to it.
 */
export default function Home() {
    redirect(INVENTORY_PATH);
}
