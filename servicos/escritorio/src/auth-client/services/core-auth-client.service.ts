import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ClientProxy, ClientProxyFactory, Transport } from "@nestjs/microservices";
import { lastValueFrom, timeout } from "rxjs";
import { AuthContext } from "../types/auth.types";

type CacheEntry = {
  context: AuthContext;
  expiresAt: number;
};

@Injectable()
export class CoreAuthClientService implements OnModuleInit, OnModuleDestroy {
  private readonly ttlMs = Number(process.env.AUTH_CACHE_TTL_MS || 15000);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly client: ClientProxy = ClientProxyFactory.create({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT || 6379),
    },
  });

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  async validarToken(token: string) {
    const cached = this.cache.get(token);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.context;
    }

    try {
      const context = await lastValueFrom(
        this.client
          .send<AuthContext>("core.auth.validate-token", { token })
          .pipe(timeout(3000)),
      );

      this.cache.set(token, {
        context,
        expiresAt: Date.now() + this.ttlMs,
      });

      return context;
    } catch (error) {
      if (cached && cached.expiresAt > Date.now()) {
        return cached.context;
      }

      if (this.isUnauthorizedLike(error)) {
        throw new UnauthorizedException("Token invalido ou conta inativa.");
      }

      throw new ServiceUnavailableException("Core indisponivel para autenticacao.");
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

  private isUnauthorizedLike(error: unknown) {
    const message = JSON.stringify(error || {});
    return message.includes("401") || message.includes("Unauthorized");
  }
}

