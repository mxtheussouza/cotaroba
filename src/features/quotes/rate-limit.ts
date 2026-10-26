import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";

// Limit writes by company, so multiple accounts cannot multiply the allowance.
export async function consumeQuoteRateLimit(
  database: PrismaClient,
  actorId: string,
  now = Date.now(),
) {
  const user = await database.user.findUnique({
    where: { id: actorId },
    select: { slaughterhouseId: true },
  });
  if (!user?.slaughterhouseId) return false;
  const key = `quotes:${user.slaughterhouseId}`;
  const instant = BigInt(now);
  const cutoff = BigInt(now - 60_000);
  const rows = await database.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimit" ("id", "key", "count", "lastRequest") VALUES (gen_random_uuid(), ${key}, 1, ${instant})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."lastRequest" <= ${cutoff} THEN 1 ELSE LEAST("RateLimit"."count" + 1, 31) END,
      "lastRequest" = CASE WHEN "RateLimit"."lastRequest" <= ${cutoff} THEN ${instant} ELSE "RateLimit"."lastRequest" END
    RETURNING "count"
  `;
  return Boolean(rows[0] && rows[0].count <= 30);
}
