"use client";
import { useRouter } from 'next/navigation';
import { CheckCircle, Home } from 'lucide-react';

/**
 * CompleteSend - 送信完了ページ
 * 感想送信後に表示される。鑑賞者メニューへのナビゲーションを提供。
 */
export default function CompleteSend() {
  const router = useRouter();

  return (
    <div
      className="content-area fade-in"
      style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
    >
      <CheckCircle size={64} color="var(--color-text)" style={{ marginBottom: '24px' }} />

      <h1 className="title">送信完了</h1>
      <p className="subtitle" style={{ marginBottom: '40px' }}>
        あなたの「気持ち」が
        <br />
        作家のもとへ届きました。
      </p>

      <button className="btn-secondary" onClick={() => router.push('/viewer')}>
        <Home size={18} />
        鑑賞者メニューへ
      </button>
    </div>
  );
}
