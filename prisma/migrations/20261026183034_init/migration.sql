-- CreateTable
CREATE TABLE "Region" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CattleCategory" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "CattleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slaughterhouse" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "regionId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Slaughterhouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" UUID NOT NULL,
    "slaughterhouseId" UUID NOT NULL,
    "regionId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "pricePerArroba" DECIMAL(12,2) NOT NULL,
    "referenceDate" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- Check constraints are maintained in SQL because Prisma schema does not model them.
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_pricePerArroba_positive" CHECK ("pricePerArroba" > 0);

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CattleCategory_name_key" ON "CattleCategory"("name");

-- CreateIndex
CREATE INDEX "Slaughterhouse_regionId_idx" ON "Slaughterhouse"("regionId");

-- CreateIndex
CREATE INDEX "Quote_slaughterhouseId_referenceDate_createdAt_idx" ON "Quote"("slaughterhouseId", "referenceDate", "createdAt");

-- CreateIndex
CREATE INDEX "Quote_regionId_categoryId_referenceDate_idx" ON "Quote"("regionId", "categoryId", "referenceDate");

-- CreateIndex
CREATE INDEX "Quote_categoryId_idx" ON "Quote"("categoryId");

-- AddForeignKey
ALTER TABLE "Slaughterhouse" ADD CONSTRAINT "Slaughterhouse_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_slaughterhouseId_fkey" FOREIGN KEY ("slaughterhouseId") REFERENCES "Slaughterhouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CattleCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
