import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getProducts, getCategories } from '@/lib/services/products';
import { StokClient } from '@/components/stok/stok-client';

type StockStatusFilter = 'all' | 'low';

interface StokPageSearchParams {
  filter?: string;
}

interface StokPageProps {
  searchParams: Promise<StokPageSearchParams>;
}

export default async function StokPage({ searchParams }: StokPageProps) {
  await enforceAdminPage();

  const resolvedParams = await searchParams;
  const initialStockStatus: StockStatusFilter =
    resolvedParams.filter === 'low' ? 'low' : 'all';

  const [products, categories] = await Promise.all([
    getProducts({ includeInactive: false }),
    getCategories(),
  ]);

  return (
    <StokClient
      initialProducts={products}
      categories={categories}
      initialStockStatus={initialStockStatus}
    />
  );
}
