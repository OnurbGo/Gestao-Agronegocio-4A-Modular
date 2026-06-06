import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";
import { ListarBaseQueryDto } from "./common.dto";

export class ListarMovimentacoesQueryDto extends ListarBaseQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  lote_operacional_id?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  conta_produto_id?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  item_id?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  deposito_id?: number;
}

export class ListarSaldosContaQueryDto extends ListarBaseQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  conta_produto_id?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  item_id?: number;
}

export class ListarSaldosDepositoQueryDto extends ListarBaseQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  deposito_id?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  item_id?: number;
}

export type ListarMovimentacoesQuery = ListarMovimentacoesQueryDto;
export type ListarSaldosContaQuery = ListarSaldosContaQueryDto;
export type ListarSaldosDepositoQuery = ListarSaldosDepositoQueryDto;
