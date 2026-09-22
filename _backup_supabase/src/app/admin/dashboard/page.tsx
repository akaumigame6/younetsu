"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BarChart2, Copy, LogOut, Settings } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

import type { Creator, FeedbackRecord, SurveyRecord } from '../../../types';

import TabOverview from '../../../components/admin/TabOverview';
import TabCreators from '../../../components/admin/TabCreators';
import TabCreatorSettings from '../../../components/admin/TabCreatorSettings';
import TabEventSettings from '../../../components/admin/TabEventSettings';

type TabKey = 'overview' | 'creators' | 'creator-settings' | 'event-settings';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [creators, setCreators] = useState<Creator[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/creators').then(res => res.json()),
      fetch('/api/admin/feedbacks').then(res => res.json()),
      fetch('/api/admin/surveys').then(res => res.json())
    ]).then(([cData, fData, sData]) => {
      // エラーオブジェクトが返ってきた場合に .map is not a function でクラッシュするのを防ぐ
      setCreators(Array.isArray(cData) ? cData : []);
      setFeedbacks(Array.isArray(fData) ? fData : []);
      setSurveys(Array.isArray(sData) ? sData : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',         label: '感想概要',       icon: <BarChart2 size={15} /> },
    { key: 'creators',         label: 'URL発行',         icon: <Copy size={15} /> },
    { key: 'creator-settings', label: '作家設定',        icon: <Users size={15} /> },
    { key: 'event-settings',   label: 'イベント設定',    icon: <Settings size={15} /> },
  ];

  if (loading) {
    return <div className="content-area fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>読み込み中...</div>;
  }

  return (
    <div className="content-area fade-in">
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="title" style={{ margin: 0 }}>管理ダッシュボード</h1>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)', fontSize: '0.85rem',
            color: 'var(--color-text-light)', cursor: 'pointer',
          }}
          onClick={async () => {
            await supabase!.auth.signOut();
            router.push('/admin');
          }}
        >
          <LogOut size={14} />
          ログアウト
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '4px',
        marginBottom: '20px',
        backgroundColor: 'var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '10px 8px', borderRadius: 'calc(var(--radius-sm) - 2px)',
              fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
              backgroundColor: activeTab === tab.key ? 'var(--color-surface)' : 'transparent',
              color: activeTab === tab.key ? 'var(--color-text)' : 'var(--color-text-light)',
              boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              border: 'none', cursor: 'pointer',
            }}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview'         && <TabOverview creators={creators} feedbacks={feedbacks} surveys={surveys} />}
      {activeTab === 'creators'         && <TabCreators creators={creators} />}
      {activeTab === 'creator-settings' && <TabCreatorSettings creators={creators} setCreators={setCreators} />}
      {activeTab === 'event-settings'   && <TabEventSettings />}
    </div>
  );
}
