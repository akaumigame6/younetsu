"use client";
import { useRouter, useParams } from 'next/navigation';
import { SkipForward, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useEventSettings } from '../../../../../context/EventSettingsContext';
import { recordVisitorLogStart } from '../../../../../actions/log';
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
  const [isNavigating, setIsNavigating] = useState(false);

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

  const handleSelectExhibit = async (exhibitId: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    let sessionCount = 1;
    if (eventId) {
      const logRes = await recordVisitorLogStart({
        eventId,
        targetType: 'exhibit',
        targetId: exhibitId,
      });
      if (logRes?.sessionCount) {
        sessionCount = logRes.sessionCount;
      }
    }
    const nextPath = eventId 
      ? `/events/${eventId}/survey/wizard?context=creator&eventId=${eventId}&exhibitId=${exhibitId}&sessionCount=${sessionCount}` 
      : `/survey/wizard?context=creator&exhibitId=${exhibitId}&sessionCount=${sessionCount}`;
    router.push(nextPath);
  };

  const handleSkipToMenu = () => {
    const nextPath = eventId 
      ? `/events/${eventId}/survey/complete?from=skip` 
      : `/survey/complete?from=skip`;
    router.push(nextPath);
  };

  return (
    <div className="content-area fade-in">


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
            {/* アイコン枠自体を完全に無効化
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
              <User size={24} color="var(--color-text-light)" />
            </div>
            */}
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
