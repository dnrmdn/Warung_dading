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
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const salesHistory = await getSalesByProductId(id, 50);

  return <ProductDetailClient initialProduct={product} salesHistory={salesHistory} />;
}
