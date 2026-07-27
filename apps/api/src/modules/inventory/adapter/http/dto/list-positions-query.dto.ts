import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import type {
    ListPositionsSort,
    SortDirection,
} from "@/modules/inventory/application/ports/inventory-query.repository.js";

const SORT_VALUES: ListPositionsSort[] = ["sku", "onHand", "value"];
const DIR_VALUES: SortDirection[] = ["asc", "desc"];

export class ListPositionsQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 25;

    @IsOptional()
    @IsIn(SORT_VALUES)
    sort?: ListPositionsSort;

    @IsOptional()
    @IsIn(DIR_VALUES)
    dir?: SortDirection;
}
