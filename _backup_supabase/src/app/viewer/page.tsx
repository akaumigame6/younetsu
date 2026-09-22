"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, MessageSquare, Clock, ChevronRight, CheckCheck } from 'lucide-react';
import { useEventSettings } from '../../context/EventSettingsContext';
import { useViewerFeedback } from '../../context/ViewerFeedbackContext';
import type { Creator } from '../../types';
import { supabase } from '../../lib/supabase';

// DBから取得したデータを統一フォーマットで扱うための型
interface NormalizedFeedback {
  id: string;
  type: 'event' | 'creator';
  creatorId?: string;
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
  const { settings } = useEventSettings();
  const { viewerId } = useViewerFeedback();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [feedbacks, setFeedbacks] = useState<NormalizedFeedback[]>([]);

  useEffect(() => {
    fetch('/api/creators')
      .then(res => res.json())
      .then(data => setCreators(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!viewerId) return;
      try {
        // イベントアンケート取得
        const { data: surveys, error: surveyError } = await supabase
          .from('SurveyRecord')
          .select('*')
          .eq('viewerId', viewerId);
        
        // 作家感想取得
        const { data: creatorFeedbacks, error: feedbackError } = await supabase
          .from('FeedbackRecord')
          .select('*')
          .eq('viewerId', viewerId);

        const normalized: NormalizedFeedback[] = [];
        
        if (surveys) {
          surveys.forEach(s => {
            normalized.push({
              id: s.id,
              type: 'event',
              data: s,
              timestamp: s.createdAt
            });
          });
        }
        
        if (creatorFeedbacks) {
          creatorFeedbacks.forEach(f => {
            normalized.push({
              id: f.id,
              type: 'creator',
              creatorId: f.creatorId,
              isRead: f.isRead,
              data: f,
              timestamp: f.createdAt
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
  }, [viewerId]);

  return (
    <div className="content-area fade-in" style={{ justifyContent: 'flex-start' }}>
      <h1 className="title" style={{ textAlign: 'center', marginBottom: '8px' }}>
        {settings.eventName}
      </h1>
      <p className="subtitle" style={{ textAlign: 'center', marginBottom: '40px' }}>
        ご参加ありがとうございます
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          className="btn-primary"
          onClick={() => router.push('/survey/creators')}
        >
          <MessageSquare size={20} />
          作家に感想を送る
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            className="btn-secondary"
            onClick={() => router.push('/survey')}
          >
            <Edit3 size={20} />
            イベントアンケートに答える
          </button>
          <p style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-light)',
            textAlign: 'center',
            margin: 0,
          }}>
            ✏️ すでに回答済みの方は、こちらから内容を変更できます
          </p>
        </div>
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
        感想は匿名で主催者作家に届けられます。
      </div>

      {feedbacks.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>送った感想</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {feedbacks.map(f => {
              const date = new Date(f.timestamp);
              const timeString = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
              
              let title = '';
              if (f.type === 'event') {
                title = 'イベント全体アンケート';
              } else if (f.type === 'creator' && f.creatorId) {
                const creator = creators.find(c => c.id === f.creatorId);
                title = creator ? `宛先: ${creator.name}` : '宛先: 読み込み中...';
              }

              return (
                <button
                  key={f.id}
                  className="card"
                  onClick={() => router.push(`/viewer/feedback/${f.id}`)}
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
                      {f.type === 'creator' && f.isRead && (
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
