"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Edit3, MessageSquare, Clock, ChevronRight, CheckCheck } from 'lucide-react';
import { useEventSettings } from '../../../../context/EventSettingsContext';
import { useViewerFeedback } from '../../../../context/ViewerFeedbackContext';
import type { Exhibit } from '../../../../types';
import { getEventFeedbacksByViewer, getExhibitFeedbacksByViewer } from '../../../../actions/survey';

// DBから取得したデータを統一フォーマットで扱うための型
interface NormalizedFeedback {
  id: string;
  type: 'event' | 'exhibit';
  exhibitId?: string;
  isRead?: boolean;
  data: any;
  timestamp: string;
}

/**
 * ViewerMenu - 鑑賞者向けメニューページ
 * アンケートフロー完了後（または2回目以降アクセス時）に到達するマイページ。
 * メニュー選択型の画面。
 */
export default function ViewerMenu() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string | undefined;

  const { settings } = useEventSettings();
  const { userId } = useViewerFeedback();
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [feedbacks, setFeedbacks] = useState<NormalizedFeedback[]>([]);

  useEffect(() => {
    if (eventId) {
      fetch(`/api/exhibits?eventId=${eventId}`)
        .then(res => res.json())
        .then(data => setExhibits(data))
        .catch(console.error);
    }
  }, [eventId]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!userId) return;
      try {
        // イベントアンケート取得
        const { data: surveys, error: surveyError } = await getEventFeedbacksByViewer(userId);
        
        // 小枠（作家等）感想取得
        const { data: exhibitFeedbacks, error: feedbackError } = await getExhibitFeedbacksByViewer(userId);

        const normalized: NormalizedFeedback[] = [];
        
        if (surveys) {
          surveys.forEach(s => {
            normalized.push({
              id: s.id,
              type: 'event',
              isRead: s.isRead,
              data: s,
              timestamp: s.createdAt.toISOString()
            });
          });
        }
        
        if (exhibitFeedbacks) {
          exhibitFeedbacks.forEach(f => {
            normalized.push({
              id: f.id,
              type: 'exhibit',
              exhibitId: f.exhibitId,
              isRead: f.isRead,
              data: f,
              timestamp: f.createdAt.toISOString()
            });
          });
        }
        
        // 日付で降順ソート
        normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setFeedbacks(normalized);
      } catch (err) {
        console.error('Failed to fetch user feedbacks', err);
      }
    };
    
    fetchFeedbacks();
  }, [userId]);

  return (
    <div className="content-area fade-in" style={{ justifyContent: 'flex-start' }}>
      <h1 className="title" style={{ textAlign: 'center', marginBottom: '8px' }}>
        {settings.eventName}
      </h1>
      <p className="subtitle" style={{ textAlign: 'center', marginBottom: '40px' }}>
        ご参加ありがとうございます
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {settings.hasEventSurvey && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              className="btn-primary"
              onClick={() => {
                const nextPath = eventId ? `/events/${eventId}/survey` : '/survey';
                router.push(nextPath);
              }}
            >
              <Edit3 size={20} />
              イベントのアンケートへ進む
            </button>
          </div>
        )}

        {settings.hasExhibits && (
          <button
            className={settings.hasEventSurvey ? "btn-secondary" : "btn-primary"}
            onClick={() => {
              const nextPath = eventId ? `/events/${eventId}/survey/exhibits` : '/survey/creators';
              router.push(nextPath);
            }}
          >
            <MessageSquare size={20} />
            {settings.exhibitTerm}の感想へ進む
          </button>
        )}
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'center', margin: 0 }}>
              ✏️ すでに回答済みの方は、こちらから内容を変更できます
        </p>

        {!settings.hasEventSurvey && !settings.hasExhibits && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
            現在募集中のアンケートはありません。
          </p>
        )}
      </div>

      <div style={{
        marginTop: '48px',
        padding: '16px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        fontSize: '0.85rem',
        color: 'var(--color-text-light)',
        textAlign: 'center',
      }}>
        感想は匿名で主催者{settings.hasExhibits ? `や${settings.exhibitTerm}` : ''}に届けられます。
      </div>

      {feedbacks.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>送った感想</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {feedbacks.map(f => {
              const date = new Date(f.timestamp);
              const timeString = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
              
              let title = '';
              const eventName = f.type === 'event' 
                ? (f.data?.event?.title || 'イベント') 
                : (f.data?.exhibit?.event?.title || 'イベント');
              
              if (f.type === 'event') {
                title = `${eventName}への全体アンケート`;
              } else if (f.type === 'exhibit' && f.exhibitId) {
                const exhibitName = f.data?.exhibit?.name || exhibits.find(c => c.id === f.exhibitId)?.name || '読み込み中...';
                title = `${eventName} - 宛先: ${exhibitName}`;
              }

              return (
                <button
                  key={f.id}
                  className="card"
                  onClick={() => {
                    const nextPath = eventId ? `/events/${eventId}/viewer/feedback/${f.id}` : `/viewer/feedback/${f.id}`;
                    router.push(nextPath);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', cursor: 'pointer', textAlign: 'left',
                    transition: 'transform 0.1s, box-shadow 0.1s'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                      <Clock size={12} /> {timeString} に送信
                      {f.isRead && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--color-primary)', fontWeight: 600, marginLeft: '8px' }}>
                          <CheckCheck size={14} /> 読まれました
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--color-text-light)" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
