export type InventoryType = 'barang' | 'bahan' | 'produk_jadi';

export type SellingMode = 'direct' | 'brewed';

export interface HPPComponent {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  materialProductId?: string;
}

export interface Product {
  id: string;
  name: string;
  variant?: string;
  family: string;
  category: string;
  inventoryType: InventoryType;
  price?: number; // undefined if unset in locked source (e.g. Resale)
  preparedPrice?: number;
  costPrice?: number; // Optional fallback or derived cost price
  stock: number;
  minStock: number;
  unit: string;
  iconName?: string;
  isActive: boolean;
  hppComponents?: HPPComponent[];
  hppNote?: string;
}

export interface CartItem {
  id: string; // unique item id (combines product id + selling mode)
  productId: string;
  name: string;
  variant?: string;
  mode: SellingMode;
  unit: string;
  unitPrice: number;
  quantity: number;
  iconName?: string;
}


export type StockAdjustmentType = 'add' | 'reduce' | 'set';

export type StockAdjustmentReason =
  | 'pembelian'
  | 'penjualan'
  | 'retur_supplier'
  | 'rusak_kadaluarsa'
  | 'pemakaian_sendiri'
  | 'koreksi_opname'
  | 'lainnya';

export interface StockAdjustmentLog {
  id: string;
  productId: string;
  type: StockAdjustmentType;
  amount: number;
  previousStock: number;
  newStock: number;
  reason: StockAdjustmentReason;
  note?: string;
  createdAt: string;
}

export type CreateProductInput = Omit<Product, 'id'>;

export type UpdateProductInput = Partial<Omit<Product, 'id'>>;

export interface AdjustStockInput {
  productId: string;
  type: StockAdjustmentType;
  amount: number;
  reason: StockAdjustmentReason;
  note?: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  subtotal: number;
}

// ─── Supplier ──────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  note?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  name: string;
  phone?: string;
  address?: string;
  note?: string;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput> & { isActive?: boolean };

// ─── Pembelian (Purchases) ─────────────────────────────────────────────────

export interface Purchase {
  id: string;
  purchaseDate: string;
  supplierId?: string | null;
  supplierName?: string;
  items: PurchaseItem[];
  totalAmount: number;
  note?: string;
  createdAt: string;
}

export type CreatePurchaseItemInput = Omit<
  PurchaseItem,
  'id' | 'subtotal'
>;

export interface CreatePurchaseInput {
  purchaseDate: string;
  supplierId?: string | null;
  supplierName?: string;
  items: CreatePurchaseItemInput[];
  note?: string;
}

// ─── Pengeluaran (Expenses) ────────────────────────────────────────────────

export type ExpenseCategory =
  | 'operasional'
  | 'bahan_baku'
  | 'transportasi'
  | 'gaji'
  | 'peralatan'
  | 'lainnya';

export interface Expense {
  id: string;
  expenseDate: string; // 'YYYY-MM-DD'
  category: ExpenseCategory;
  amount: number; // positive integer, Rupiah
  description?: string;
  createdAt: string; // ISO timestamp, set at write-time
}

export interface CreateExpenseInput {
  expenseDate: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
}

// ─── Penjualan (Sales) ────────────────────────────────────────────────

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  mode: SellingMode;
  quantity: number;
  unit: string;
  unitPrice: number;
  unitHpp: number;
  subtotal: number;
  hppTotal: number;
}

export interface ReceivablePaymentRecord {
  id: string;
  saleId: string;
  amount: number;
  note?: string;
  paidAt: string;    // ISO timestamp
  createdAt: string; // ISO timestamp
}

export interface Sale {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  items: SaleItem[];
  totalAmount: number;
  totalHpp: number;
  grossProfit: number;
  paymentMethod: 'cash';
  paymentAmount: number;        // Raw cash tendered at POS (may exceed totalAmount)
  changeAmount: number;         // Overpayment returned to customer
  paymentStatus: PaymentStatus; // MUTABLE: current payment status
  amountPaid: number;           // MUTABLE: cumulative cash applied (grows with settlements)
  amountDue: number;            // MUTABLE: current remaining balance (shrinks with settlements)
  initialAmountPaid: number;    // IMMUTABLE: cash applied at Sale creation = min(paymentAmount, totalAmount)
  initialAmountDue: number;     // IMMUTABLE: receivable created at Sale creation = totalAmount - initialAmountPaid
  customerName?: string;
  customerPhone?: string;
  receivablePayments?: ReceivablePaymentRecord[];
  createdAt: string;
}

export interface CreateSaleInput {
  transactionDate: string;
  items: Omit<SaleItem, 'id' | 'subtotal' | 'hppTotal' | 'unitHpp'>[];
  paymentAmount: number;
  customerName?: string;
  customerPhone?: string;
}

// ─── Product Sales History ────────────────────────────────────────────

export interface ProductSaleHistoryItem {
  saleId: string;
  transactionNumber: string;
  transactionDate: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  mode: SellingMode;
  paymentStatus: PaymentStatus;
  customerName?: string;
  createdAt: string;
}

// ─── Receivable / Piutang ─────────────────────────────────────────────

export interface ReceivableSaleItem {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: PaymentStatus;
}

export interface ReceivableSummary {
  customerName: string;
  customerPhone?: string;
  totalDue: number;
  saleCount: number;
  sales: ReceivableSaleItem[];
}
