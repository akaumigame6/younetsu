"use client";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { SurveyRecord } from '../../../types';

import { emotionColors } from '../../../utils/emotionColors';

export default function AdminEventFeedbackDetail() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllEmotions, setShowAllEmotions] = useState(false);
  const [showAllReferrals, setShowAllReferrals] = useState(false);

  useEffect(() => {
    fetch('/api/admin/surveys')
      .then(res => res.json())
      .then(data => {
        setSurveys(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="content-area fade-in">読み込み中...</div>;
  }

  // 感情と認知経路データの集計
  const emotionCounts: Record<string, number> = {};
  let totalEmotions = 0;
  const referralCounts: Record<string, number> = {};
  let totalReferrals = 0;

  surveys.forEach(s => {
    // 感情
    if (s.inputType === 'questions' && Array.isArray(s.q1)) {
      const emotions = s.q1;
      emotions.forEach(emo => {
        emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
        totalEmotions++;
      });
    }
    // 認知経路
    if (Array.isArray(s.referralSources)) {
      s.referralSources.forEach(r => {
        referralCounts[r] = (referralCounts[r] || 0) + 1;
        totalReferrals++;
      });
    }
  });

  const emotionStats = Object.keys(emotionCounts).map(name => ({
    name,
    count: emotionCounts[name],
    percentage: Math.round((emotionCounts[name] / totalEmotions) * 100),
    color: emotionColors[name] || 'var(--color-primary)'
  })).sort((a, b) => b.count - a.count);

  const referralStats = Object.keys(referralCounts).map(name => ({
    name,
    count: referralCounts[name],
    percentage: Math.round((referralCounts[name] / totalReferrals) * 100),
    color: 'var(--color-primary)'
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
        イベントアンケート ({surveys.length}件)
      </h1>

      {(emotionStats.length > 0 || referralStats.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {emotionStats.length > 0 && (
            <div className="card">
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

          {referralStats.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>どこで知ったかの割合</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(showAllReferrals ? referralStats : referralStats.slice(0, 3)).map(stat => (
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
              {referralStats.length > 3 && (
                <button 
                  className="btn-ghost" 
                  style={{ width: '100%', marginTop: '12px', fontSize: '0.85rem', padding: '8px' }}
                  onClick={() => setShowAllReferrals(!showAllReferrals)}
                >
                  {showAllReferrals ? '一部を表示' : `すべて表示 (${referralStats.length}件)`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {surveys.length === 0 ? (
          <p style={{ color: 'var(--color-text-light)', textAlign: 'center', marginTop: '32px' }}>
            まだアンケートは届いていません。
          </p>
        ) : (
          surveys.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {new Date(s.createdAt).toLocaleString()}
                </span>
                {Array.isArray(s.referralSources) && s.referralSources.map(r => (
                  <span key={r} style={{ fontSize: '0.75rem', backgroundColor: '#e0f2f1', color: '#00796b', padding: '2px 8px', borderRadius: '12px', marginLeft: '4px' }}>
                    {r}
                  </span>
                ))}
              </div>
              
              {s.content && (
                <div style={{ marginBottom: s.inputType === 'questions' ? '8px' : '0' }}>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem' }}>{s.content}</p>
                </div>
              )}
              {s.inputType === 'questions' && Array.isArray(s.q1) && s.q1.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', borderLeft: '2px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>感情:</span>
                    <span style={{ fontWeight: 600 }}>{s.q1.join('、')}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>場所:</span>
                    <span>{s.q2}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>理由:</span>
                    <span>{s.q3}</span>
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
