import { Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { TokenPayload } from "../types/auth.types";

@Injectable()
export class TokenService {
  gerar(payload: TokenPayload) {
    return jwt.sign(payload, this.getSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    } as jwt.SignOptions);
  }

  verificar(token: string) {
    return jwt.verify(token, this.getSecret()) as TokenPayload;
  }

  private getSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET nao configurado.");
    }

    return secret;
  }
}

