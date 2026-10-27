-- CreateEnum
CREATE TYPE "ExternalMetric" AS ENUM ('USD_BRL', 'RAINFALL', 'CORN', 'SOYBEAN', 'CATTLE_SLAUGHTER', 'CALF_PRICE', 'ARROBA_REFERENCE');

-- CreateEnum
CREATE TYPE "ExternalFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "ExternalOrigin" AS ENUM ('API', 'MANUAL');

-- CreateTable
CREATE TABLE "ExternalSeries" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "connector" VARCHAR(40),
    "metric" "ExternalMetric" NOT NULL,
    "frequency" "ExternalFrequency" NOT NULL,
    "geography" VARCHAR(160) NOT NULL,
    "sourceName" VARCHAR(160) NOT NULL,
    "sourceUrl" VARCHAR(1000) NOT NULL,
    "staleAfterDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalObservation" (
    "id" UUID NOT NULL,
    "seriesId" UUID NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "validUntil" DATE,
    "revision" INTEGER NOT NULL,
    "origin" "ExternalOrigin" NOT NULL,
    "collectedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,

    CONSTRAINT "ExternalObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalSync" (
    "connector" VARCHAR(40) NOT NULL,
    "attemptedAt" TIMESTAMPTZ(3) NOT NULL,
    "succeededAt" TIMESTAMPTZ(3),
    "status" VARCHAR(20) NOT NULL,
    "errorCode" VARCHAR(40),

    CONSTRAINT "ExternalSync_pkey" PRIMARY KEY ("connector")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExternalSeries_name_key" ON "ExternalSeries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalSeries_connector_key" ON "ExternalSeries"("connector");

-- CreateIndex
CREATE INDEX "ExternalObservation_seriesId_periodEnd_periodStart_revision_idx" ON "ExternalObservation"("seriesId", "periodEnd", "periodStart", "revision");

-- CreateIndex
CREATE INDEX "ExternalObservation_createdById_idx" ON "ExternalObservation"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalObservation_seriesId_periodStart_periodEnd_revision_key" ON "ExternalObservation"("seriesId", "periodStart", "periodEnd", "revision");

-- AddForeignKey
ALTER TABLE "ExternalObservation" ADD CONSTRAINT "ExternalObservation_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "ExternalSeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalObservation" ADD CONSTRAINT "ExternalObservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ExternalSeries_name_insensitive_key" ON "ExternalSeries" (lower("name"));
ALTER TABLE "ExternalSeries" ADD CONSTRAINT "ExternalSeries_staleAfterDays_check" CHECK ("staleAfterDays" BETWEEN 1 AND 730);
ALTER TABLE "ExternalSeries" ADD CONSTRAINT "ExternalSeries_connector_check" CHECK ("connector" IS NULL OR "connector" IN ('BCB_PTAX', 'IBGE_SLAUGHTER_BA'));
ALTER TABLE "ExternalObservation" ADD CONSTRAINT "ExternalObservation_value_check" CHECK ("value" >= 0);
ALTER TABLE "ExternalObservation" ADD CONSTRAINT "ExternalObservation_period_check" CHECK ("periodStart" <= "periodEnd" AND ("validUntil" IS NULL OR "validUntil" >= "periodEnd"));
ALTER TABLE "ExternalObservation" ADD CONSTRAINT "ExternalObservation_revision_check" CHECK ("revision" > 0);
ALTER TABLE "ExternalObservation" ADD CONSTRAINT "ExternalObservation_author_check" CHECK (("origin" = 'MANUAL' AND "createdById" IS NOT NULL) OR ("origin" = 'API' AND "createdById" IS NULL));
ALTER TABLE "ExternalSync" ADD CONSTRAINT "ExternalSync_status_check" CHECK ("status" IN ('RUNNING', 'SUCCESS', 'FAILED'));
ALTER TABLE "ExternalSync" ADD CONSTRAINT "ExternalSync_connector_check" CHECK ("connector" IN ('BCB_PTAX', 'IBGE_SLAUGHTER_BA'));
