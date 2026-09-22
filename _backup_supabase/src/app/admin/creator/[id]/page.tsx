"use client";
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Creator, FeedbackRecord } from '../../../../types';

import { emotionColors } from '../../../../utils/emotionColors';

export default function AdminCreatorFeedbackDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [creator, setCreator] = useState<Creator | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllEmotions, setShowAllEmotions] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch('/api/admin/creators').then(res => res.json()),
      fetch('/api/admin/feedbacks').then(res => res.json())
    ]).then(([cData, fData]) => {
      const c = cData.find((x: Creator) => x.id === id);
      setCreator(c || null);
      setFeedbacks(fData.filter((f: FeedbackRecord) => f.creatorId === id));
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="content-area fade-in">読み込み中...</div>;
  }

  if (!creator) {
    return (
      <div className="content-area fade-in">
        <p>作家が見つかりません。</p>
        <button className="btn-ghost" onClick={() => router.push('/admin/dashboard')}>戻る</button>
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
        onClick={() => router.push('/admin/dashboard')}
      >
        <ArrowLeft size={20} />
        ダッシュボードへ戻る
      </button>

      <h1 className="title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
        {creator.name} 宛の感想 ({feedbacks.length}件)
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
                {f.isRead && (
                  <span style={{ fontSize: '0.7rem', color: '#4CAF50', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> 作家が確認済み
                  </span>
                )}
              </div>
              
              {f.content && (
                <div style={{ marginBottom: f.inputType === 'questions' ? '8px' : '0' }}>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem' }}>{f.content}</p>
                </div>
              )}
              {f.inputType === 'questions' && Array.isArray(f.q1) && f.q1.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', borderLeft: '2px solid var(--color-border)' }}>
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
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
