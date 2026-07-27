import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import {
    DIR_VALUES,
    type DirValue,
    SORT_VALUES,
    type SortValue,
} from "@/modules/inventory/application/queries/ports/inventory-query.repository.js";

export class ListPositionsQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset: number = 0;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 25;

    @IsOptional()
    @IsIn(SORT_VALUES)
    sort?: SortValue;

    @IsOptional()
    @IsIn(DIR_VALUES)
    dir?: DirValue;
}
