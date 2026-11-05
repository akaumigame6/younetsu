"use client";
import { Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, Home, ExternalLink, HeartHandshake } from 'lucide-react';
import { APP_FEEDBACK_FORM_URL } from '../../../../../constants/links';

/**
 * CompleteSendContent - 送信完了画面本体
 * 感想送信後、または個別枠スキップ時に表示される。
 * 外部フォーム（YouNetsu使用感アンケート）への誘導および鑑賞者メニューへのナビゲーションを提供。
 */
function CompleteSendContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params?.eventId as string | undefined;
  const isSkipped = searchParams.get('from') === 'skip';

  return (
    <div
      className="content-area fade-in"
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: '480px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <CheckCircle size={64} color="var(--color-primary, var(--color-text))" style={{ marginBottom: '20px' }} />

      <h1 className="title">{isSkipped ? 'ご参加ありがとうございました' : '送信完了'}</h1>
      <p className="subtitle" style={{ marginBottom: '28px' }}>
        {isSkipped ? (
          <>
            イベントにご来場いただき
            <br />
            ありがとうございました。
          </>
        ) : (
          <>
            あなたの「気持ち」が
            <br />
            届きました。
          </>
        )}
      </p>

      {/* 使用感アンケート案内カード */}
      <div
        className="card"
        style={{
          width: '100%',
          textAlign: 'left',
          marginBottom: '28px',
          padding: '20px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md, 12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HeartHandshake size={20} color="var(--color-primary, #e11d48)" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            YouNetsuの使用感についてのお願い
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: '1.5', margin: 0 }}>
          今後のサービス向上のため、アンケートへのご協力をお願いいたします（所要時間: 3〜7分）。
        </p>
        <a
          href={APP_FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            textDecoration: 'none',
            fontSize: '0.9rem',
            padding: '10px 16px',
            width: '100%',
            marginTop: '4px',
          }}
        >
          <span>アンケートに回答する</span>
          <ExternalLink size={16} />
        </a>
      </div>

      <button
        className="btn-secondary"
        style={{ width: '100%' }}
        onClick={() => {
          const nextPath = eventId ? `/events/${eventId}/viewer` : '/viewer';
          router.push(nextPath);
        }}
      >
        <Home size={18} />
        鑑賞者メニューへ戻る
      </button>
    </div>
  );
}

export default function CompleteSend() {
  return (
    <Suspense fallback={<div className="content-area" style={{ textAlign: 'center' }}>読み込み中...</div>}>
      <CompleteSendContent />
    </Suspense>
  );
}
