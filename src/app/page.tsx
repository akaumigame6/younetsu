"use client";

import { useRouter } from 'next/navigation';
import { User, Settings } from 'lucide-react';
import { getLatestEventId } from '../actions/event';

export default function Home() {
  const router = useRouter();

  const handleDemoClick = async () => {
    const { data: latestEventId, error } = await getLatestEventId();
    if (error || !latestEventId) {
      alert('イベントが見つかりません。先に管理画面からイベントを作成してください。');
      return;
    }
    router.push(`/events/${latestEventId}/viewer`);
  };

  return (
    <div className="content-area fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
        <h1 className="title" style={{ textAlign: 'center', marginBottom: '8px' }}>YouNestu</h1>
        <p className="subtitle" style={{ textAlign: 'center', margin: 0 }}>
          イベントや作家に気軽に感想を送ろう
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 鑑賞者: 一連のフローへ (テスト用イベントへ) */}
        <button className="btn-primary" onClick={handleDemoClick}>
          <User size={20} />
          鑑賞者として参加する (デモ)
        </button>

        {/* 主催者: ログインへ */}
        <button className="btn-secondary" onClick={() => router.push('/admin')}>
          <Settings size={20} />
          YouNetsu 管理画面へ
        </button>
      </div>

      <div style={{
        marginTop: '48px',
        padding: '16px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        fontSize: '0.8rem',
        color: 'var(--color-text-light)',
        textAlign: 'center',
        lineHeight: 1.8,
      }}>
        作家の方は主催者から届いたURLを直接開いてください
      </div>
    </div>
  );
}
