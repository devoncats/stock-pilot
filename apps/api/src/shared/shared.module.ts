import { Global, Module } from "@nestjs/common";
import { ID_GENERATOR } from "@/modules/inventory/application/commands/ports/id-generator.js";
import { CLOCK } from "@/shared/application/ports/clock.js";
import { TRANSACTION_MANAGER } from "@/shared/application/ports/transaction-manager.js";
import { SystemClock } from "@/shared/clock/system-clock.js";
import { UuidV7IdGenerator } from "@/shared/id-generator/uuid-v7-id-generator.js";
import { PrismaTransactionManager } from "@/shared/prisma/prisma-transaction.manager.js";
import { TransactionContext } from "@/shared/prisma/transaction-context.js";

@Global()
@Module({
    providers: [
        { provide: CLOCK, useClass: SystemClock },
        { provide: TRANSACTION_MANAGER, useClass: PrismaTransactionManager },
        { provide: ID_GENERATOR, useClass: UuidV7IdGenerator },
    ],
    exports: [TransactionContext, CLOCK, TRANSACTION_MANAGER, ID_GENERATOR],
})
export class SharedModule {}
