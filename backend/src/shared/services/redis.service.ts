import { createClient } from "redis";

class RedisService {
  private client: ReturnType<typeof createClient> | null = null;

  private getUrl() {
    if (process.env.REDIS_URL) {
      return process.env.REDIS_URL;
    }

    if (process.env.REDIS_HOST) {
      const port = process.env.REDIS_PORT || "6379";
      return `redis://${process.env.REDIS_HOST}:${port}`;
    }

    return null;
  }

  private async getClient() {
    if (this.client?.isOpen) {
      return this.client;
    }

    const url = this.getUrl();

    if (!url) {
      return null;
    }

    this.client = createClient({ url });
    this.client.on("error", (error) => {
      console.error("Erro no Redis:", error);
    });

    await this.client.connect();

    return this.client;
  }

  async publish(channel: string, payload: unknown) {
    try {
      const client = await this.getClient();

      if (!client) {
        console.warn("Redis não configurado. Notificação não publicada.");
        return;
      }

      await client.publish(channel, JSON.stringify(payload));
    } catch (error) {
      console.error("Não foi possível publicar mensagem no Redis:", error);
    }
  }
}

export default new RedisService();
