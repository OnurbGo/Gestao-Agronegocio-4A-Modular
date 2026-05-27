import { Request, Response } from "express";
import asyncHandler from "../../shared/middlewares/async-handler";
import FolhaService from "./folha.service";

const enviarPlanilha = (
  res: Response,
  arquivo: { buffer: Buffer; filename: string },
) => {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${arquivo.filename}"`,
  );
  res.send(arquivo.buffer);
};

class FolhaController {
  listarParticipantes = asyncHandler(async (req: Request, res: Response) => {
    const participantes = await FolhaService.listarParticipantes(req.query);

    res.json({
      message: "Participantes da folha listados com sucesso.",
      data: participantes,
    });
  });

  buscarParticipante = asyncHandler(async (req: Request, res: Response) => {
    const participante = await FolhaService.buscarParticipante(
      Number(req.params.id),
    );

    res.json({
      message: "Participante encontrado com sucesso.",
      data: participante,
    });
  });

  listarRegistrosSalariais = asyncHandler(
    async (req: Request, res: Response) => {
      const registros = await FolhaService.listarRegistrosSalariais(
        Number(req.params.id),
      );

      res.json({
        message: "Registros salariais listados com sucesso.",
        data: registros,
      });
    },
  );

  criarRegistroSalarial = asyncHandler(async (req: Request, res: Response) => {
    const registro = await FolhaService.criarRegistroSalarial(
      Number(req.params.id),
      req.body,
      req.usuario,
      req.ip,
    );

    res.status(201).json({
      message: "Registro salarial criado com sucesso.",
      data: registro,
    });
  });

  listarFerias = asyncHandler(async (req: Request, res: Response) => {
    const ferias = await FolhaService.listarFerias(Number(req.params.id));

    res.json({
      message: "Ferias listadas com sucesso.",
      data: ferias,
    });
  });

  criarFerias = asyncHandler(async (req: Request, res: Response) => {
    const ferias = await FolhaService.criarFerias(
      Number(req.params.id),
      req.body,
      req.usuario,
      req.ip,
    );

    res.status(201).json({
      message: "Ferias cadastradas com sucesso.",
      data: ferias,
    });
  });

  listarLancamentosMensais = asyncHandler(
    async (req: Request, res: Response) => {
      const lancamentos = await FolhaService.listarLancamentosMensais(
        Number(req.params.id),
        Number(req.query.ano),
      );

      res.json({
        message: "Lancamentos mensais listados com sucesso.",
        data: lancamentos,
      });
    },
  );

  salvarLancamentosMensais = asyncHandler(
    async (req: Request, res: Response) => {
      const lancamentos = await FolhaService.salvarLancamentosMensais(
        Number(req.params.id),
        req.body,
        req.usuario,
        req.ip,
      );

      res.json({
        message: "Lancamentos mensais salvos com sucesso.",
        data: lancamentos,
      });
    },
  );

  exportarLancamentosMensais = asyncHandler(
    async (req: Request, res: Response) => {
      const arquivo = await FolhaService.gerarPlanilhaParticipante(
        Number(req.params.id),
        Number(req.query.ano),
      );

      enviarPlanilha(res, arquivo);
    },
  );

  relatorioMensal = asyncHandler(async (req: Request, res: Response) => {
    const relatorio = await FolhaService.gerarRelatorioMensal(
      Number(req.query.ano),
      Number(req.query.mes),
    );

    res.json({
      message: "Relatorio mensal gerado com sucesso.",
      data: relatorio,
    });
  });

  exportarRelatorioMensal = asyncHandler(
    async (req: Request, res: Response) => {
      const arquivo = await FolhaService.gerarPlanilhaRelatorioMensal(
        Number(req.query.ano),
        Number(req.query.mes),
      );

      enviarPlanilha(res, arquivo);
    },
  );
}

export default new FolhaController();
