import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { MODULOS, Modulo } from "../../permissions/types/modulo.enum";
import { PaginationQuery } from "../../shared/utils/pagination";

export class PermissaoModuloDto {
  @IsEnum(MODULOS)
  modulo!: Modulo;

  @IsBoolean()
  @IsOptional()
  pode_visualizar = true;

  @IsBoolean()
  @IsOptional()
  pode_criar = false;

  @IsBoolean()
  @IsOptional()
  pode_editar = false;

  @IsBoolean()
  @IsOptional()
  pode_excluir = false;

  @IsBoolean()
  @IsOptional()
  pode_restaurar = false;
}

export class CriarContaDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  senha!: string;

  @IsOptional()
  @IsUrl()
  imagem_perfil_url?: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissaoModuloDto)
  modulos?: PermissaoModuloDto[];
}

export class ListarContasQueryDto implements PaginationQuery {
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
}

export class ContaIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class AtualizarStatusContaDto {
  @IsBoolean()
  ativo!: boolean;
}

export class SolicitarContaDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  senha!: string;

  @IsOptional()
  @IsUrl()
  imagem_perfil_url?: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(MODULOS, { each: true })
  modulos_solicitados?: Modulo[];
}

export class ListarSolicitacoesQueryDto extends ListarContasQueryDto {
  @IsOptional()
  @IsEnum(["PENDENTE", "APROVADA", "RECUSADA"])
  status?: "PENDENTE" | "APROVADA" | "RECUSADA";
}

export class SolicitacaoIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class AprovarSolicitacaoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissaoModuloDto)
  modulos!: PermissaoModuloDto[];
}

export class RecusarSolicitacaoDto {
  @IsString()
  @MinLength(3)
  motivo_recusa!: string;
}

export class AlterarSenhaContaDto {
  @IsString()
  @MinLength(8)
  senha!: string;
}

export type CriarContaInput = CriarContaDto;
export type ListarContasQuery = ListarContasQueryDto;
export type AtualizarStatusContaInput = AtualizarStatusContaDto;
export type SolicitarContaInput = SolicitarContaDto;
export type ListarSolicitacoesQuery = ListarSolicitacoesQueryDto;
export type AprovarSolicitacaoInput = AprovarSolicitacaoDto;
export type RecusarSolicitacaoInput = RecusarSolicitacaoDto;
export type AlterarSenhaContaInput = AlterarSenhaContaDto;

