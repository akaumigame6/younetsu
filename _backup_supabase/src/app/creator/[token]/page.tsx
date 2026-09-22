"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageCircle, Check, CheckCircle } from 'lucide-react';
import type { Creator, FeedbackRecord } from '../../../types';
import { emotionColors } from '../../../utils/emotionColors';

export default function CreatorFeedbackView() {
  const { token } = useParams<{ token: string }>();
  
  const [creator, setCreator] = useState<Creator | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllEmotions, setShowAllEmotions] = useState(false);

  useEffect(() => {
    if (token) {
      fetch(`/api/creators/${token}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => {
          setCreator(data);
          setFeedbacks(data.feedbackRecords || []);
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

  if (!creator) {
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
        <h1 className="title" style={{ margin: 0 }}>{creator.name}</h1>
        <p className="subtitle" style={{ marginTop: '8px', marginBottom: 0 }}>{creator.description}</p>
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
          <div key={fb.id} className="card">
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
                <span>{new Date(fb.createdAt).toLocaleDateString('ja-JP')}</span>
              </div>
              {fb.isRead && (
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
              <div style={{ marginBottom: fb.inputType === 'questions' ? '8px' : '0' }}>
                <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem' }}>{fb.content}</p>
              </div>
            )}
            {fb.inputType === 'questions' && Array.isArray(fb.q1) && fb.q1.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', borderLeft: '2px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>感情:</span>
                  <span style={{ fontWeight: 600 }}>{fb.q1.join('、')}</span>
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>場所:</span>
                  <span>{fb.q2}</span>
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>理由:</span>
                  <span>{fb.q3}</span>
                </div>
              </div>
            )}

            {!fb.isRead && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <button
                  style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'white',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                  onClick={() => handleRead(fb.id)}
                >
                  <Check size={20} color="var(--color-text)" />
                  既読にする
                </button>
              </div>
            )}
          </div>
        ))}

        {feedbacks.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--color-text-light)',
            padding: '60px 0',
          }}>
            <MessageCircle size={40} style={{ marginBottom: '16px', opacity: 0.4 }} />
            <p>まだ感想は届いていません。</p>
          </div>
        )}
      </div>
    </div>
  );
}
