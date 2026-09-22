"use client";
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, MessageCircle } from 'lucide-react';
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
  const [useReadStatus, setUseReadStatus] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread'>('all');

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
        q1: f.q1
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
        <p>個別枠が見つかりません。</p>
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



      {useReadStatus && feedbacks.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilterStatus('all')}
            style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
          >
            すべて
          </button>
          <button
            className={filterStatus === 'unread' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilterStatus('unread')}
            style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
          >
            未確認のみ
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {feedbacks.length === 0 ? (
          <p style={{ color: 'var(--color-text-light)', textAlign: 'center', marginTop: '32px' }}>
            まだ感想は届いていません。
          </p>
        ) : (
          feedbacks.filter(f => filterStatus === 'all' || !f.isRead).map((f) => (
            <div key={f.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                  <MessageCircle size={16} />
                  <span>{new Date(f.createdAt).toLocaleDateString('ja-JP')}</span>
                </div>
                {useReadStatus && f.isRead && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 10px',
                    borderRadius: '12px', backgroundColor: '#f0f0f0', color: 'var(--color-text-light)',
                    border: '1px solid var(--color-border)', fontWeight: 600,
                  }}>
                    <CheckCircle size={14} /> 既読
                  </span>
                )}
              </div>
              
              {f.content && (
                <div>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>{f.content}</p>
                </div>
              )}
              {f.inputType === 'questions' && Array.isArray(f.q1) && f.q1.length > 0 && (
                <details style={{ marginTop: '12px', cursor: 'pointer' }}>
                  <summary style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, userSelect: 'none', padding: '4px 0', outline: 'none' }}>
                    詳細を見る
                  </summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '10px', borderLeft: '3px solid var(--color-border)', marginTop: '8px' }}>
                    <div style={{ fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>感情:</span>
                      <span style={{ fontWeight: 600 }}>{f.q1.join('、')}</span>
                    </div>
                    {f.q2 && (
                      <div style={{ fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>場所:</span>
                        <span>{f.q2}</span>
                      </div>
                    )}
                    {f.q3 && (
                      <div style={{ fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>理由:</span>
                        <span>{f.q3}</span>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {useReadStatus && !f.isRead && (
                <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 -20px 16px', padding: '0 20px' }} />
                  <button
                    onClick={() => toggleReadStatus(f.id, f.isRead)}
                    style={{
                      display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px',
                      padding: '12px 20px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)',
                      backgroundColor: 'white', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <CheckCircle size={18} /> 確認済みにする
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
