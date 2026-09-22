"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Users, BarChart2, Copy, LogOut, Settings } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';
import { useEventSettings } from '../../../../../context/EventSettingsContext';

import type { Exhibit, ExhibitFeedback, EventFeedback } from '../../../../../types';

import TabOverview from '../../../../../components/admin/TabOverview';
import TabExhibits from '../../../../../components/admin/TabExhibits';
import TabExhibitSettings from '../../../../../components/admin/TabExhibitSettings';
import TabEventSettings from '../../../../../components/admin/TabEventSettings';

type TabKey = 'overview' | 'exhibits' | 'exhibit-settings' | 'event-settings';

export default function AdminDashboard() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string | undefined;

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const { settings } = useEventSettings();
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [exhibitFeedbacks, setExhibitFeedbacks] = useState<ExhibitFeedback[]>([]);
  const [eventFeedbacks, setEventFeedbacks] = useState<EventFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    Promise.all([
      fetch(`/api/admin/exhibits?eventId=${eventId}`).then(res => res.json()),
      fetch(`/api/admin/exhibit-feedbacks?eventId=${eventId}`).then(res => res.json()),
      fetch(`/api/admin/event-feedbacks?eventId=${eventId}`).then(res => res.json())
    ]).then(([cData, fData, sData]) => {
      setExhibits(Array.isArray(cData) ? cData : []);
      
      const parsedFData = (Array.isArray(fData) ? fData : []).map(f => ({
        ...f,
        q1: f.q1
      }));
      setExhibitFeedbacks(parsedFData);
      
      const parsedSData = (Array.isArray(sData) ? sData : []).map(s => ({
        ...s,
        q1: s.q1
      }));
      setEventFeedbacks(parsedSData);
      
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [eventId]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',         label: '感想概要',       icon: <BarChart2 size={15} /> },
    { key: 'exhibits',         label: 'URL発行',         icon: <Copy size={15} /> },
    ...(settings.hasExhibits ? [{ key: 'exhibit-settings' as TabKey, label: '個別枠設定', icon: <Users size={15} /> }] : []),
    { key: 'event-settings',   label: 'イベント設定',    icon: <Settings size={15} /> },
  ];

  if (loading) {
    return <div className="content-area fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>読み込み中...</div>;
  }

  return (
    <div className="content-area fade-in">
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="title" style={{ margin: 0 }}>{settings.eventName || '管理ダッシュボード'}</h1>
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
      {activeTab === 'overview' && (
        <TabOverview 
          exhibits={exhibits} 
          exhibitFeedbacks={exhibitFeedbacks} 
          eventFeedbacks={eventFeedbacks} 
          hasExhibits={settings.hasExhibits}
          hasEventSurvey={settings.hasEventSurvey}
        />
      )}
      {activeTab === 'exhibits' && (
        <TabExhibits 
          exhibits={exhibits} 
          hasExhibits={settings.hasExhibits}
        />
      )}
      {activeTab === 'exhibit-settings' && <TabExhibitSettings exhibits={exhibits} setExhibits={setExhibits} />}
      {activeTab === 'event-settings'   && <TabEventSettings />}
    </div>
  );
}
