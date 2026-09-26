-- CreateTable
CREATE TABLE "HppChangeLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "oldHpp" INTEGER NOT NULL,
    "newHpp" INTEGER NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HppChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HppChangeLog_productId_createdAt_idx" ON "HppChangeLog"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "HppChangeLog_purchaseId_idx" ON "HppChangeLog"("purchaseId");

-- CreateIndex
CREATE INDEX "HppChangeLog_readAt_idx" ON "HppChangeLog"("readAt");

-- CreateIndex
CREATE INDEX "HppChangeLog_createdAt_idx" ON "HppChangeLog"("createdAt");

-- AddForeignKey
ALTER TABLE "HppChangeLog" ADD CONSTRAINT "HppChangeLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HppChangeLog" ADD CONSTRAINT "HppChangeLog_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
