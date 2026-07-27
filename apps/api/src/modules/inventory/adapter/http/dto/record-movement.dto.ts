import { IsInt, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class RecordMovementDto {
    @IsUUID()
    productId!: string;

    @IsInt()
    qty!: number;

    @IsString()
    @IsNotEmpty()
    reason!: string;
}
