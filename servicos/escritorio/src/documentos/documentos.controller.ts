import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import { AuthContext } from "../auth-client/auth.types";
import { EscritorioAuthGuard } from "../auth-client/escritorio-auth.guard";
import { PermissionGuard } from "../auth-client/permission.guard";
import { RequirePermission } from "../auth-client/require-permission.decorator";
import { CurrentUser } from "../shared/current-user.decorator";
import { ZodValidationPipe } from "../shared/zod-validation.pipe";
import {
  arquivoIdParamSchema,
  arquivoQuerySchema,
  donoArquivoParamSchema,
  uploadArquivoSchema,
} from "./documentos.schema";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DocumentosService } from "./documentos.service";

function filenameHeader(nome: string) {
  return `attachment; filename="${encodeURIComponent(nome)}"`;
}

@ApiTags("documentos")
@ApiBearerAuth("JWT")
@Controller()
@UseGuards(EscritorioAuthGuard, PermissionGuard)
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get("tipos-documento")
  @RequirePermission("ESCRITORIO", "visualizar")
  listarTiposDocumento() {
    return this.documentosService.listarTiposDocumento();
  }

  @Get("entidades/:id/arquivos")
  @RequirePermission("ESCRITORIO", "visualizar")
  listarArquivosEntidade(
    @Param(new ZodValidationPipe(donoArquivoParamSchema)) params: { id: number },
  ) {
    return this.documentosService.listarArquivosEntidade(params.id);
  }

  @Post("entidades/:id/arquivos")
  @RequirePermission("ESCRITORIO", "criar")
  @UseInterceptors(FileInterceptor("arquivo", { limits: { fileSize: 10 * 1024 * 1024 } }))
  salvarArquivoEntidade(
    @Param(new ZodValidationPipe(donoArquivoParamSchema)) params: { id: number },
    @Body(new ZodValidationPipe(uploadArquivoSchema)) body: never,
    @UploadedFile() file: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.documentosService.salvarArquivoEntidade(
      params.id,
      body,
      file,
      usuario,
      request.ip,
    );
  }

  @Get("imoveis/:id/arquivos")
  @RequirePermission("ESCRITORIO", "visualizar")
  listarArquivosImovel(
    @Param(new ZodValidationPipe(donoArquivoParamSchema)) params: { id: number },
  ) {
    return this.documentosService.listarArquivosImovel(params.id);
  }

  @Post("imoveis/:id/arquivos")
  @RequirePermission("ESCRITORIO", "criar")
  @UseInterceptors(FileInterceptor("arquivo", { limits: { fileSize: 10 * 1024 * 1024 } }))
  salvarArquivoImovel(
    @Param(new ZodValidationPipe(donoArquivoParamSchema)) params: { id: number },
    @Body(new ZodValidationPipe(uploadArquivoSchema)) body: never,
    @UploadedFile() file: never,
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.documentosService.salvarArquivoImovel(
      params.id,
      body,
      file,
      usuario,
      request.ip,
    );
  }

  @Get("arquivos/:id/download")
  @RequirePermission("ESCRITORIO", "visualizar")
  async download(
    @Param(new ZodValidationPipe(arquivoIdParamSchema)) params: { id: number },
    @Query(new ZodValidationPipe(arquivoQuerySchema))
    query: { origem: "ENTIDADE" | "IMOVEL" },
    @Res() res: Response,
  ) {
    const arquivo = await this.documentosService.prepararDownload(
      params.id,
      query.origem,
    );

    res.setHeader("Content-Type", arquivo.tipo_mime);
    res.setHeader("Content-Disposition", filenameHeader(arquivo.nome_original));
    arquivo.stream.pipe(res);
  }

  @Delete("arquivos/:id")
  @RequirePermission("ESCRITORIO", "excluir")
  remover(
    @Param(new ZodValidationPipe(arquivoIdParamSchema)) params: { id: number },
    @Query(new ZodValidationPipe(arquivoQuerySchema))
    query: { origem: "ENTIDADE" | "IMOVEL" },
    @CurrentUser() usuario: AuthContext,
    @Req() request: Request,
  ) {
    return this.documentosService.removerArquivo(
      params.id,
      query.origem,
      usuario,
      request.ip,
    );
  }
}
