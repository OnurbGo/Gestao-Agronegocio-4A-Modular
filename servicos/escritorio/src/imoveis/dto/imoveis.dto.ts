import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  MinLength,
} from "class-validator";
import { PaginationQuery } from "../../shared/utils/pagination";

function emptyToNull(value: unknown) {
  return value === "" || value === undefined ? null : value;
}

export class ImovelDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  codigo?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  matricula?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  lote?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  municipio?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  n_lote?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  gleba?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  colonia?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  nirf?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  incra?: string | null;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  proprietarios_ids?: number[];

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  area_total?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  area_agricultavel?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  cep?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  logradouro?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  numero?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  bairro?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  cidade?: string | null;

  @Transform(({ value }) =>
    typeof value === "string" && value ? value.toUpperCase() : value || null,
  )
  @IsOptional()
  @Length(2, 2)
  estado?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  complemento?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo = true;
}

export class AtualizarImovelDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  codigo?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  matricula?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  lote?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  municipio?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  n_lote?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  gleba?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  colonia?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  nirf?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  incra?: string | null;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  proprietarios_ids?: number[];

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  area_total?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  area_agricultavel?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  cep?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  logradouro?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  numero?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  bairro?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  cidade?: string | null;

  @Transform(({ value }) =>
    typeof value === "string" && value ? value.toUpperCase() : value || null,
  )
  @IsOptional()
  @Length(2, 2)
  estado?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  complemento?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class ImovelIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class ListarImoveisQueryDto implements PaginationQuery {
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

  @IsOptional()
  @IsString()
  termo?: string;

  @IsOptional()
  @IsString()
  municipio?: string;

  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export type ImovelInput = ImovelDto;
export type AtualizarImovelInput = Partial<ImovelDto>;
export type ListarImoveisQuery = ListarImoveisQueryDto;

