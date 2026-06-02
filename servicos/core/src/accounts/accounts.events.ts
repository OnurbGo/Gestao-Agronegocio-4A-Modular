import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from "@nestjs/microservices";

@Injectable()
export class AccountsEventsService implements OnModuleInit, OnModuleDestroy {
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

  emitAccountDeactivated(contaId: number) {
    this.client.emit("core.account.deactivated", { conta_id: contaId });
  }

  emitPermissionsUpdated(contaId: number) {
    this.client.emit("core.permissions.updated", { conta_id: contaId });
  }
}
