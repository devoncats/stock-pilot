import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

const SORT_VALUES = ["sku", "onHand", "value"] as const;
export type SortValue = (typeof SORT_VALUES)[number];

const DIR_VALUES = ["asc", "desc"] as const;
export type DirValue = (typeof DIR_VALUES)[number];

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
