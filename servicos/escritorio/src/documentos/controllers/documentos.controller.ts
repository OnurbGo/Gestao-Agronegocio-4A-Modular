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
import { AuthContext } from "../../auth-client/types/auth.types";
import { EscritorioAuthGuard } from "../../auth-client/guards/escritorio-auth.guard";
import { PermissionGuard } from "../../auth-client/guards/permission.guard";
import { RequirePermission } from "../../auth-client/decorators/require-permission.decorator";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import {
  ArquivoIdParamDto,
  ArquivoQueryDto,
  DonoArquivoParamDto,
  UploadArquivoDto,
} from "../dto/documentos.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DocumentosService } from "../services/documentos.service";

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
};

function filenameHeader(nome: string, disposition: "attachment" | "inline") {
  return `${disposition}; filename="${encodeURIComponent(nome)}"`;
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
  listarArquivosEntidade(@Param() params: DonoArquivoParamDto) {
    return this.documentosService.listarArquivosEntidade(params.id);
  }

  @Post("entidades/:id/arquivos")
  @RequirePermission("ESCRITORIO", "criar")
  @UseInterceptors(FileInterceptor("arquivo", { limits: { fileSize: 10 * 1024 * 1024 } }))
  salvarArquivoEntidade(
    @Param() params: DonoArquivoParamDto,
    @Body() body: UploadArquivoDto,
    @UploadedFile() file: UploadedFile,
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
  listarArquivosImovel(@Param() params: DonoArquivoParamDto) {
    return this.documentosService.listarArquivosImovel(params.id);
  }

  @Post("imoveis/:id/arquivos")
  @RequirePermission("ESCRITORIO", "criar")
  @UseInterceptors(FileInterceptor("arquivo", { limits: { fileSize: 10 * 1024 * 1024 } }))
  salvarArquivoImovel(
    @Param() params: DonoArquivoParamDto,
    @Body() body: UploadArquivoDto,
    @UploadedFile() file: UploadedFile,
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
    @Param() params: ArquivoIdParamDto,
    @Query() query: ArquivoQueryDto,
    @Res() res: Response,
  ) {
    const arquivo = await this.documentosService.prepararDownload(
      params.id,
      query.origem,
    );

    res.setHeader("Content-Type", arquivo.tipo_mime);
    res.setHeader(
      "Content-Disposition",
      filenameHeader(arquivo.nome_original, "attachment"),
    );
    arquivo.stream.pipe(res);
  }

  @Get("arquivos/:id/visualizar")
  @RequirePermission("ESCRITORIO", "visualizar")
  async visualizar(
    @Param() params: ArquivoIdParamDto,
    @Query() query: ArquivoQueryDto,
    @Res() res: Response,
  ) {
    const arquivo = await this.documentosService.prepararDownload(
      params.id,
      query.origem,
    );

    res.setHeader("Content-Type", arquivo.tipo_mime);
    res.setHeader(
      "Content-Disposition",
      filenameHeader(arquivo.nome_original, "inline"),
    );
    arquivo.stream.pipe(res);
  }

  @Delete("arquivos/:id")
  @RequirePermission("ESCRITORIO", "excluir")
  remover(
    @Param() params: ArquivoIdParamDto,
    @Query() query: ArquivoQueryDto,
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

