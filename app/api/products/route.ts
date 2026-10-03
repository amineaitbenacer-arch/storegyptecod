import { NextResponse } from 'next/server';
import { PRODUCTS } from '../../../lib/productPages';

export async function GET() {
  return NextResponse.json({
    success: true,
    products: PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      type: p.type,
      href: p.href,
    })),
  });
}
