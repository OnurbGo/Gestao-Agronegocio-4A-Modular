import { NextFunction, Request, Response } from "express";

type AsyncRoute = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

const asyncHandler =
  (route: AsyncRoute) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(route(req, res, next)).catch(next);
  };

export default asyncHandler;
