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
import { TIPOS_DESCONTO, TipoDesconto } from "../enums/silo.enums";
import { emptyToNull, ListarBaseQueryDto } from "./common.dto";

export class TabelaDescontoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  item_id!: number;

  @IsString()
  @MinLength(2)
  nome!: string;

  @IsOptional()
  @IsBoolean()
  ativa = true;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  vigencia_inicio?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  vigencia_fim?: string | null;
}

export class AtualizarTabelaDescontoDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  item_id?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  vigencia_inicio?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  vigencia_fim?: string | null;
}

export class FaixaDescontoDto {
  @IsEnum(TIPOS_DESCONTO)
  tipo!: TipoDesconto;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_inicial!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_final!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  percentual_desconto!: number;

  @IsOptional()
  @IsBoolean()
  ativa = true;
}

export class AtualizarFaixaDescontoDto {
  @IsOptional()
  @IsEnum(TIPOS_DESCONTO)
  tipo?: TipoDesconto;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_inicial?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_final?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  percentual_desconto?: number;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}

export class CalcularDescontoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  item_id!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  peso_liquido_kg!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  umidade_percentual!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  impureza_percentual!: number;
}

export class ListarTabelasDescontoQueryDto extends ListarBaseQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  item_id?: number;
}

export type TabelaDescontoInput = TabelaDescontoDto;
export type AtualizarTabelaDescontoInput = AtualizarTabelaDescontoDto;
export type FaixaDescontoInput = FaixaDescontoDto;
export type AtualizarFaixaDescontoInput = AtualizarFaixaDescontoDto;
