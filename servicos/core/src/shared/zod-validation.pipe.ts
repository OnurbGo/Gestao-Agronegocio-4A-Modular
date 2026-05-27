import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { ZodTypeAny } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: "Erro de validacao.",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.length ? issue.path.join(".") : "root",
          message: issue.message,
        })),
      });
    }

    return result.data;
  }
}
