import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import {
  PESAGEM_STATUS,
  PESAGEM_TIPOS_OPERACAO,
  PesagemStatus,
  PesagemTipoOperacao,
} from "../enums/silo.enums";
import { emptyToNull, ListarBaseQueryDto } from "./common.dto";

export class PesagemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lote_operacional_id!: number;

  @IsEnum(PESAGEM_TIPOS_OPERACAO)
  tipo_operacao!: PesagemTipoOperacao;

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

  @Type(() => Number)
  @IsInt()
  @Min(1)
  transportadora_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  emissor_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  deposito_id!: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  destino_id?: number;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  contrato_id?: number | null;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MinLength(3)
  placa!: string;

  @IsString()
  @MinLength(2)
  motorista_nome!: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export class AtualizarPesagemDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  lote_operacional_id?: number;

  @IsOptional()
  @IsEnum(PESAGEM_TIPOS_OPERACAO)
  tipo_operacao?: PesagemTipoOperacao;

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

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  transportadora_id?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  emissor_id?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  deposito_id?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  destino_id?: number;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  contrato_id?: number | null;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(3)
  placa?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  motorista_nome?: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export class RegistrarPesagemDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  peso_kg!: number;
}

export class ClassificarPesagemDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  umidade_percentual!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  impureza_percentual!: number;
}

export class FinalizarPesagemDto {
  @IsOptional()
  @IsBoolean()
  permitir_saldo_negativo = false;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  justificativa?: string | null;
}

export class CancelarPesagemDto {
  @IsString()
  @MinLength(5)
  justificativa!: string;
}

export class ListarPesagensQueryDto extends ListarBaseQueryDto {
  @IsOptional()
  @IsEnum(PESAGEM_STATUS)
  status?: PesagemStatus;

  @IsOptional()
  @IsEnum(PESAGEM_TIPOS_OPERACAO)
  tipo_operacao?: PesagemTipoOperacao;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  lote_operacional_id?: number;

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

export type PesagemInput = PesagemDto;
export type AtualizarPesagemInput = AtualizarPesagemDto;
export type ListarPesagensQuery = ListarPesagensQueryDto;
