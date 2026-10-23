import type { Metadata } from 'next';
import type { ProductPageConfig } from './productPages';

export const SITE_URL = 'https://www.dunemarket.site';

function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function productMetadata(product: ProductPageConfig, path: string): Metadata {
  const title = `${product.brand} | Dune Market`;
  const description = product.shortDesc || product.heroSubtitle;
  const image = product.images[0] || product.catalogImage;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: absoluteUrl(path),
      title,
      description,
      siteName: 'Dune Market',
      locale: 'ar_SA',
      images: image ? [{ url: absoluteUrl(image), alt: product.brand }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [absoluteUrl(image)] : undefined,
    },
  };
}

export function productJsonLd(product: ProductPageConfig, path: string) {
  const offer = product.offers.find((item) => item.popular) || product.offers[0];
  const images = product.images.length ? product.images : [product.catalogImage];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.heroTitle || product.brand,
    description: product.shortDesc || product.heroSubtitle,
    sku: product.id,
    brand: { '@type': 'Brand', name: product.brand },
    image: images.filter(Boolean).map(absoluteUrl),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(path),
      priceCurrency: 'SAR',
      price: offer.price,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
