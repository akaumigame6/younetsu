"use client";
import { useRouter, useParams } from 'next/navigation';
import { ChevronRight, Download } from 'lucide-react';
import type { Exhibit, ExhibitFeedback, EventFeedback } from '../../types';

export default function TabOverview({ 
  eventId, exhibits, exhibitFeedbacks, eventFeedbacks, hasExhibits = true, hasEventSurvey = true 
}: { 
  eventId?: string, exhibits: Exhibit[], exhibitFeedbacks: ExhibitFeedback[], eventFeedbacks: EventFeedback[], hasExhibits?: boolean, hasEventSurvey?: boolean 
}) {
  const router = useRouter();

  const totalFeedbacks = exhibitFeedbacks.length;
  const totalSurveys = eventFeedbacks.length;
  const feedbacksByExhibit = exhibits.map((e) => ({
    ...e,
    count: exhibitFeedbacks.filter((f) => f.exhibitId === e.id).length,
  }));

  const downloadCSV = (type: 'eventFeedbacks' | 'exhibitFeedbacks') => {
    let csvContent = '\uFEFF'; // BOM
    if (type === 'eventFeedbacks') {
      csvContent += '日時,入力タイプ,内容,感情,場所,理由,認知経路,カスタム回答(JSON)\n';
      eventFeedbacks.forEach(s => {
        const date = new Date(s.createdAt).toLocaleString();
        const typeStr = s.inputType || '';
        const content = `"${(s.content || '').replace(/"/g, '""')}"`;
        const q1 = `"${(Array.isArray(s.q1) ? s.q1.join('、') : '').replace(/"/g, '""')}"`;
        const q2 = `"${(s.q2 || '').replace(/"/g, '""')}"`;
        const q3 = `"${(s.q3 || '').replace(/"/g, '""')}"`;
        
        // 認知経路を抽出
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
        const referralStr = `"${refs.join('、').replace(/"/g, '""')}"`;
        const customAnswersStr = `"${(s.customAnswers || '').replace(/"/g, '""')}"`;

        csvContent += `${date},${typeStr},${content},${q1},${q2},${q3},${referralStr},${customAnswersStr}\n`;
      });
    } else {
      csvContent += '日時,個別枠名,入力タイプ,内容,感情,場所,理由,既読\n';
      exhibitFeedbacks.forEach(f => {
        const date = new Date(f.createdAt).toLocaleString();
        const exhibitName = exhibits.find(e => e.id === f.exhibitId)?.name || '不明';
        const typeStr = f.inputType || '';
        const content = `"${(f.content || '').replace(/"/g, '""')}"`;
        const q1 = `"${(Array.isArray(f.q1) ? f.q1.join('、') : '').replace(/"/g, '""')}"`;
        const q2 = `"${(f.q2 || '').replace(/"/g, '""')}"`;
        const q3 = `"${(f.q3 || '').replace(/"/g, '""')}"`;
        const isRead = f.isRead ? '既読' : '未読';
        csvContent += `${date},${exhibitName},${typeStr},${content},${q1},${q2},${q3},${isRead}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* サマリー数値 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {hasEventSurvey && (
          <div 
            className="card" 
            style={{ textAlign: 'center', padding: '12px', cursor: 'pointer', transition: 'all 0.2s', border: '2px solid transparent' }}
            onClick={() => eventId && router.push(`/admin/events/${eventId}/event-survey`)}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{totalSurveys}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>イベント回答</div>
          </div>
        )}
        <div className="card" style={{ textAlign: 'center', padding: '12px', gridColumn: (!hasEventSurvey && !hasExhibits) ? '1 / -1' : 'auto' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{totalFeedbacks}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>感想総数</div>
        </div>
        {hasExhibits && (
          <div className="card" style={{ textAlign: 'center', padding: '12px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{exhibits.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>参加個別枠数</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {hasEventSurvey && (
          <button className="btn-outline" onClick={() => downloadCSV('eventFeedbacks')} style={{ flex: 1, padding: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Download size={14} /> イベント回答をCSV出力
          </button>
        )}
        {hasExhibits && (
          <button className="btn-outline" onClick={() => downloadCSV('exhibitFeedbacks')} style={{ flex: 1, padding: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Download size={14} /> 個別枠宛て感想をCSV出力
          </button>
        )}
      </div>

      {/* 個別枠別 受信感想数 */}
      {hasExhibits && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>個別枠別 受信感想数（詳細確認）</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {feedbacksByExhibit.map((c) => (
              <button 
                key={c.id} 
                className="card" 
                onClick={() => eventId && router.push(`/admin/events/${eventId}/exhibits/${c.id}`)}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', textAlign: 'left', transition: 'transform 0.1s, box-shadow 0.1s'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>{c.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                    {c.count > 0 ? `${c.count}件の感想が届いています` : 'まだ感想はありません'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: c.count > 0 ? 'var(--color-primary)' : 'var(--color-text-light)' }}>
                    {c.count}
                  </div>
                  <ChevronRight size={18} color="var(--color-text-light)" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* イベントアンケート直近 */}
      {hasEventSurvey && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>イベント回答 (直近3件)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {eventFeedbacks.slice(0, 3).map((s) => {
              const surveyData = {
                type: s.inputType,
                content: s.content,
                q1: s.q1,
                q2: s.q2,
                q3: s.q3
              };
              return (
                <div key={s.id} className="card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                    {new Date(s.createdAt).toLocaleString()}
                  </div>
                  {surveyData.content && (
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                        {surveyData.content}
                      </p>
                    </div>
                  )}
                  
                  {surveyData.type === 'questions' && Array.isArray(surveyData.q1) && surveyData.q1.length > 0 && (
                    <details style={{ cursor: 'pointer' }}>
                      <summary style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, userSelect: 'none', padding: '4px 0', outline: 'none' }}>
                        詳細を見る
                      </summary>
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px', borderLeft: '2px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.75rem' }}><span style={{ color: 'var(--color-text-light)' }}>感情:</span> {surveyData.q1.join('、')}</div>
                        <div style={{ fontSize: '0.75rem' }}><span style={{ color: 'var(--color-text-light)' }}>場所:</span> {surveyData.q2}</div>
                        <div style={{ fontSize: '0.75rem' }}><span style={{ color: 'var(--color-text-light)' }}>理由:</span> {surveyData.q3}</div>
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
            {eventFeedbacks.length === 0 && (
              <div className="card" style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                まだイベント回答はありません
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
