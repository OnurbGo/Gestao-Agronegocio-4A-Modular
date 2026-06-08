import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import { emptyToNull, ListarBaseQueryDto } from "./common.dto";

export class ContaProdutoDto {
  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  entidade_id_ref?: number | null;

  @IsString()
  @MinLength(2)
  nome!: string;

  @Transform(({ value }) =>
    typeof value === "string" && value ? value.replace(/\D/g, "") : null,
  )
  @IsOptional()
  @IsString()
  documento?: string | null;

  @IsOptional()
  @IsBoolean()
  ativa = true;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export class AtualizarContaProdutoDto {
  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  entidade_id_ref?: number | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @Transform(({ value }) =>
    typeof value === "string" && value ? value.replace(/\D/g, "") : null,
  )
  @IsOptional()
  @IsString()
  documento?: string | null;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export class ItemDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @IsString()
  @MinLength(1)
  unidade_medida = "KG";

  @IsOptional()
  @IsBoolean()
  controla_estoque = true;

  @IsOptional()
  @IsBoolean()
  exige_classificacao = true;

  @IsOptional()
  @IsBoolean()
  ativo = true;
}

export class AtualizarItemDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  unidade_medida?: string;

  @IsOptional()
  @IsBoolean()
  controla_estoque?: boolean;

  @IsOptional()
  @IsBoolean()
  exige_classificacao?: boolean;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class TransportadoraDto {
  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  entidade_id_ref?: number | null;

  @IsString()
  @MinLength(2)
  nome!: string;

  @Transform(({ value }) =>
    typeof value === "string" && value ? value.replace(/\D/g, "") : null,
  )
  @IsOptional()
  @IsString()
  documento?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  telefone?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;

  @IsOptional()
  @IsBoolean()
  ativa = true;
}

export class AtualizarTransportadoraDto {
  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  entidade_id_ref?: number | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @Transform(({ value }) =>
    typeof value === "string" && value ? value.replace(/\D/g, "") : null,
  )
  @IsOptional()
  @IsString()
  documento?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  telefone?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}

export class EmissorDto {
  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  entidade_id_ref?: number | null;

  @IsString()
  @MinLength(2)
  nome!: string;

  @Transform(({ value }) =>
    typeof value === "string" && value ? value.replace(/\D/g, "") : null,
  )
  @IsOptional()
  @IsString()
  documento?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo = true;
}

export class AtualizarEmissorDto {
  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  entidade_id_ref?: number | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @Transform(({ value }) =>
    typeof value === "string" && value ? value.replace(/\D/g, "") : null,
  )
  @IsOptional()
  @IsString()
  documento?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class DepositoDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  descricao?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo = true;
}

export class AtualizarDepositoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  descricao?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class DestinoDto extends DepositoDto {}
export class AtualizarDestinoDto extends AtualizarDepositoDto {}

export class SerieRomaneioDto {
  @IsString()
  @MinLength(1)
  numero_serie!: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  proximo_numero = 1;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  motivo_abertura?: string | null;
}

export class ListarCadastrosQueryDto extends ListarBaseQueryDto {}

export type ContaProdutoInput = ContaProdutoDto;
export type AtualizarContaProdutoInput = AtualizarContaProdutoDto;
export type ItemInput = ItemDto;
export type AtualizarItemInput = AtualizarItemDto;
export type TransportadoraInput = TransportadoraDto;
export type AtualizarTransportadoraInput = AtualizarTransportadoraDto;
export type EmissorInput = EmissorDto;
export type AtualizarEmissorInput = AtualizarEmissorDto;
export type DepositoInput = DepositoDto;
export type AtualizarDepositoInput = AtualizarDepositoDto;
export type DestinoInput = DestinoDto;
export type AtualizarDestinoInput = AtualizarDestinoDto;
export type SerieRomaneioInput = SerieRomaneioDto;
