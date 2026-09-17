import { notFound } from 'next/navigation';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getProductById, getProductsForPicker } from '@/lib/services/products';
import { HppDetailClient } from '@/components/hpp/hpp-detail-client';

interface HPPPageProps {
  params: Promise<{ id: string }>;
}

export default async function HPPPage({ params }: HPPPageProps) {
  await enforceAdminPage();
  const { id } = await params;

  // Fetch the target product and the picker list concurrently — they are
  // independent of each other and only both need the auth check to complete.
  const [product, availableProducts] = await Promise.all([
    getProductById(id),
    getProductsForPicker(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <HppDetailClient
      initialProduct={product}
      availableProducts={availableProducts}
    />
  );
}
