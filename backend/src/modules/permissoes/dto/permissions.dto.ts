import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  ValidateNested,
} from "class-validator";
import { MODULOS, Modulo } from "../types/modulo.enum";

export class ContaIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  contaId!: number;
}

export class SalvarPermissaoModuloDto {
  @IsEnum(MODULOS)
  modulo!: Modulo;

  @IsBoolean()
  pode_visualizar!: boolean;

  @IsBoolean()
  pode_criar!: boolean;

  @IsBoolean()
  pode_editar!: boolean;

  @IsBoolean()
  pode_excluir!: boolean;

  @IsBoolean()
  pode_restaurar!: boolean;
}

export class SalvarPermissoesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalvarPermissaoModuloDto)
  modulos!: SalvarPermissaoModuloDto[];
}

export type SalvarPermissoesInput = SalvarPermissoesDto;

