import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";
import { emptyToNull } from "./common.dto";

export class ReservarFaixaRomaneioDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MinLength(3)
  balanca_client_id!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  quantidade!: number;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export type ReservarFaixaRomaneioInput = ReservarFaixaRomaneioDto;
