-- CreateTable
CREATE TABLE "DailyCashBalance" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "openingCash" INTEGER NOT NULL,
    "openingNote" TEXT,
    "openedByUserId" TEXT,
    "closingCash" INTEGER,
    "closingNote" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCashBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyCashBalance_date_key" ON "DailyCashBalance"("date");

-- CreateIndex
CREATE INDEX "DailyCashBalance_date_idx" ON "DailyCashBalance"("date");

-- AddForeignKey
ALTER TABLE "DailyCashBalance" ADD CONSTRAINT "DailyCashBalance_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
