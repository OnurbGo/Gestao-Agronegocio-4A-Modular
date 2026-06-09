import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { PaginationQuery } from "../../shared/utils/pagination";

export function emptyToNull(value: unknown) {
  return value === "" || value === undefined ? null : value;
}

export function toBoolean(value: unknown) {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

export class IdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class ListarBaseQueryDto implements PaginationQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @Transform(({ value }) => toBoolean(value))
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
