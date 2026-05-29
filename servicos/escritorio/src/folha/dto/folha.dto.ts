import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { PaginationQuery } from "../../shared/utils/pagination";

function emptyToNull(value: unknown) {
  return value === "" || value === undefined ? null : value;
}

export class ParticipanteIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class ListarParticipantesQueryDto implements PaginationQuery {
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
}

export class ListarRegistrosSalariaisQueryDto extends ListarParticipantesQueryDto {}

export class ListarFeriasQueryDto extends ListarParticipantesQueryDto {}

export class AnoQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  ano = new Date().getFullYear();
}

export class RelatorioMensalQueryDto extends AnoQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  mes = new Date().getMonth() + 1;
}

export class RegistroSalarialDto {
  @IsString()
  inicio_vigencia!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salario = 0;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  percentual?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export class PercentualSugeridoQueryDto {
  @IsString()
  inicio_vigencia!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salario = 0;
}

export class FeriasDto {
  @IsString()
  periodo_aquisitivo_inicio!: string;

  @IsString()
  periodo_aquisitivo_fim!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  dias_totais?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  dias_gozados = 0;

  @Transform(({ value }) => emptyToNull(value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_abono?: number | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  periodo_inicio?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  periodo_fim?: string | null;

  @Transform(({ value }) => emptyToNull(value))
  @IsOptional()
  @IsString()
  data_retorno?: string | null;
}

export class LancamentoMensalLinhaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(31)
  @IsOptional()
  dias_trabalhados = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salario_bruto = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  inss = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  irrf = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  inss_adicional = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ferias = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  comissao = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  desconto_bar = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  desconto_diverso_1 = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  desconto_diverso_2 = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  desconto_diverso_3 = 0;
}

export class FolhaMensalDto {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  ano!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LancamentoMensalLinhaDto)
  linhas!: LancamentoMensalLinhaDto[];
}

export type RegistroSalarialInput = RegistroSalarialDto;
export type FeriasInput = FeriasDto;
export type FolhaMensalInput = FolhaMensalDto;
export type ListarParticipantesQuery = ListarParticipantesQueryDto;
export type ListarRegistrosSalariaisQuery = ListarRegistrosSalariaisQueryDto;
export type ListarFeriasQuery = ListarFeriasQueryDto;
export type PercentualSugeridoQuery = PercentualSugeridoQueryDto;

