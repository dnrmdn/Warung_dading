import { notFound } from 'next/navigation';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getProductById } from '@/lib/services/products';
import { getSalesByProductId } from '@/lib/services/sales';
import { ProductDetailClient } from '@/components/produk/product-detail-client';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  await enforceAdminPage();
  const { id } = await params;

  // Both fetches are independent of each other — run them concurrently.
  const [product, salesHistory] = await Promise.all([
    getProductById(id),
    getSalesByProductId(id, 50),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient initialProduct={product} salesHistory={salesHistory} />;
}
