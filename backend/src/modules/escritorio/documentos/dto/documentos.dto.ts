import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export type ArquivoOrigem = "ENTIDADE" | "IMOVEL";

export class ArquivoIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class DonoArquivoParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}

export class ArquivoQueryDto {
  @IsEnum(["ENTIDADE", "IMOVEL"])
  origem!: ArquivoOrigem;
}

export class UploadArquivoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tipo_documento_id!: number;

  @Transform(({ value }) => (value === "" || value === undefined ? null : value))
  @IsOptional()
  @IsString()
  observacao?: string | null;
}

export type UploadArquivoInput = UploadArquivoDto;

