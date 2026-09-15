import { Product } from '@/types/warung';

export function calculateHPP(product: Product): number {
  if (product.hppComponents && product.hppComponents.length > 0) {
    return product.hppComponents.reduce(
      (sum, c) => sum + c.quantity * c.unitCost,
      0
    );
  }

  return product.costPrice ?? 0;
}
