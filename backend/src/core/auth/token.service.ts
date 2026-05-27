import jwt from "jsonwebtoken";
import { Modulo } from "../permissoes/modulo.enum";

export type TokenPayload = {
  id_usuario: number;
  email: string;
  modulos: Modulo[];
};

class TokenService {
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
      throw new Error("A variável de ambiente JWT_SECRET não está definida.");
    }

    return secret;
  }
}

export default new TokenService();
