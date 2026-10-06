import '../globals.css';
import type { Viewport } from 'next';
import { LANGS, dict, type Lang } from '@/i18n';
import { getCV } from '@/lib/content';
import Header from '@/components/chrome/Header';
import Footer from '@/components/chrome/Footer';
import Cursor from '@/components/chrome/Cursor';
import SmoothScroll from '@/components/chrome/SmoothScroll';
import ClientStage from '@/components/chrome/ClientStage';

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const viewport: Viewport = { themeColor: '#F2ECE2', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const cv = getCV();
  return (
    <html lang={lang}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(/^\\/(fr|en|it)\\/?$/.test(location.pathname)&&sessionStorage.getItem('lp-intro-vue')!=='1'&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!/nointro/.test(location.search))document.documentElement.dataset.intro='on'}catch(e){}`,
          }}
        />
        <link rel="preload" href="/fonts/ebg-400.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/mont-400.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <a className="skip" href="#contenu">{t.nav.skip}</a>
        <ClientStage />
        <Header lang={lang} t={t} />
        <div className="page">
          <main id="contenu">{children}</main>
          <Footer lang={lang} t={t} email={cv.email} />
        </div>
        <div className="grain" aria-hidden="true" />
        <Cursor />
        <SmoothScroll />
      </body>
    </html>
  );
}
