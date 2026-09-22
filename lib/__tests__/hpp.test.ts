import {
  calculateHPP,
  calculateRecipeCost,
  calculateMarginPercent,
  getDualModeHPP,
  ProductHPPInput,
} from '../hpp';
import { formatMargin } from '../format';

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message}. Expected ${expected}, got ${actual}`);
  }
  console.log(`PASS: ${message}`);
}

export function runHPPTests() {
  console.log('--- Running HPP & Margin Unit Tests ---');

  // Luwak White Coffee product definition matching confirmed DB records
  const luwak: ProductHPPInput = {
    costPrice: 1800,
    price: 2000,
    preparedPrice: 3000,
    hppComponents: [
      { quantity: 1, unitCost: 25 }, // Plastik
      { quantity: 1, unitCost: 33 }, // Sedotan
    ],
  };

  // Test 1 — Luwak direct
  assertEqual(
    calculateHPP(luwak, 'direct'),
    1800,
    "Test 1 — Luwak direct: calculateHPP(luwak, 'direct') === 1800"
  );

  // Test 2 — Luwak brewed
  assertEqual(
    calculateHPP(luwak, 'brewed'),
    1858,
    "Test 2 — Luwak brewed: calculateHPP(luwak, 'brewed') === 1858 (1800 + 25 + 33)"
  );

  // Test 3 — Decimal recipe rounding (0.33 * 100 = 33)
  const decimalRecipeProduct: ProductHPPInput = {
    costPrice: 0,
    hppComponents: [{ quantity: 0.33, unitCost: 100 }],
  };
  assertEqual(
    calculateRecipeCost(decimalRecipeProduct),
    33,
    'Test 3 — Decimal recipe rounding: calculateRecipeCost({ qty: 0.33, unitCost: 100 }) === 33'
  );

  // Test 4 — Margin formatting
  const directProfit = 200;
  const directPrice = 2000;
  const directMargin = calculateMarginPercent(directProfit, directPrice);
  assertEqual(
    formatMargin(directMargin),
    '10.0%',
    'Test 4a — Margin formatting: formatMargin(calculateMarginPercent(200, 2000)) === "10.0%"'
  );

  const brewedProfit = 1142;
  const brewedPrice = 3000;
  const brewedMargin = calculateMarginPercent(brewedProfit, brewedPrice);
  assertEqual(
    formatMargin(brewedMargin),
    '38.1%',
    'Test 4b — Margin formatting: formatMargin(calculateMarginPercent(1142, 3000)) === "38.1%"'
  );

  // Margin edge cases
  assertEqual(formatMargin(undefined), '-', 'Test 4c — formatMargin(undefined) === "-"');
  assertEqual(formatMargin(null), '-', 'Test 4d — formatMargin(null) === "-"');
  assertEqual(formatMargin(NaN), '-', 'Test 4e — formatMargin(NaN) === "-"');

  // Test 5 — Pure manufactured item (no costPrice)
  const manufacturedProduct: ProductHPPInput = {
    costPrice: 0,
    hppComponents: [
      { quantity: 1, unitCost: 300 },
      { quantity: 1, unitCost: 180 },
      { quantity: 1, unitCost: 70 },
      { quantity: 1, unitCost: 30 },
      { quantity: 1, unitCost: 50 },
    ], // total = 630
  };
  assertEqual(
    calculateHPP(manufacturedProduct, 'brewed'),
    630,
    "Test 5 — Pure manufactured item without costPrice: calculateHPP(product, 'brewed') === 630"
  );

  // Test 6 — Product without recipe
  const retailProduct: ProductHPPInput = {
    costPrice: 2000,
    price: 2500,
    hppComponents: [],
  };
  assertEqual(
    calculateHPP(retailProduct, 'direct'),
    2000,
    "Test 6a — Product without recipe: calculateHPP(retailProduct, 'direct') === 2000"
  );
  assertEqual(
    calculateHPP(retailProduct, 'brewed'),
    2000,
    "Test 6b — Product without recipe: calculateHPP(retailProduct, 'brewed') === 2000"
  );

  // Test 7 — getDualModeHPP when preparedPrice is null, undefined, or <= 0
  const productNoPrepared: ProductHPPInput = {
    costPrice: 1800,
    price: 2000,
    preparedPrice: null,
  };
  const dualNull = getDualModeHPP(productNoPrepared);
  assertEqual(
    dualNull.brewed,
    undefined,
    'Test 7a — getDualModeHPP with preparedPrice: null returns only direct'
  );

  const productZeroPrepared: ProductHPPInput = {
    costPrice: 1800,
    price: 2000,
    preparedPrice: 0,
  };
  const dualZero = getDualModeHPP(productZeroPrepared);
  assertEqual(
    dualZero.brewed,
    undefined,
    'Test 7b — getDualModeHPP with preparedPrice: 0 returns only direct'
  );

  const productUndefPrepared: ProductHPPInput = {
    costPrice: 1800,
    price: 2000,
  };
  const dualUndef = getDualModeHPP(productUndefPrepared);
  assertEqual(
    dualUndef.brewed,
    undefined,
    'Test 7c — getDualModeHPP with preparedPrice: undefined returns only direct'
  );

  console.log('All unit tests passed successfully!');
}

if (require.main === module) {
  runHPPTests();
}
