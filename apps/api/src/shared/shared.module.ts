import { Global, Module } from "@nestjs/common";
import { CLOCK } from "@/shared/application/ports/clock.js";
import { SystemClock } from "@/shared/clock/system-clock.js";

@Global()
@Module({
    providers: [{ provide: CLOCK, useClass: SystemClock }],
    exports: [CLOCK],
})
export class SharedModule {}
