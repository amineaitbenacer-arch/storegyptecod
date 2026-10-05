import { NextResponse } from 'next/server';
import { PRODUCT_PAGES } from '../../../lib/productPages';

/** Hidden from store + admin product picker (legacy LP only). */
const HIDDEN_FROM_ADMIN = new Set(['produit-1']);

export async function GET() {
  return NextResponse.json({
    success: true,
    products: PRODUCT_PAGES.filter((p) => !HIDDEN_FROM_ADMIN.has(p.id)).map((p) => ({
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
