import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'CountIn - 쉬운 회계의 시작',
  description: '소규모 조직을 위한 올인원 회계 및 문서 관리 SaaS 플랫폼',
  keywords: ['회계', '비영리', '문서 관리', 'SaaS', '예산 관리'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
