"use client";
import { useRouter, useParams } from 'next/navigation';
import { SkipForward, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useEventSettings } from '../../../../../context/EventSettingsContext';
import type { Exhibit } from '../../../../../types';

/**
 * ExhibitSelect - 小枠（作家・作品等）選択ページ
 * イベントアンケート完了（またはスキップ）後に表示される。
 * 「良ければ小枠（作家等）にも感想を送ってください」という誘導画面。
 */
export default function ExhibitSelect() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string | undefined;
  const { settings } = useEventSettings();

  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetch(`/api/exhibits?eventId=${eventId}`)
        .then(res => res.json())
        .then(data => {
          setExhibits(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [eventId]);

  const handleSelectExhibit = (exhibitId: string) => {
    const nextPath = eventId ? `/events/${eventId}/survey/wizard?context=creator&exhibitId=${exhibitId}` : `/survey/wizard?context=creator&exhibitId=${exhibitId}`;
    router.push(nextPath);
  };

  const handleSkipToMenu = () => {
    const nextPath = eventId ? `/events/${eventId}/viewer` : '/viewer';
    router.push(nextPath);
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
          <span>{settings.exhibitTerm || '個別枠'}への感想（任意）</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: '100%' }} />
        </div>
      </div>

      <h1 className="title">気になった{settings.exhibitTerm || '個別枠'}がありましたか？</h1>
      <p className="subtitle">
        良ければ、直接感想を届けてみてください。<br />
        飛ばしてもOKです。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-light)' }}>読み込み中...</div>
        ) : (
          exhibits.map((exhibit) => (
            <button
              key={exhibit.id}
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
            onClick={() => handleSelectExhibit(exhibit.id)}
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
              {exhibit.iconUrl ? (
                <img src={exhibit.iconUrl} alt={exhibit.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={24} color="var(--color-text-light)" />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{exhibit.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{exhibit.description}</div>
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
