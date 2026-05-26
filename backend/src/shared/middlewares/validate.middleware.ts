import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

type RequestSource = "body" | "params" | "query";
type SchemaMap = Partial<Record<RequestSource, ZodTypeAny>>;

const formatPath = (path: PropertyKey[]) =>
  path.length > 0 ? path.map(String).join(".") : "root";

const validate =
  (schema: ZodTypeAny | SchemaMap, source: RequestSource = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const schemas: SchemaMap =
      "safeParse" in schema ? { [source]: schema } : schema;

    for (const key of Object.keys(schemas) as RequestSource[]) {
      const result = schemas[key]!.safeParse(req[key]);

      if (!result.success) {
        return res.status(400).json({
          message: "Erro de validação.",
          errors: result.error.issues.map((issue) => ({
            field: formatPath(issue.path),
            message: issue.message,
          })),
        });
      }

      req[key] = result.data;
    }

    return next();
  };

export default validate;
