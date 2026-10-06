import '../globals.css';
import type { Viewport } from 'next';
import { LANGS, dict, type Lang } from '@/i18n';
import { getCV } from '@/lib/content';
import Header from '@/components/chrome/Header';
import Footer from '@/components/chrome/Footer';
import Apparitions from '@/components/chrome/Apparitions';
import Ouverture from '@/components/home/Ouverture';

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const viewport: Viewport = { themeColor: '#FEFEFC', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = (await params) as { lang: Lang };
  const t = dict(lang);
  const cv = getCV();
  return (
    <html lang={lang}>
      <head>
        {/* l'ouverture (logo qui se dessine) a lieu à chaque arrivée sur l'accueil */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(/^\\/(fr|en|it)\\/?$/.test(location.pathname)&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!/nointro/.test(location.search))document.documentElement.dataset.intro='on'}catch(e){}`,
          }}
        />
        <link rel="preload" href="/fonts/mont-400.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/mont-300.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <a className="skip" href="#contenu">{t.nav.skip}</a>
        <Ouverture skip={t.intro.skip} portfolio={t.intro.portfolio} />
        <Header lang={lang} t={t} />
        <div className="page">
          <main id="contenu">{children}</main>
          <Footer lang={lang} t={t} cv={cv} />
        </div>
        <Apparitions />
      </body>
    </html>
  );
}
