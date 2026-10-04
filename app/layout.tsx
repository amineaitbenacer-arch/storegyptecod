import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Amiri, Tajawal } from 'next/font/google';
import './globals.css';
import TrackVisit from './components/TrackVisit';
import AdPixels from './components/AdPixels';
import { pixelBootScript } from '../lib/pixel-boot';
import { readSettings } from '../lib/settings-store';

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-display',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-body',
  display: 'swap',
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Dune Market | منتجات مختارة — الدفع عند الاستلام',
  description: 'متجر عربي راقٍ: توصيل لجميع المدن والدفع عند الاستلام.',
  metadataBase: new URL('https://www.dunemarket.site'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/logo-mark.png', type: 'image/png', sizes: '1024x1024' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const pixelScript = pixelBootScript(await readSettings());

  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${tajawal.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={tajawal.className}>
        {pixelScript ? (
          <script id="store-pixels" dangerouslySetInnerHTML={{ __html: pixelScript }} />
        ) : null}
        <TrackVisit />
        <AdPixels />
        {children}
      </body>
    </html>
  );
}
