import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
    oxc: false,
    resolve: { tsconfigPaths: true },
    plugins: [
        swc.vite({
            module: { type: "es6" },
            jsc: {
                parser: {
                    syntax: "typescript",
                    decorators: true,
                },
                transform: {
                    legacyDecorator: true,
                    decoratorMetadata: true,
                },
            },
        }),
    ],
    test: {
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            exclude: [
                "src/generated/**",
                "**/ports/**",
                "**/*.module.ts",
                "**/*.dto.ts",
                "src/main.ts",
                "src/health-check.ts",
                "src/app.setup.ts",
            ],
            thresholds: {
                perFile: true,
                "src/modules/**/domain/**": {
                    lines: 95,
                    functions: 95,
                    branches: 95,
                },
                "src/modules/**/application/**": {
                    lines: 95,
                    functions: 95,
                    branches: 95,
                },
                "src/shared/domain/**": {
                    lines: 95,
                    functions: 95,
                    branches: 95,
                },
            },
        },
        projects: [
            {
                extends: true,
                test: {
                    name: "unit",
                    environment: "node",
                    include: ["src/**/*.spec.ts"],
                },
            },
            {
                extends: true,
                test: {
                    name: "integration",
                    environment: "node",
                    include: ["test/**/*.int-spec.ts"],
                    globalSetup: ["./test/integration/support/global-setup.ts"],
                    setupFiles: ["./test/integration/support/env.ts"],
                    fileParallelism: false,
                },
            },
            {
                extends: true,
                test: {
                    name: "e2e",
                    environment: "node",
                    include: ["test/**/*.e2e-spec.ts"],
                    globalSetup: ["./test/integration/support/global-setup.ts"],
                    setupFiles: ["./test/integration/support/env.ts"],
                    fileParallelism: false,
                },
            },
        ],
    },
});
