-- AlterTable
ALTER TABLE "RecipeComponent" ADD COLUMN     "materialProductId" TEXT;

-- CreateIndex
CREATE INDEX "RecipeComponent_materialProductId_idx" ON "RecipeComponent"("materialProductId");

-- AddForeignKey
ALTER TABLE "RecipeComponent" ADD CONSTRAINT "RecipeComponent_materialProductId_fkey" FOREIGN KEY ("materialProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
