-- AlterEnum
ALTER TYPE "ManagementAction" ADD VALUE 'CATEGORY_CREATED';

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "previousQuoteId" UUID,
ADD COLUMN     "seriesId" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- Preserve existing records as independent first versions. Do not invent authorship.
UPDATE "Quote" SET "seriesId" = "id" WHERE "seriesId" IS NULL;
ALTER TABLE "Quote" ALTER COLUMN "seriesId" SET NOT NULL;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_version_shape" CHECK (
  ("version" = 1 AND "previousQuoteId" IS NULL)
  OR ("version" > 1 AND "previousQuoteId" IS NOT NULL AND "previousQuoteId" <> "id")
);

-- Expression indexes/checks are maintained in SQL, alongside the Prisma schema.
CREATE UNIQUE INDEX "CattleCategory_name_case_insensitive_key" ON "CattleCategory" (lower("name"));

-- CreateIndex
CREATE UNIQUE INDEX "Quote_previousQuoteId_key" ON "Quote"("previousQuoteId");

-- CreateIndex
CREATE INDEX "Quote_slaughterhouseId_seriesId_version_idx" ON "Quote"("slaughterhouseId", "seriesId", "version");

-- CreateIndex
CREATE INDEX "Quote_createdById_idx" ON "Quote"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_seriesId_version_key" ON "Quote"("seriesId", "version");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_previousQuoteId_fkey" FOREIGN KEY ("previousQuoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
