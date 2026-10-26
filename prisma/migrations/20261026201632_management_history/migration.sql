-- CreateEnum
CREATE TYPE "ManagementAction" AS ENUM ('REGION_CREATED', 'SLAUGHTERHOUSE_CREATED', 'SLAUGHTERHOUSE_UPDATED', 'ACCESS_CREATED', 'ACCESS_UPDATED', 'ACCESS_PASSWORD_RESET');

-- CreateTable
CREATE TABLE "ManagementEvent" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "slaughterhouseId" UUID,
    "targetUserId" UUID,
    "action" "ManagementAction" NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagementEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManagementEvent_slaughterhouseId_createdAt_idx" ON "ManagementEvent"("slaughterhouseId", "createdAt");

-- CreateIndex
CREATE INDEX "ManagementEvent_actorId_createdAt_idx" ON "ManagementEvent"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "ManagementEvent_targetUserId_idx" ON "ManagementEvent"("targetUserId");

-- AddForeignKey
ALTER TABLE "ManagementEvent" ADD CONSTRAINT "ManagementEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementEvent" ADD CONSTRAINT "ManagementEvent_slaughterhouseId_fkey" FOREIGN KEY ("slaughterhouseId") REFERENCES "Slaughterhouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementEvent" ADD CONSTRAINT "ManagementEvent_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
