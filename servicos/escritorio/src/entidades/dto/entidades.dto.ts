import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  MinLength,
} from "class-validator";
import { PaginationQuery } from "../../shared/utils/pagination";

export const ENTIDADE_TIPOS = [
  "FUNCIONARIO",
  "PROPRIETARIO",
  "CLIENTE",
  "ARRENDATARIO",
] as const;

type EntidadeTipo = (typeof ENTIDADE_TIPOS)[number];

export class EntidadeDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.replace(/\D/g, "") : value,
  )
  @IsString()
  @MinLength(11)
  cpf_cnpj!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsEnum(["FISICA", "JURIDICA"])
  tipo_pessoa!: "FISICA" | "JURIDICA";

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  telefone?: string | null;

  @IsOptional()
  @IsString()
  celular?: string | null;

  @IsOptional()
  @IsString()
  cep?: string | null;

  @IsOptional()
  @IsString()
  logradouro?: string | null;

  @IsOptional()
  @IsString()
  numero?: string | null;

  @IsOptional()
  @IsString()
  bairro?: string | null;

  @IsOptional()
  @IsString()
  cidade?: string | null;

  @Transform(({ value }) =>
    typeof value === "string" && value ? value.toUpperCase() : value || null,
  )
  @IsOptional()
  @Length(2, 2)
  estado?: string | null;

  @IsOptional()
  @IsString()
  complemento?: string | null;

  @IsOptional()
  @IsString()
  data_nascimento?: string | null;

  @IsOptional()
  @IsString()
  nacionalidade?: string | null;

  @IsOptional()
  @IsString()
  filiacao?: string | null;

  @IsOptional()
  @IsEnum(["SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO", "UNIAO_ESTAVEL"])
  estado_civil?: string | null;

  @IsOptional()
  @IsEnum(["MASCULINO", "FEMININO", "OUTRO", "NAO_INFORMADO"])
  genero?: string | null;

  @IsOptional()
  @IsBoolean()
  participa_folha = false;

  @IsOptional()
  @IsString()
  observacao?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo = true;

  @IsArray()
  @IsEnum(ENTIDADE_TIPOS, { each: true })
  tipos: EntidadeTipo[] = ["CLIENTE"];
}

export class AtualizarEntidadeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.replace(/\D/g, "") : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(11)
  cpf_cnpj?: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsOptional()
  @IsEnum(["FISICA", "JURIDICA"])
  tipo_pessoa?: "FISICA" | "JURIDICA";

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  telefone?: string | null;

  @IsOptional()
  @IsString()
  celular?: string | null;

  @IsOptional()
  @IsString()
  cep?: string | null;

  @IsOptional()
  @IsString()
  logradouro?: string | null;

  @IsOptional()
  @IsString()
  numero?: string | null;

  @IsOptional()
  @IsString()
  bairro?: string | null;

  @IsOptional()
  @IsString()
  cidade?: string | null;

  @Transform(({ value }) =>
    typeof value === "string" && value ? value.toUpperCase() : value || null,
  )
  @IsOptional()
  @Length(2, 2)
  estado?: string | null;

  @IsOptional()
  @IsString()
  complemento?: string | null;

  @IsOptional()
  @IsString()
  data_nascimento?: string | null;

  @IsOptional()
  @IsString()
  nacionalidade?: string | null;

  @IsOptional()
  @IsString()
  filiacao?: string | null;

  @IsOptional()
  @IsEnum(["SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO", "UNIAO_ESTAVEL"])
  estado_civil?: string | null;

  @IsOptional()
  @IsEnum(["MASCULINO", "FEMININO", "OUTRO", "NAO_INFORMADO"])
  genero?: string | null;

  @IsOptional()
  @IsBoolean()
  participa_folha?: boolean;

  @IsOptional()
  @IsString()
  observacao?: string | null;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(ENTIDADE_TIPOS, { each: true })
  tipos?: EntidadeTipo[];
}

export class EntidadeIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class ListarEntidadesQueryDto implements PaginationQuery {
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
  @IsEnum(ENTIDADE_TIPOS)
  tipo?: EntidadeTipo;

  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export type EntidadeInput = EntidadeDto;
export type AtualizarEntidadeInput = Partial<EntidadeDto>;
export type ListarEntidadesQuery = ListarEntidadesQueryDto;

