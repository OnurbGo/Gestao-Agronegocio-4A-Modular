import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from "class-validator";
import { PaginationQuery } from "../../shared/utils/pagination";

export class UsuarioIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class AtualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsUrl()
  imagem_perfil_url?: string | null;

  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export class ListarUsuariosQueryDto implements PaginationQuery {
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

export type AtualizarUsuarioInput = AtualizarUsuarioDto;
export type ListarUsuariosQuery = ListarUsuariosQueryDto;

