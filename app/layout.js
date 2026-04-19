import './globals.css';

export const metadata = {
  title: '소상공인 AI활용 체크업 | AI융합연구소',
  description: '수행평가형 AI 활용수준 진단 및 맞춤교육 추천 플랫폼',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
