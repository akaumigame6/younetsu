"use client";
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Exhibit, ExhibitFeedback } from '../../../../../../types';

import { emotionColors } from '../../../../../../utils/emotionColors';

export default function AdminExhibitFeedbackDetail() {
  const { id, eventId } = useParams<{ id: string, eventId: string }>();
  const router = useRouter();

  const [exhibit, setExhibit] = useState<Exhibit | null>(null);
  const [feedbacks, setFeedbacks] = useState<ExhibitFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllEmotions, setShowAllEmotions] = useState(false);
  const [useReadStatus, setUseReadStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch('/api/admin/exhibits').then(res => res.json()),
      fetch('/api/admin/exhibit-feedbacks').then(res => res.json()),
      fetch('/api/admin/events').then(res => res.json()).catch(() => [])
    ]).then(([eData, fData, evData]) => {
      const e = Array.isArray(eData) ? eData.find((x: Exhibit) => x.id === id) : null;
      setExhibit(e || null);

      if (Array.isArray(evData) && eventId) {
        const ev = evData.find((x: any) => x.id === eventId);
        if (ev) {
          setUseReadStatus(ev.useReadStatus ?? true);
        }
      }

      const parsedFeedbacks = Array.isArray(fData) ? fData.map((f: any) => ({
        ...f,
        q1: typeof f.q1 === 'string' ? JSON.parse(f.q1) : f.q1
      })).filter((f: ExhibitFeedback) => f.exhibitId === id) : [];
      setFeedbacks(parsedFeedbacks);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id, eventId]);

  if (loading) {
    return <div className="content-area fade-in">読み込み中...</div>;
  }

  const toggleReadStatus = async (feedbackId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/exhibit-feedbacks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feedbackId, isRead: !currentStatus })
      });
      if (res.ok) {
        setFeedbacks(feedbacks.map(f => f.id === feedbackId ? { ...f, isRead: !currentStatus } : f));
      }
    } catch (e) {
      console.error('Failed to toggle read status', e);
    }
  };

  if (!exhibit) {
    return (
      <div className="content-area fade-in">
        <p>小枠（作家等）が見つかりません。</p>
        <button className="btn-ghost" onClick={() => router.push(`/admin/events/${eventId}/dashboard`)}>戻る</button>
      </div>
    );
  }

  // 感情データの集計
  const emotionCounts: Record<string, number> = {};
  let totalEmotions = 0;

  feedbacks.forEach(f => {
    if (f.inputType === 'questions' && Array.isArray(f.q1) && f.q1.length > 0) {
      const emotions = f.q1;
      emotions.forEach(emo => {
        emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
        totalEmotions++;
      });
    }
  });

  const emotionStats = Object.keys(emotionCounts).map(name => ({
    name,
    count: emotionCounts[name],
    percentage: Math.round((emotionCounts[name] / totalEmotions) * 100),
    color: emotionColors[name] || 'var(--color-primary)'
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="content-area fade-in">
      <button 
        className="btn-ghost" 
        style={{ alignSelf: 'flex-start', padding: 0, marginBottom: '16px' }}
        onClick={() => router.push(`/admin/events/${eventId}/dashboard`)}
      >
        <ArrowLeft size={20} />
        ダッシュボードへ戻る
      </button>

      <h1 className="title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
        {exhibit.name} 宛の感想 ({feedbacks.length}件)
      </h1>

      {emotionStats.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>感情の割合</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(showAllEmotions ? emotionStats : emotionStats.slice(0, 3)).map(stat => (
              <div key={stat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{stat.name}</span>
                  <span style={{ color: 'var(--color-text-light)' }}>{stat.percentage}% ({stat.count}件)</span>
                </div>
                <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                  <div style={{ width: `${stat.percentage}%`, height: '100%', backgroundColor: stat.color, transition: 'width 0.5s ease-out' }} />
                </div>
              </div>
            ))}
          </div>
          {emotionStats.length > 3 && (
            <button 
              className="btn-ghost" 
              style={{ width: '100%', marginTop: '12px', fontSize: '0.85rem', padding: '8px' }}
              onClick={() => setShowAllEmotions(!showAllEmotions)}
            >
              {showAllEmotions ? '一部を表示' : `すべて表示 (${emotionStats.length}件)`}
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {feedbacks.length === 0 ? (
          <p style={{ color: 'var(--color-text-light)', textAlign: 'center', marginTop: '32px' }}>
            まだ感想は届いていません。
          </p>
        ) : (
          feedbacks.map((f) => (
            <div key={f.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  {new Date(f.createdAt).toLocaleString()}
                </div>
                {useReadStatus && (
                  <button 
                    onClick={() => toggleReadStatus(f.id, f.isRead)}
                    style={{ 
                      marginLeft: 'auto',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      border: f.isRead ? '1px solid #4CAF50' : '1px solid var(--color-border)',
                      backgroundColor: f.isRead ? '#e8f5e9' : 'transparent',
                      color: f.isRead ? '#4CAF50' : 'var(--color-text-light)'
                    }}
                  >
                    <Check size={14} /> {f.isRead ? '確認済み' : '未確認'}
                  </button>
                )}
              </div>
              
              {f.content && (
                <div>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem' }}>{f.content}</p>
                </div>
              )}
              {f.inputType === 'questions' && Array.isArray(f.q1) && f.q1.length > 0 && (
                <details style={{ marginTop: '8px', cursor: 'pointer' }}>
                  <summary style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, userSelect: 'none', padding: '4px 0', outline: 'none' }}>
                    詳細を見る
                  </summary>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', borderLeft: '2px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>感情:</span>
                      <span style={{ fontWeight: 600 }}>{f.q1.join('、')}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>場所:</span>
                      <span>{f.q2}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>理由:</span>
                      <span>{f.q3}</span>
                    </div>
                  </div>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
