import '../index.css';
import '../App.css';
import Providers from '../components/Providers';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouNestu',
  description: 'イベントや作家に気軽に感想を送れるサービス',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
