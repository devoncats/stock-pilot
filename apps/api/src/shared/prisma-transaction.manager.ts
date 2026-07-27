import { Injectable } from "@nestjs/common";
import type { TransactionManager } from "@/shared/application/ports/transaction-manager.js";
import { PrismaService } from "@/shared/prisma/prisma.service.js";
import { TransactionContext } from "@/shared/transaction-context.js";

const MAX_WAIT_MS = 5_000;
const TIMEOUT_MS = 15_000;

@Injectable()
export class PrismaTransactionManager implements TransactionManager {
    constructor(
        private readonly prisma: PrismaService,
        private readonly transactionContext: TransactionContext,
    ) {}

    runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
        if (this.transactionContext.isActive()) {
            return callback();
        }

        return this.prisma.$transaction(
            (tx) => this.transactionContext.run(tx, callback),
            {
                maxWait: MAX_WAIT_MS,
                timeout: TIMEOUT_MS,
            },
        );
    }
}
