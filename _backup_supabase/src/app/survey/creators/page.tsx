"use client";
import { useRouter } from 'next/navigation';
import { SkipForward, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Creator } from '../../../types';

/**
 * CreatorSelect - 作家選択ページ
 * イベントアンケート完了（またはスキップ）後に表示される。
 * 「良ければ作者にも感想を送ってください」という誘導画面。
 */
export default function CreatorSelect() {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/creators')
      .then(res => res.json())
      .then(data => {
        setCreators(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSelectCreator = (creatorId: string) => {
    router.push(`/survey/wizard?context=creator&creatorId=${creatorId}`);
  };

  const handleSkipToMenu = () => {
    router.push('/viewer');
  };

  return (
    <div className="content-area fade-in">
      {/* Progress */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--color-text-light)',
          marginBottom: '8px',
        }}>
          <span>Step 2 / 2</span>
          <span>作家への感想（任意）</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: '100%' }} />
        </div>
      </div>

      <h1 className="title">気になった作家はいましたか？</h1>
      <p className="subtitle">
        良ければ、作家に直接感想を届けてみてください。<br />
        選ばなくてもOKです。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-light)' }}>読み込み中...</div>
        ) : (
          creators.map((creator) => (
            <button
              key={creator.id}
              className="card"
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: '1px solid var(--color-border)',
            }}
            onClick={() => handleSelectCreator(creator.id)}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {creator.iconUrl ? (
                <img src={creator.iconUrl} alt={creator.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={24} color="var(--color-text-light)" />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{creator.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{creator.description}</div>
            </div>
            </button>
          ))
        )}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button className="btn-ghost" onClick={handleSkipToMenu}>
          <SkipForward size={18} />
          感想は送らずに終わる
        </button>
      </div>
    </div>
  );
}
