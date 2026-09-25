import { SellingMode } from '@/types/warung';

export interface HPPComponentInput {
  quantity: number;
  unitCost: number;
}

export interface ProductHPPInput {
  costPrice?: number | null;
  price?: number | null;
  preparedPrice?: number | null;
  hppComponents?: HPPComponentInput[] | null;
}

export interface ModeHPPBreakdown {
  mode: SellingMode;
  sellingPrice: number;
  baseCost: number;
  prepCost: number;
  unitHpp: number;
  grossProfit: number;
  marginPercent: number;
}

/**
 * Calculates total recipe preparation cost with explicit integer rounding.
 * Rounding: Math.round(sum(quantity * unitCost))
 */
export function calculateRecipeCost(product: ProductHPPInput): number {
  if (!product.hppComponents || product.hppComponents.length === 0) return 0;
  const rawTotal = product.hppComponents.reduce(
    (sum, c) => sum + Number(c.quantity || 0) * Number(c.unitCost || 0),
    0
  );
  return Math.round(rawTotal);
}

/**
 * Calculates mode-aware HPP for a product with an explicit, non-optional mode.
 *
 * Rules:
 * 1. direct:
 *    baseCost = costPrice ?? 0
 *    prepCost = calculateRecipeCost(product)
 *    if baseCost > 0:
 *      return baseCost
 *    return prepCost
 *
 * 2. brewed:
 *    baseCost = costPrice ?? 0
 *    prepCost = calculateRecipeCost(product)
 *    if baseCost > 0:
 *      return baseCost + prepCost
 *    return prepCost
 */
export function calculateHPP(
  product: ProductHPPInput,
  mode: SellingMode
): number {
  const baseCost = product.costPrice ?? 0;
  const prepCost = calculateRecipeCost(product);

  if (mode === 'direct') {
    if (baseCost > 0) return baseCost;
    return prepCost;
  }

  // mode === 'brewed'
  if (baseCost > 0) {
    return baseCost + prepCost;
  }
  return prepCost;
}

/**
 * Calculates margin percentage from profit and price.
 * Rules:
 * price <= 0 -> 0
 * otherwise -> (profit / price) * 100
 */
export function calculateMarginPercent(profit: number, price: number): number {
  if (!price || price <= 0) return 0;
  return (profit / price) * 100;
}

/**
 * Returns dual-mode breakdown for products.
 * Only returns brewed mode when preparedPrice is a valid positive price.
 */
export function getDualModeHPP(product: ProductHPPInput): {
  direct: ModeHPPBreakdown;
  brewed?: ModeHPPBreakdown;
} {
  const baseCost = product.costPrice ?? 0;
  const directSellingPrice = product.price ?? 0;
  const directHpp = calculateHPP(product, 'direct');
  const directGrossProfit = directSellingPrice - directHpp;
  const directMarginPercent = calculateMarginPercent(directGrossProfit, directSellingPrice);

  const direct: ModeHPPBreakdown = {
    mode: 'direct',
    sellingPrice: directSellingPrice,
    baseCost,
    prepCost: 0,
    unitHpp: directHpp,
    grossProfit: directGrossProfit,
    marginPercent: directMarginPercent,
  };

  if (product.preparedPrice == null || product.preparedPrice <= 0) {
    return { direct };
  }

  const prepCost = calculateRecipeCost(product);
  const brewedSellingPrice = product.preparedPrice;
  const brewedHpp = calculateHPP(product, 'brewed');
  const brewedGrossProfit = brewedSellingPrice - brewedHpp;
  const brewedMarginPercent = calculateMarginPercent(brewedGrossProfit, brewedSellingPrice);

  const brewed: ModeHPPBreakdown = {
    mode: 'brewed',
    sellingPrice: brewedSellingPrice,
    baseCost,
    prepCost,
    unitHpp: brewedHpp,
    grossProfit: brewedGrossProfit,
    marginPercent: brewedMarginPercent,
  };

  return { direct, brewed };
}
