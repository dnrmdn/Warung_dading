import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getProducts, getCategories } from '@/lib/services/products';
import { StokClient } from '@/components/stok/stok-client';

export default async function StokPage() {
  await enforceAdminPage();
  const [products, categories] = await Promise.all([
    getProducts({ includeInactive: false }),
    getCategories(),
  ]);

  return (
    <StokClient
      initialProducts={products}
      categories={categories}
    />
  );
}
