import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getProducts, getCategoryItems } from '@/lib/services/products';
import { StokClient } from '@/components/stok/stok-client';

type StockStatusFilter = 'all' | 'low';

interface StokPageSearchParams {
  filter?: string;
}

interface StokPageProps {
  searchParams: Promise<StokPageSearchParams>;
}

export default async function StokPage({ searchParams }: StokPageProps) {
  const [, resolvedParams, products, categories] = await Promise.all([
    enforceAdminPage(),
    searchParams,
    getProducts({ includeInactive: false, includeRecipe: true }),
    getCategoryItems(),
  ]);

  const initialStockStatus: StockStatusFilter =
    resolvedParams.filter === 'low' ? 'low' : 'all';

  return (
    <StokClient
      initialProducts={products}
      categories={categories}
      initialStockStatus={initialStockStatus}
    />
  );
}
