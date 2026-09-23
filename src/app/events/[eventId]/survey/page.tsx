"use client";
import { useRouter, useParams } from 'next/navigation';
import { PenTool, Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { useEventSettings } from '../../../../context/EventSettingsContext';
import { useState, useEffect } from 'react';
import { getExistingEventFeedback, saveEventFeedback } from '../../../../actions/survey';
import { useViewerFeedback } from '../../../../context/ViewerFeedbackContext';

/**
 * EventSurvey - イベント全体のアンケート (鑑賞者が最初に見るページ)
 * アクセス直後に表示される。回答 or スキップで ExhibitSelect (旧CreatorSelect) へ進む。
 */
export default function EventSurvey() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string | undefined;

  const { settings } = useEventSettings();
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  
  const customQuestionsList = (() => {
    try {
      const q = settings.customQuestions;
      if (Array.isArray(q)) return q;
      if (typeof q === 'string') {
        const parsed = JSON.parse(q);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  })();

  const [isMounted, setIsMounted] = useState(false);
  const { userId } = useViewerFeedback();
  const [existingFeedbackId, setExistingFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 既存データ（下書きや回答済み）の復元
  useEffect(() => {
    const fetchExisting = async () => {
      if (!eventId || !userId) return;
      const { data } = await getExistingEventFeedback(userId, eventId);
      if (data) {
        setExistingFeedbackId(data.id);
        let parsedCustomAnswers: Record<string, any> = {};
        if (data.customAnswers) {
          try {
            parsedCustomAnswers = data.customAnswers;
          } catch {}
        } else if (data.referralSources) {
          try {
            const parsedRefs = data.referralSources;
            if (Array.isArray(parsedRefs) && parsedRefs.length > 0) {
              parsedCustomAnswers['q_referral'] = parsedRefs;
            }
          } catch {}
        }
        if (Object.keys(parsedCustomAnswers).length > 0) {
          setCustomAnswers(parsedCustomAnswers);
        }
      }
    };
    fetchExisting();
  }, [eventId, userId]);

  // Hydration mismatch を防ぐため、初回レンダリングが完了するまでスケルトンを表示するか、
  // 最低限の静的HTMLだけを返す
  if (!isMounted) {
    return (
      <div className="content-area fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--color-text-light)' }}>読み込み中...</p>
      </div>
    );
  }


  return (
    <div className="content-area fade-in" style={{ justifyContent: 'center' }}>
      {/* イベント全体の進行プログレス */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--color-text-light)',
          marginBottom: '8px',
        }}>
          <span>Step 1 / 2</span>
          <span>イベントアンケート</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: '50%' }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 className="title" style={{ marginBottom: '8px' }}>{settings.eventName}</h1>
        {settings.eventDesc && (
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
            {settings.eventDesc}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'var(--color-text-light)', alignItems: 'center' }}>
          {settings.venue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} /> {settings.venue}
            </div>
          )}
          {settings.startDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> 
              {settings.startDate} {settings.endDate && settings.endDate !== settings.startDate ? `〜 ${settings.endDate}` : ''}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginBottom: '24px', border: '1px solid var(--color-border)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} color="var(--color-primary)" />
          アンケートについて
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '12px' }}>
          所要時間：各項目約3分<br />
          ※感想の入力方法は、自由に記述する「自由記入」と、選択肢から答えていくと自動で文章になる「質問から生成」の2種類から選べます。
        </p>

        <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>回答フロー</div>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {settings.hasEventSurvey && (
              <li>イベント全体に関するアンケート</li>
            )}
            {settings.hasExhibits && (
              <li>{settings.exhibitTerm || '個別枠'} への感想</li>
            )}
          </ol>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '12px', backgroundColor: '#fff8e1', borderRadius: 'var(--radius-sm)', border: '1px solid #ffe082' }}>
          <AlertTriangle size={16} color="#f57f17" style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#f57f17', lineHeight: 1.5 }}>
            <strong>注意事項</strong><br />
            このアプリは卒業研究の成果物として作られています。入力されたデータは個人を特定しない形で分析・研究に使用されます（例：入力された個別の感想文が卒業研究でそのまま発表されることなどはありません）。予めご了承ください。
          </p>
        </div>
      </div>

      <p className="subtitle" style={{ textAlign: 'center', marginBottom: '16px', fontWeight: 600 }}>
        ご来場いただきありがとうございました。
        <br />
      </p>

      {settings.hasEventSurvey && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {customQuestionsList.map((q: any) => (
            <div key={q.id}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Q. {q.label}</p>
              {q.type === 'radio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map((opt: string) => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="radio" 
                        name={q.id}
                        value={opt} 
                        checked={customAnswers[q.id] === opt}
                        onChange={() => setCustomAnswers({...customAnswers, [q.id]: opt})}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'checkbox' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map((opt: string) => {
                    const currentValues = customAnswers[q.id] || [];
                    const isSelected = currentValues.includes(opt);
                    return (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCustomAnswers({...customAnswers, [q.id]: [...currentValues, opt]});
                            } else {
                              setCustomAnswers({...customAnswers, [q.id]: currentValues.filter((v: string) => v !== opt)});
                            }
                          }}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      )}


      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        {(() => {
          // 未回答チェック (すべて回答必須)
          const isAllAnswered = settings.hasEventSurvey && customQuestionsList.length > 0
            ? customQuestionsList.every((q: any) => {
                const answer = customAnswers[q.id];
                if (q.type === 'checkbox') {
                  return Array.isArray(answer) && answer.length > 0;
                }
                return answer && answer.toString().trim() !== '';
              })
            : true;

          return (
            <button
              className="btn-primary"
              disabled={!isAllAnswered}
              style={{ 
                opacity: isAllAnswered ? 1 : 0.5, 
                cursor: isAllAnswered ? 'pointer' : 'not-allowed' 
              }}
              onClick={async () => {
                if (settings.hasEventSurvey) {
                  if (!isAllAnswered) {
                    alert('すべての質問に回答してください。');
                    return;
                  }
                  const dataStr = encodeURIComponent(JSON.stringify({ customAnswers }));
                  const nextPath = eventId ? `/events/${eventId}/survey/wizard?context=event&initialData=${dataStr}` : `/survey/wizard?context=event&initialData=${dataStr}`;
                  router.push(nextPath);
                } else {
                  // イベント全体の感想がOFFの場合、カスタム回答もないため保存せずすぐに鑑賞者ダッシュボードへ遷移
                  router.push(`/events/${eventId}/viewer`);
                }
              }}
            >
              <PenTool size={18} />
              次に進む
            </button>
          );
        })()}
      </div>
    </div>
  );
}
