import { Injectable } from "@nestjs/common";
import { uuidv7 } from "uuidv7";
import type { IdGenerator } from "@/shared/application/ports/id-generator.js";

@Injectable()
export class UuidV7IdGenerator implements IdGenerator {
    next(): string {
        return uuidv7();
    }
}
