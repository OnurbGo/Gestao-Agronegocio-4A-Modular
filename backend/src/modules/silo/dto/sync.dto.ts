import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from "class-validator";
import {
  PESAGEM_ORIGENS,
  PESAGEM_TIPOS_OPERACAO,
  PesagemOrigem,
  PesagemTipoOperacao,
} from "../enums/silo.enums";
import { emptyToNull, toBoolean } from "./common.dto";

export class SincronizarPesagemDto {
  @IsUUID()
  client_request_id!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MinLength(3)
  balanca_client_id!: string;

  @IsOptional()
  @IsEnum(PESAGEM_ORIGENS)
  origem: PesagemOrigem = "DESKTOP_OFFLINE";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  romaneio_range_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  serie_romaneio_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  numero_romaneio!: number;

  @IsEnum(PESAGEM_TIPOS_OPERACAO)
  tipo_operacao!: PesagemTipoOperacao;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  lote_operacional_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  conta_produto_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  item_id!: number;

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
  @IsInt()
  @Min(1)
  destino_id!: number;

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

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pesagem_1_kg!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pesagem_2_kg!: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  umidade_percentual?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  impureza_percentual?: number;

  @IsDateString()
  created_at_local!: string;

  @Transform(({ value }) => toBoolean(value))
  @IsOptional()
  @IsBoolean()
  finalizar = true;

  @Transform(({ value }) => toBoolean(value))
  @IsOptional()
  @IsBoolean()
  permitir_saldo_negativo = false;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  justificativa?: string | null;
}

export type SincronizarPesagemInput = SincronizarPesagemDto;
