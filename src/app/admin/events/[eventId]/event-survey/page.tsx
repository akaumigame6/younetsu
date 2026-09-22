"use client";
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, Check, CheckCircle, MessageCircle } from 'lucide-react';
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
  const [useReadStatus, setUseReadStatus] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    // 1. アンケート一覧を取得
    fetch(`/api/admin/event-feedbacks?eventId=${eventId}`)
      .then(res => res.json())
      .then(data => {
        const parsedSurveys = data.map((s: any) => ({
          ...s,
          q1: s.q1
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
          setCustomQuestions(data.customQuestions);
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
        const parsedAnswers = s.customAnswers;
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

      {useReadStatus && surveys.length > 0 && (
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
        {surveys.length === 0 ? (
          <p style={{ color: 'var(--color-text-light)', textAlign: 'center', marginTop: '32px' }}>
            まだアンケートは届いていません。
          </p>
        ) : (
          surveys.filter(s => filterStatus === 'all' || !s.isRead).map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={16} /> {new Date(s.createdAt).toLocaleDateString('ja-JP')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {(() => {
                    let refs: string[] = [];
                    if (s.customAnswers) {
                      try {
                        const parsed = s.customAnswers;
                        if (parsed['q_referral']) {
                          refs = Array.isArray(parsed['q_referral']) ? parsed['q_referral'] : [parsed['q_referral']];
                        }
                      } catch (e) {}
                    } else if (Array.isArray(s.referralSources)) {
                      refs = s.referralSources;
                    }
                    return refs.map(r => (
                      <span key={r} style={{ fontSize: '0.75rem', backgroundColor: '#e0f2f1', color: '#00796b', padding: '2px 8px', borderRadius: '12px' }}>
                        {r}
                      </span>
                    ));
                  })()}
                  {useReadStatus && s.isRead && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 10px',
                      borderRadius: '12px', backgroundColor: '#f0f0f0', color: 'var(--color-text-light)',
                      border: '1px solid var(--color-border)', fontWeight: 600,
                    }}>
                      <CheckCircle size={14} /> 既読
                    </span>
                  )}
                </div>
              </div>
              
              {s.content && (
                <div>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>{s.content}</p>
                </div>
              )}

              {/* アコーディオン部分 */}
              {((s.inputType === 'questions' && Array.isArray(s.q1) && s.q1.length > 0) || (s.customAnswers && customQuestions.length > 0)) && (
                <details style={{ marginTop: '12px', cursor: 'pointer' }}>
                  <summary style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, userSelect: 'none', padding: '4px 0', outline: 'none' }}>
                    詳細を見る
                  </summary>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '10px', borderLeft: '3px solid var(--color-border)', marginTop: '8px' }}>
                    {/* 3つの質問（感情・場所・理由） */}
                    {s.inputType === 'questions' && Array.isArray(s.q1) && s.q1.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>感情:</span>
                          <span style={{ fontWeight: 600 }}>{s.q1.join('、')}</span>
                        </div>
                        {s.q2 && (
                          <div style={{ fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>場所:</span>
                            <span>{s.q2}</span>
                          </div>
                        )}
                        {s.q3 && (
                          <div style={{ fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginRight: '8px' }}>理由:</span>
                            <span>{s.q3}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* カスタム質問の回答 */}
                    {s.customAnswers && customQuestions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: s.inputType === 'questions' ? '12px' : '0' }}>
                        {(() => {
                          try {
                            const parsedAnswers = s.customAnswers;
                            return customQuestions.map((q: any) => {
                              const ans = parsedAnswers[q.id];
                              if (!ans || (Array.isArray(ans) && ans.length === 0)) return null;
                              
                              return (
                                <div key={q.id} style={{ fontSize: '0.9rem' }}>
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

              {useReadStatus && !s.isRead && (
                <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 -20px 16px', padding: '0 20px' }} />
                  <button
                    onClick={() => toggleReadStatus(s.id, s.isRead)}
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
