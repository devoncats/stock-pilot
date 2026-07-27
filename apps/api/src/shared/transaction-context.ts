import { AsyncLocalStorage } from "node:async_hooks";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@/generated/prisma/client.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";

@Injectable()
export class TransactionContext {
    private readonly storage =
        new AsyncLocalStorage<Prisma.TransactionClient>();

    constructor(private readonly prisma: PrismaService) {}

    run<T>(
        client: Prisma.TransactionClient,
        callback: () => Promise<T>,
    ): Promise<T> {
        return this.storage.run(client, callback);
    }

    isActive(): boolean {
        return this.storage.getStore() !== undefined;
    }

    getClient(): Prisma.TransactionClient {
        return this.storage.getStore() ?? this.prisma;
    }

    requireTransaction(): Prisma.TransactionClient {
        const client = this.storage.getStore();

        if (!client) {
            throw new Error(
                "[TransactionContext]: No active transaction found in context",
            );
        }

        return client;
    }
}
