import { Transform, Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import { CONTRATO_STATUS, ContratoStatus } from "../enums/silo.enums";
import { emptyToNull, ListarBaseQueryDto } from "./common.dto";

export class ContratoDto {
  @IsString()
  @MinLength(1)
  numero_contrato!: string;

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
  comprador_entidade_id_ref?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  comprador_nome_cache?: string | null;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantidade_contratada_kg!: number;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  data_contrato?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export class AtualizarContratoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  numero_contrato?: string;

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
  comprador_entidade_id_ref?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  comprador_nome_cache?: string | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidade_contratada_kg?: number;

  @IsOptional()
  @IsEnum(CONTRATO_STATUS)
  status?: ContratoStatus;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  data_contrato?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export class CancelarContratoDto {
  @IsString()
  @MinLength(5)
  justificativa!: string;
}

export class ListarContratosQueryDto extends ListarBaseQueryDto {
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

  @IsOptional()
  @IsEnum(CONTRATO_STATUS)
  status?: ContratoStatus;
}

export type ContratoInput = ContratoDto;
export type AtualizarContratoInput = AtualizarContratoDto;
export type ListarContratosQuery = ListarContratosQueryDto;
