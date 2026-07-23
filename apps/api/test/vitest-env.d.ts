declare module "vitest" {
    interface ProvidedContext {
        databaseUrl: string;
    }
}

export {};
