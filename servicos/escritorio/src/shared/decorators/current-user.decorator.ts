import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthContext } from "../../auth-client/types/auth.types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext | undefined => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);

