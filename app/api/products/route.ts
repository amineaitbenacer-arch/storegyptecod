import { NextResponse } from 'next/server';
import { PRODUCT_PAGES } from '../../../lib/productPages';

export async function GET() {
  return NextResponse.json({
    success: true,
    products: PRODUCT_PAGES.map((p) => ({
      id: p.id,
      name: p.heroTitle,
      brand: p.brand,
      emoji: p.emoji,
      type: p.type,
      image: p.catalogImage,
      href: p.id === 'produit-1' ? '/product/antichoc' : `/product/${p.id}`,
    })),
  });
}
