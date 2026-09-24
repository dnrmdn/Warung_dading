import 'server-only';

import { prisma } from '@/lib/prisma';

export type PublicProduct = {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  price?: number | null;
  iconName?: string;
  imageUrl?: string;
};

/**
 * Retrieves public-safe active products with strictly selected fields.
 * Sensitive fields (costPrice, preparedPrice, minStock, hppComponents,
 * hppNote, recipeComponents, etc.) are never fetched or exposed.
 */
export async function getPublicProducts(): Promise<PublicProduct[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      stock: true,
      unit: true,
      price: true,
      iconName: true,
      imageUrl: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ family: 'asc' }, { name: 'asc' }],
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category.name,
    stock: product.stock,
    unit: product.unit,
    price: product.price ?? null,
    iconName: product.iconName ?? undefined,
    imageUrl: product.imageUrl ?? undefined,
  }));
}

