import { Transform, Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import {
  LOTE_OPERACIONAL_STATUS,
  LOTE_OPERACIONAL_TIPOS,
  LoteOperacionalStatus,
  LoteOperacionalTipo,
} from "../enums/silo.enums";
import { emptyToNull, ListarBaseQueryDto } from "./common.dto";

export class LoteOperacionalDto {
  @IsString()
  @MinLength(3)
  nome!: string;

  @IsEnum(LOTE_OPERACIONAL_TIPOS)
  tipo!: LoteOperacionalTipo;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  conta_produto_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  item_id!: number;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  contrato_id?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  imovel_id_ref?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  area_lote_id_ref?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  safra_id_ref?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  destino_id?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export class AtualizarLoteOperacionalDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nome?: string;

  @IsOptional()
  @IsEnum(LOTE_OPERACIONAL_TIPOS)
  tipo?: LoteOperacionalTipo;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  conta_produto_id?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  item_id?: number;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  contrato_id?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  imovel_id_ref?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  area_lote_id_ref?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  safra_id_ref?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  destino_id?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export class AcaoLoteDto {
  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  justificativa?: string | null;
}

export class ListarLotesOperacionaisQueryDto extends ListarBaseQueryDto {
  @IsOptional()
  @IsEnum(LOTE_OPERACIONAL_TIPOS)
  tipo?: LoteOperacionalTipo;

  @IsOptional()
  @IsEnum(LOTE_OPERACIONAL_STATUS)
  status?: LoteOperacionalStatus;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  conta_produto_id?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  item_id?: number;
}

export type LoteOperacionalInput = LoteOperacionalDto;
export type AtualizarLoteOperacionalInput = AtualizarLoteOperacionalDto;
export type ListarLotesOperacionaisQuery = ListarLotesOperacionaisQueryDto;
