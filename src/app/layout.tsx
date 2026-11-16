import type { Metadata, Viewport } from 'next';
import { Geist, IBM_Plex_Sans, IBM_Plex_Sans_KR, Instrument_Serif, Inter_Tight } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

const plexKr = IBM_Plex_Sans_KR({ weight: ['400', '500', '700'], variable: '--font-plex-kr', subsets: ['latin'] });
const plexLatin = IBM_Plex_Sans({ weight: '400', style: 'italic', variable: '--font-plex-latin', subsets: ['latin'] });
const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });
const instrumentSerif = Instrument_Serif({ weight: '400', style: 'italic', variable: '--font-instrument-serif', subsets: ['latin'] });
const interTight = Inter_Tight({ weight: '700', variable: '--font-inter-tight', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Febble',
  description: 'See You Somewhere Loud',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const fontVariables = [plexKr, plexLatin, geist, instrumentSerif, interTight].map((font) => font.variable).join(' ');

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${fontVariables} antialiased`}>
      <body className="bg-neutral-100 font-sans text-black">
        {/* 모바일 전용 레이아웃. PC 대응은 이 컨테이너의 max-w 제한을 푸는 것부터 시작한다. */}
        <div className="mx-auto min-h-dvh w-full max-w-mobile bg-white">
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
