import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForDatabase = globalThis as unknown as {
  database?: PrismaClient;
};

// Lazy initialization keeps the public page independent from database availability.
export function getDatabase(): PrismaClient {
  if (globalForDatabase.database) {
    return globalForDatabase.database;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL deve ser configurada para acessar o banco.");
  }

  let url: URL;

  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL deve ser uma URL PostgreSQL válida.");
  }

  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname) {
    throw new Error("DATABASE_URL deve ser uma URL PostgreSQL válida.");
  }

  const adapter = new PrismaPg({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5_000,
  });

  const database = new PrismaClient({ adapter });
  globalForDatabase.database = database;

  return database;
}
