import type { Metadata, Viewport } from 'next';
import { Geist, IBM_Plex_Sans, IBM_Plex_Sans_KR, Instrument_Serif, Inter_Tight, Roboto } from 'next/font/google';
import AuthSessionProvider from '@/components/auth/AuthSessionProvider';
import LoginSheetProvider from '@/components/auth/LoginSheetProvider';
import UserStateProvider from '@/components/auth/UserStateProvider';
import './globals.css';

const plexKr = IBM_Plex_Sans_KR({ weight: ['400', '500', '700'], variable: '--font-plex-kr', subsets: ['latin'] });
const plexLatin = IBM_Plex_Sans({ weight: '400', style: 'italic', variable: '--font-plex-latin', subsets: ['latin'] });
const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });
const instrumentSerif = Instrument_Serif({ weight: '400', style: 'italic', variable: '--font-instrument-serif', subsets: ['latin'] });
const interTight = Inter_Tight({ weight: '700', variable: '--font-inter-tight', subsets: ['latin'] });
// Google 로그인 버튼 글꼴 (브랜드 가이드: Roboto Medium)
const roboto = Roboto({ weight: '500', variable: '--font-roboto', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Febble',
  description: 'See You Somewhere Loud',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const fontVariables = [plexKr, plexLatin, geist, instrumentSerif, interTight, roboto].map((font) => font.variable).join(' ');

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${fontVariables} antialiased`}>
      <body className="bg-neutral-100 font-sans text-black">
        <AuthSessionProvider>
          <UserStateProvider>
            <LoginSheetProvider>
              {/* 공개 화면 틀은 (site)/layout, 어드민 틀은 admin/layout 에 있다. */}
              {children}
            </LoginSheetProvider>
          </UserStateProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
