"use client";
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, CheckCheck } from 'lucide-react';
import { useViewerFeedback } from '../../../../context/ViewerFeedbackContext';
import { useState, useEffect } from 'react';
import type { Creator } from '../../../../types';

import { supabase } from '../../../../lib/supabase';

export default function MyFeedbackDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatorName, setCreatorName] = useState<string>('読み込み中...');

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!id) return;
      setLoading(true);
      
      // まずFeedbackRecordから探す
      let { data, error } = await supabase.from('FeedbackRecord').select('*').eq('id', id).single();
      if (data) {
        setFeedback({ id: data.id, type: 'creator', creatorId: data.creatorId, data: data, timestamp: data.createdAt });
      } else {
        // なければSurveyRecordを探す
        const { data: survey } = await supabase.from('SurveyRecord').select('*').eq('id', id).single();
        if (survey) {
          setFeedback({ id: survey.id, type: 'event', data: survey, timestamp: survey.createdAt });
        }
      }
      setLoading(false);
    };
    fetchFeedback();
  }, [id]);

  useEffect(() => {
    if (feedback?.type === 'creator' && feedback.creatorId) {
      fetch(`/api/creators`)
        .then(res => res.json())
        .then(data => {
          const found = data.find((c: Creator) => c.id === feedback.creatorId);
          if (found) setCreatorName(found.name);
          else setCreatorName('不明な作家');
        })
        .catch(() => setCreatorName('不明な作家'));
    }
  }, [feedback]);

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
        <button className="btn-ghost" onClick={() => router.push('/viewer')}>戻る</button>
      </div>
    );
  }

  const handleEdit = () => {
    const dataStr = encodeURIComponent(JSON.stringify(feedback.data));
    if (feedback.type === 'event') {
      // イベントアンケートの場合は、新規作成時と同じように入り口ページから始める
      router.push('/survey');
    } else {
      router.push(`/survey/wizard?context=creator&creatorId=${feedback.creatorId}&editMode=true&editId=${feedback.id}&initialData=${dataStr}`);
    }
  };

  const title = feedback.type === 'event' 
    ? 'イベント全体アンケート' 
    : `宛先: ${creatorName}`;

  return (
    <div className="content-area fade-in">
      <button 
        className="btn-ghost" 
        style={{ alignSelf: 'flex-start', padding: 0, marginBottom: '16px' }}
        onClick={() => router.push('/viewer')}
      >
        <ArrowLeft size={20} />
        メニューへ戻る
      </button>

      <h1 className="title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
          送信日時: {new Date(feedback.timestamp).toLocaleString()}
        </div>
        {feedback.type === 'creator' && feedback.data.isRead && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-primary)',
            color: 'var(--color-primary)', padding: '4px 8px', borderRadius: '16px',
            fontSize: '0.75rem', fontWeight: 600
          }}>
            <CheckCheck size={14} /> 作家さんがこの感想を読みました！
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
      </div>

      <button className="btn-primary" onClick={handleEdit}>
        <Edit3 size={18} />
        内容を修正する
      </button>
    </div>
  );
}
