"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageCircle, Check, CheckCircle } from 'lucide-react';
import type { Exhibit, ExhibitFeedback } from '../../../../../types';
import { emotionColors } from '../../../../../utils/emotionColors';
import { parseUTCDate } from '../../../../../utils/date';

export default function ExhibitFeedbackView() {
  const { token, eventId } = useParams<{ token: string, eventId: string }>();
  
  const [exhibit, setExhibit] = useState<Exhibit | null>(null);
  const [feedbacks, setFeedbacks] = useState<ExhibitFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllEmotions, setShowAllEmotions] = useState(false);

  useEffect(() => {
    if (token) {
      fetch(`/api/exhibits/${token}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => {
          setExhibit(data);
          const parsedFeedbacks = (data.feedbackRecords || []).map((fb: any) => ({
            ...fb,
            q1: fb.q1
          }));
          setFeedbacks(parsedFeedbacks);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [token]);

  const handleRead = async (feedbackId: string) => {
    try {
      await fetch(`/api/feedbacks/${feedbackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });
      setFeedbacks(prev => prev.map(fb => fb.id === feedbackId ? { ...fb, isRead: true } : fb));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  if (loading) {
    return <div className="content-area" style={{ justifyContent: 'center', alignItems: 'center' }}>読み込み中...</div>;
  }

  if (!exhibit) {
    return (
      <div className="content-area" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <h1 className="title">ページが見つかりません</h1>
        <p className="subtitle">URLが正しいかご確認ください。</p>
      </div>
    );
  }

  // 感情データの集計
  const emotionCounts: Record<string, number> = {};
  let totalEmotions = 0;

  feedbacks.forEach(fb => {
    if (fb.inputType === 'questions' && Array.isArray(fb.q1) && fb.q1.length > 0) {
      const emotions = fb.q1;
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
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '2rem',
        }}>
          🎨
        </div>
        <h1 className="title" style={{ margin: 0 }}>{exhibit.name}</h1>
        <p className="subtitle" style={{ marginTop: '8px', marginBottom: 0 }}>{exhibit.description}</p>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          寄せられた感想
          <span style={{
            marginLeft: '8px',
            fontSize: '0.9rem',
            fontWeight: 400,
            color: 'var(--color-text-light)',
          }}>
            ({feedbacks.length}件)
          </span>
        </h2>
      </div>

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
        {feedbacks.map((fb) => (
          <div key={fb.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-text-light)',
                fontSize: '0.85rem',
              }}>
                <MessageCircle size={16} />
                <span>{parseUTCDate(fb.createdAt).toLocaleDateString('ja-JP')}</span>
              </div>
              {exhibit.event?.useReadStatus && fb.isRead && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: '#f0f0f0',
                  color: 'var(--color-text-light)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 600,
                }}>
                  <CheckCircle size={14} /> 既読
                </span>
              )}
            </div>

            {fb.content && (
              <div>
                <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>{fb.content}</p>
              </div>
            )}
            
            {fb.inputType === 'questions' && Array.isArray(fb.q1) && fb.q1.length > 0 && (
              <details style={{ marginTop: '12px', cursor: 'pointer' }}>
                <summary style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, userSelect: 'none', padding: '4px 0', outline: 'none' }}>
                  詳細を見る
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '10px', borderLeft: '3px solid var(--color-border)', marginTop: '8px' }}>
                  <div style={{ fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>感情:</span>
                    <span style={{ fontWeight: 600 }}>{fb.q1.join('、')}</span>
                  </div>
                  {fb.q2 && (
                    <div style={{ fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>場所:</span>
                      <span>{fb.q2}</span>
                    </div>
                  )}
                  {fb.q3 && (
                    <div style={{ fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>理由:</span>
                      <span>{fb.q3}</span>
                    </div>
                  )}
                </div>
              </details>
            )}

            {exhibit.event?.useReadStatus && !fb.isRead && (
              <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 -20px 16px', padding: '0 20px' }} />
                <button
                  style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'white',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                  onClick={() => handleRead(fb.id)}
                >
                  <Check size={18} color="var(--color-text)" />
                  既読にする
                </button>
              </div>
            )}
          </div>
        ))}

        {feedbacks.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            color: 'var(--color-text-light)',
            padding: '60px 0',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <MessageCircle size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>まだ感想は届いていません。</p>
            <p style={{ fontSize: '0.9rem', marginTop: '8px', opacity: 0.8 }}>イベント開始後、ここに感想が表示されます。</p>
          </div>
        )}
      </div>
    </div>
  );
}
