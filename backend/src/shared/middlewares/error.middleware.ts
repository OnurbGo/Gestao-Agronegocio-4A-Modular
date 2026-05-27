import { NextFunction, Request, Response } from "express";
import ApiError from "../errors/api-error";

const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  console.error("Erro interno:", error);

  return res.status(500).json({
    message: "Erro interno do servidor.",
  });
};

export default errorMiddleware;
