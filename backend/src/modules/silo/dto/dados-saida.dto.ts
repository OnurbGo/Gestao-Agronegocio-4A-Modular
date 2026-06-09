import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { emptyToNull, ListarBaseQueryDto } from "./common.dto";

export class DadosSaidaPesagemDto {
  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  numero_nota_fiscal?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  peso_nf_kg?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  peso_nf_sacas?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_total?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  senar_valor?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  funrural_valor?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  icms_valor?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  frete_valor?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  corretagem_valor?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  royalties_valor?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  cad_pro?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  imovel_emissor_id_ref?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export class ListarDadosSaidaQueryDto extends ListarBaseQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  lote_operacional_id?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  pesagem_id?: number;
}

export type DadosSaidaPesagemInput = DadosSaidaPesagemDto;
export type ListarDadosSaidaQuery = ListarDadosSaidaQueryDto;
