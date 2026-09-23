"use client";
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, CheckCheck } from 'lucide-react';
import { useViewerFeedback } from '../../../../../../context/ViewerFeedbackContext';
import { useEventSettings } from '../../../../../../context/EventSettingsContext';
import { useState, useEffect } from 'react';
import type { Exhibit } from '../../../../../../types';
import { parseUTCDate } from '../../../../../../utils/date';

import { getExhibitFeedbackById, getEventFeedbackById } from '../../../../../../actions/survey';

export default function MyFeedbackDetail() {
  const { id, eventId } = useParams<{ id: string, eventId: string }>();
  const router = useRouter();

  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exhibitName, setExhibitName] = useState<string>('読み込み中...');
  const { settings } = useEventSettings();

  // 表示用のカスタム質問リストを取得
  let customQuestionsList: any[] = [];
  try {
    const q = settings?.customQuestions;
    if (Array.isArray(q)) {
      customQuestionsList = q;
    } else if (typeof q === 'string') {
      const parsed = JSON.parse(q);
      customQuestionsList = Array.isArray(parsed) ? parsed : [];
    }
  } catch {}

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!id) return;
      setLoading(true);
      
      // まずFeedbackRecordから探す
      let { data, error } = await getExhibitFeedbackById(id);
      if (data && data.q1) data.q1 = data.q1;
      if (data) {
        setFeedback({ id: data.id, type: 'exhibit', exhibitId: data.exhibitId, data: data, timestamp: data.createdAt });
      } else {
        // なければSurveyRecordを探す
        const { data: survey } = await getEventFeedbackById(id);
        if (survey && survey.q1) survey.q1 = survey.q1;
        if (survey) {
          setFeedback({ id: survey.id, type: 'event', data: survey, timestamp: survey.createdAt });
        }
      }
      setLoading(false);
    };
    fetchFeedback();
  }, [id]);

  useEffect(() => {
    if (feedback?.type === 'exhibit' && feedback.exhibitId && eventId) {
      fetch(`/api/exhibits?eventId=${eventId}`)
        .then(res => res.json())
        .then(data => {
          const found = data.find((c: Exhibit) => c.id === feedback.exhibitId);
          if (found) setExhibitName(found.name);
          else setExhibitName(`不明な${settings?.exhibitTerm || '個別枠'}`);
        })
        .catch(() => setExhibitName(`不明な${settings?.exhibitTerm || '個別枠'}`));
    }
  }, [feedback, eventId]);

  if (loading) {
    return (
      <div className="content-area fade-in">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="content-area fade-in">
        <p>感想が見つかりません。</p>
        <button className="btn-ghost" onClick={() => router.push(eventId ? `/events/${eventId}/viewer` : '/viewer')}>戻る</button>
      </div>
    );
  }

  const handleEdit = () => {
    const dataStr = encodeURIComponent(JSON.stringify(feedback.data));
    if (feedback.type === 'event') {
      // イベントアンケートの場合は、新規作成時と同じように入り口ページから始める
      router.push(eventId ? `/events/${eventId}/survey` : '/survey');
    } else {
      router.push(eventId ? `/events/${eventId}/survey/wizard?context=creator&exhibitId=${feedback.exhibitId}&editMode=true&editId=${feedback.id}&initialData=${dataStr}` : `/survey/wizard?context=creator&exhibitId=${feedback.exhibitId}&editMode=true&editId=${feedback.id}&initialData=${dataStr}`);
    }
  };

  const title = feedback.type === 'event' 
    ? 'イベント全体アンケート' 
    : `宛先: ${exhibitName}`;

  return (
    <div className="content-area fade-in">
      <button 
        className="btn-ghost" 
        style={{ alignSelf: 'flex-start', padding: 0, marginBottom: '16px' }}
        onClick={() => router.push(eventId ? `/events/${eventId}/viewer` : '/viewer')}
      >
        <ArrowLeft size={20} />
        メニューへ戻る
      </button>

      <h1 className="title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
          送信日時: {parseUTCDate(feedback.timestamp).toLocaleString()}
        </div>
        {feedback.type === 'exhibit' && feedback.data.isRead && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-primary)',
            color: 'var(--color-primary)', padding: '4px 8px', borderRadius: '16px',
            fontSize: '0.75rem', fontWeight: 600
          }}>
            <CheckCheck size={14} /> この感想が読まれました！
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        {feedback.data.content && (
          <div style={{ marginBottom: (feedback.data.q1 && feedback.data.q1.length > 0) ? '24px' : '0', paddingBottom: (feedback.data.q1 && feedback.data.q1.length > 0) ? '16px' : '0', borderBottom: (feedback.data.q1 && feedback.data.q1.length > 0) ? '1px solid var(--color-border)' : 'none' }}>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{feedback.data.content}</p>
          </div>
        )}
        {feedback.data.q1 && feedback.data.q1.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Q. どんな感情になったか</div>
              <div style={{ fontWeight: 500 }}>{feedback.data.q1.join('、')}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Q. どこでそう感じたか</div>
              <div style={{ fontWeight: 500 }}>{feedback.data.q2 || '（未回答）'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Q. その理由は</div>
              <div style={{ fontWeight: 500 }}>{feedback.data.q3 || '（未回答）'}</div>
            </div>
          </div>
        )}

        {feedback.type === 'event' && feedback.data.customAnswers && Object.keys(feedback.data.customAnswers).length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {customQuestionsList.filter((q: any) => feedback.data.customAnswers[q.id]).map((q: any) => (
                <div key={q.id}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Q. {q.label}</div>
                  <div style={{ fontWeight: 500 }}>
                    {Array.isArray(feedback.data.customAnswers[q.id]) 
                      ? (feedback.data.customAnswers[q.id] as string[]).join('、') 
                      : feedback.data.customAnswers[q.id]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button className="btn-primary" onClick={handleEdit}>
        <Edit3 size={18} />
        内容を修正する
      </button>
    </div>
  );
}
