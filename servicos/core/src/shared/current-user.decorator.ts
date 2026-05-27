import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthContext } from "../auth/auth.types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext | undefined => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
