export function getTestDatabaseUrl() {
  const value = process.env.TEST_DATABASE_URL;
  if (!value)
    throw new Error(
      "Configure TEST_DATABASE_URL para um banco local separado.",
    );

  let test: URL;
  let name: string;
  let developmentName: string | undefined;
  try {
    test = new URL(value);
    name = decodeURIComponent(test.pathname.slice(1));
    developmentName = process.env.DATABASE_URL
      ? decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1))
      : undefined;
  } catch {
    throw new Error("Configure URLs PostgreSQL válidas para os testes.");
  }

  if (
    !["postgres:", "postgresql:"].includes(test.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(test.hostname) ||
    !name.endsWith("_test") ||
    name === developmentName ||
    test.search ||
    test.hash
  ) {
    throw new Error(
      "Os testes exigem banco local com sufixo _test, diferente do banco de desenvolvimento.",
    );
  }
  return value;
}
