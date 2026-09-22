"use client";
import { useRouter } from 'next/navigation';
import { ChevronRight, Download } from 'lucide-react';
import type { Creator, FeedbackRecord, SurveyRecord } from '../../types';

export default function TabOverview({ creators, feedbacks, surveys }: { creators: Creator[], feedbacks: FeedbackRecord[], surveys: SurveyRecord[] }) {
  const router = useRouter();
  const totalFeedbacks = feedbacks.length;
  const totalSurveys = surveys.length;
  const feedbacksByCreator = creators.map((c) => ({
    ...c,
    count: feedbacks.filter((f) => f.creatorId === c.id).length,
  }));

  const downloadCSV = (type: 'surveys' | 'feedbacks') => {
    let csvContent = '\uFEFF'; // BOM
    if (type === 'surveys') {
      csvContent += '日時,入力タイプ,内容,感情,場所,理由\n';
      surveys.forEach(s => {
        const date = new Date(s.createdAt).toLocaleString();
        const typeStr = s.inputType || '';
        const content = `"${(s.content || '').replace(/"/g, '""')}"`;
        const q1 = `"${(Array.isArray(s.q1) ? s.q1.join('、') : '').replace(/"/g, '""')}"`;
        const q2 = `"${(s.q2 || '').replace(/"/g, '""')}"`;
        const q3 = `"${(s.q3 || '').replace(/"/g, '""')}"`;
        csvContent += `${date},${typeStr},${content},${q1},${q2},${q3}\n`;
      });
    } else {
      csvContent += '日時,作家名,入力タイプ,内容,感情,場所,理由,既読\n';
      feedbacks.forEach(f => {
        const date = new Date(f.createdAt).toLocaleString();
        const creatorName = creators.find(c => c.id === f.creatorId)?.name || '不明';
        const typeStr = f.inputType || '';
        const content = `"${(f.content || '').replace(/"/g, '""')}"`;
        const q1 = `"${(Array.isArray(f.q1) ? f.q1.join('、') : '').replace(/"/g, '""')}"`;
        const q2 = `"${(f.q2 || '').replace(/"/g, '""')}"`;
        const q3 = `"${(f.q3 || '').replace(/"/g, '""')}"`;
        const isRead = f.isRead ? '既読' : '未読';
        csvContent += `${date},${creatorName},${typeStr},${content},${q1},${q2},${q3},${isRead}\n`;
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
        <div 
          className="card" 
          style={{ textAlign: 'center', padding: '12px', cursor: 'pointer', transition: 'all 0.2s', border: '2px solid transparent' }}
          onClick={() => router.push('/admin/event-survey')}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{totalSurveys}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>イベント回答</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{totalFeedbacks}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>感想総数</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{creators.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>参加作家数</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn-outline" onClick={() => downloadCSV('surveys')} style={{ flex: 1, padding: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Download size={14} /> イベント回答をCSV出力
        </button>
        <button className="btn-outline" onClick={() => downloadCSV('feedbacks')} style={{ flex: 1, padding: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Download size={14} /> 作家宛て感想をCSV出力
        </button>
      </div>

      {/* 作家別 受信感想数 */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>作家別 受信感想数（詳細確認）</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {feedbacksByCreator.map((c) => (
            <button 
              key={c.id} 
              className="card" 
              onClick={() => router.push(`/admin/creator/${c.id}`)}
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

      {/* イベントアンケート直近 */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>イベントアンケート (直近3件)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {surveys.slice(0, 3).map((s) => {
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
                  <p style={{ margin: 0, fontSize: '0.9rem', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                    {surveyData.content}
                  </p>
                )}
                {surveyData.type === 'questions' && Array.isArray(surveyData.q1) && surveyData.q1.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px', borderLeft: '2px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.75rem' }}><span style={{ color: 'var(--color-text-light)' }}>感情:</span> {surveyData.q1.join('、')}</div>
                    <div style={{ fontSize: '0.75rem' }}><span style={{ color: 'var(--color-text-light)' }}>場所:</span> {surveyData.q2}</div>
                    <div style={{ fontSize: '0.75rem' }}><span style={{ color: 'var(--color-text-light)' }}>理由:</span> {surveyData.q3}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
