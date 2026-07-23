import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// El .env canónico vive en la raíz del monorepo. Resolverlo relativo a este
// archivo (no al cwd) hace que el CLI encuentre DATABASE_URL sin importar
// desde dónde se invoque. env() se resuelve al cargar el config, no es lazy.
config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: { path: "prisma/migrations" },
    datasource: { url: env("DATABASE_URL") },
});
