import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../../../auth/services/auth.service";
import { AuthContext } from "../types/auth.types";

type CacheEntry = {
  context: AuthContext;
  expiresAt: number;
};

@Injectable()
export class CoreAuthClientService {
  private readonly ttlMs = Number(process.env.AUTH_CACHE_TTL_MS || 15000);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly authService: AuthService) {}

  async validarToken(token: string) {
    const cached = this.cache.get(token);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.context;
    }

    try {
      const context = await this.authService.validarToken(token);
      this.cache.set(token, {
        context,
        expiresAt: Date.now() + this.ttlMs,
      });

      return context;
    } catch (error) {
      if (cached && cached.expiresAt > Date.now()) {
        return cached.context;
      }

      throw new UnauthorizedException("Token invalido ou conta inativa.");
    }
  }

  invalidarConta(contaId: number) {
    for (const [token, entry] of this.cache.entries()) {
      if (entry.context.conta_id === contaId) {
        this.cache.delete(token);
      }
    }
  }

  invalidarTudo() {
    this.cache.clear();
  }
}

