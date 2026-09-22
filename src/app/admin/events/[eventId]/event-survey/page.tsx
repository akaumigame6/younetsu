"use client";
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { EventFeedback } from '../../../../../types';
import { getEvent } from '../../../../../actions/event';

import { emotionColors } from '../../../../../utils/emotionColors';

export default function AdminEventFeedbackDetail() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string | undefined;
  const [surveys, setSurveys] = useState<EventFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllEmotions, setShowAllEmotions] = useState(false);
  const [showAllReferrals, setShowAllReferrals] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [useReadStatus, setUseReadStatus] = useState(false);

  useEffect(() => {
    // 1. アンケート一覧を取得
    fetch(`/api/admin/event-feedbacks?eventId=${eventId}`)
      .then(res => res.json())
      .then(data => {
        const parsedSurveys = data.map((s: any) => ({
          ...s,
          q1: typeof s.q1 === 'string' ? JSON.parse(s.q1) : s.q1
        }));
        setSurveys(parsedSurveys);
      })
      .catch(err => {
        console.error(err);
      });

    // 2. イベント設定 (カスタム質問定義) を取得
    const fetchEventData = async () => {
      try {
        const { data } = await getEvent(eventId);
        if (data && data.customQuestions) {
          try {
            setCustomQuestions(JSON.parse(data.customQuestions));
          } catch (e) {
            console.error('Failed to parse customQuestions', e);
          }
        }
        if (data) {
          setUseReadStatus(data.useReadStatus ?? true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [eventId]);

  if (loading) {
    return <div className="content-area fade-in">読み込み中...</div>;
  }

  const toggleReadStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/event-feedbacks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: !currentStatus })
      });
      if (res.ok) {
        setSurveys(surveys.map(s => s.id === id ? { ...s, isRead: !currentStatus } : s));
      }
    } catch (e) {
      console.error('Failed to toggle read status', e);
    }
  };

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
    // 認知経路 (旧仕様 referralSources への互換性と新仕様 customAnswers 両対応)
    let refs: string[] = [];
    if (s.customAnswers) {
      try {
        const parsedAnswers = JSON.parse(s.customAnswers);
        if (parsedAnswers['q_referral']) {
          refs = Array.isArray(parsedAnswers['q_referral']) ? parsedAnswers['q_referral'] : [parsedAnswers['q_referral']];
        }
      } catch (e) {}
    } else if (Array.isArray(s.referralSources)) {
      refs = s.referralSources;
    }
    
    refs.forEach(r => {
      referralCounts[r] = (referralCounts[r] || 0) + 1;
      totalReferrals++;
    });
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
        onClick={() => router.push(`/admin/events/${eventId}/dashboard`)}
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
                {(() => {
                  let refs: string[] = [];
                  if (s.customAnswers) {
                    try {
                      const parsed = JSON.parse(s.customAnswers);
                      if (parsed['q_referral']) {
                        refs = Array.isArray(parsed['q_referral']) ? parsed['q_referral'] : [parsed['q_referral']];
                      }
                    } catch (e) {}
                  } else if (Array.isArray(s.referralSources)) {
                    refs = s.referralSources;
                  }
                  return refs.map(r => (
                    <span key={r} style={{ fontSize: '0.75rem', backgroundColor: '#e0f2f1', color: '#00796b', padding: '2px 8px', borderRadius: '12px', marginLeft: '4px' }}>
                      {r}
                    </span>
                  ));
                })()}
                {useReadStatus && (
                  <button 
                    onClick={() => toggleReadStatus(s.id, s.isRead)}
                    style={{ 
                      marginLeft: 'auto',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      border: s.isRead ? '1px solid #4CAF50' : '1px solid var(--color-border)',
                      backgroundColor: s.isRead ? '#e8f5e9' : 'transparent',
                      color: s.isRead ? '#4CAF50' : 'var(--color-text-light)'
                    }}
                  >
                    <Check size={14} /> {s.isRead ? '確認済み' : '未確認'}
                  </button>
                )}
              </div>
              
              {s.content && (
                <div>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem' }}>{s.content}</p>
                </div>
              )}

              {/* アコーディオン部分 */}
              {((s.inputType === 'questions' && Array.isArray(s.q1) && s.q1.length > 0) || (s.customAnswers && customQuestions.length > 0)) && (
                <details style={{ marginTop: '8px', cursor: 'pointer' }}>
                  <summary style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, userSelect: 'none', padding: '4px 0', outline: 'none' }}>
                    詳細を見る
                  </summary>
                  
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '8px', borderLeft: '2px solid var(--color-border)' }}>
                    {/* 3つの質問（感情・場所・理由） */}
                    {s.inputType === 'questions' && Array.isArray(s.q1) && s.q1.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                    
                    {/* カスタム質問の回答を表示 */}
                    {s.customAnswers && customQuestions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: (s.inputType === 'questions' && Array.isArray(s.q1) && s.q1.length > 0) ? '12px' : '0', borderTop: (s.inputType === 'questions' && Array.isArray(s.q1) && s.q1.length > 0) ? '1px dashed var(--color-border)' : 'none' }}>
                        {(() => {
                          try {
                            const parsedAnswers = JSON.parse(s.customAnswers);
                            return customQuestions.map((q: any) => {
                              const ans = parsedAnswers[q.id];
                              if (!ans || (Array.isArray(ans) && ans.length === 0)) return null;
                              
                              return (
                                <div key={q.id} style={{ fontSize: '0.85rem' }}>
                                  <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>{q.label}:</span>
                                  <span style={{ fontWeight: 600 }}>{Array.isArray(ans) ? ans.join('、') : ans}</span>
                                </div>
                              );
                            });
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>
                    )}
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
