import { notFound } from 'next/navigation';
import { enforceAdminPage } from '@/lib/auth/page-guard';
import { getProductById } from '@/lib/services/products';
import { HppDetailClient } from '@/components/hpp/hpp-detail-client';

interface HPPPageProps {
  params: Promise<{ id: string }>;
}

export default async function HPPPage({ params }: HPPPageProps) {
  await enforceAdminPage();
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return <HppDetailClient initialProduct={product} />;
}
