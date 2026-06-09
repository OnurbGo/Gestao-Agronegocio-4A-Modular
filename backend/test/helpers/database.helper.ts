const UNSAFE_DATABASE_NAMES = new Set([
  "gestao_agro",
  "gestao_agronegocio",
  "production",
  "prod",
]);

export function assertSafeIntegrationDatabase(env = process.env) {
  if (env.NODE_ENV !== "test") {
    throw new Error("NODE_ENV precisa ser test para testes de integração.");
  }

  const database = env.DB_TEST_NAME || env.DB_NAME;

  if (!database) {
    throw new Error("Configure DB_TEST_NAME para testes com banco real.");
  }

  if (
    UNSAFE_DATABASE_NAMES.has(database.toLowerCase()) ||
    !database.toLowerCase().includes("test")
  ) {
    throw new Error(
      `Banco '${database}' não parece ser um banco isolado de teste.`,
    );
  }

  return database;
}
