import { Transform } from 'class-transformer';
import { IsInt, Min, ValidateIf } from 'class-validator';

export class PaginationQueryDto {
    @ValidateIf((_, value) => !isNaN(Number(value)))
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    page: number = 1;

    @ValidateIf((_, value) => !isNaN(Number(value)))
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    limit: number = 10;
}