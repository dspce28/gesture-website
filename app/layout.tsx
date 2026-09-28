import type { Metadata } from 'next';
import { DM_Serif_Display, Sora } from 'next/font/google';
import { GestureProvider, ScrollContent } from '@/components/GestureProvider';
import { GestureBar } from '@/components/GestureBar';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

// Self-hosted by next/font at build time, so the render no longer waits on a
// round trip to Google's CDN the way the single-file site did.
const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gesture.logicubeit.com'),
  title: {
    default: 'LogiCube IT — Premium IT Solutions',
    template: '%s · LogiCube IT',
  },
  description:
    'LogiCube IT builds scalable software, digital platforms and enterprise technology solutions — now navigable entirely by hand gesture.',
  openGraph: {
    type: 'website',
    siteName: 'LogiCube IT',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${dmSerif.variable}`}>
      <body>
        {/*
          The provider stays mounted across navigations, so the camera, worker
          and model survive route changes instead of re-prompting and reloading
          on every click.

          Only <ScrollContent> is transformed by the scroll engine. The nav and
          the gesture bar sit outside it deliberately: a transformed ancestor
          becomes the containing block for position:fixed descendants, so
          nesting them inside would make both scroll away with the page.
        */}
        <GestureProvider>
          <SiteNav />
          <ScrollContent>
            {children}
            <SiteFooter />
          </ScrollContent>
          <GestureBar />
        </GestureProvider>
      </body>
    </html>
  );
}
