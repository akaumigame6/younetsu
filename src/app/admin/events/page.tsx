"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, Settings, X, HelpCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getAdminEvents, createEvent } from '../../../actions/event';

export default function AdminEventsList() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);

  // モーダル用ステート
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStartDate, setNewEventStartDate] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  
  // 追加の設定項目
  const [eventType, setEventType] = useState('group');
  const [hasEventSurvey, setHasEventSurvey] = useState(true);
  const [hasExhibits, setHasExhibits] = useState(true);
  const [exhibitTerm, setExhibitTerm] = useState('作家');
  const [newEventExhibitNames, setNewEventExhibitNames] = useState('');
  
  const [showExhibitHelp, setShowExhibitHelp] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        setLoading(false);
        return;
      }
      
      const userId = session.user.id;
      setAdminId(userId);

      const { data, error } = await getAdminEvents(userId);
      if (data) {
        setEvents(data);
      } else {
        console.error('Failed to fetch events', error);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId || !newEventTitle || !newEventStartDate || !newEventEndDate) return;

    if (!hasEventSurvey && !hasExhibits) {
      alert('イベントの感想（大枠）か個別枠の感想（小枠）のどちらかはONにしてください。');
      return;
    }

    setIsCreating(true);
    const { data, error } = await createEvent({
      title: newEventTitle,
      startDate: new Date(newEventStartDate),
      endDate: new Date(newEventEndDate),
      location: newEventLocation,
      adminId: adminId,
      eventType: eventType,
      hasEventSurvey: hasEventSurvey,
      hasExhibits: hasExhibits,
      exhibitTerm: exhibitTerm,
      exhibitNames: newEventExhibitNames.split('\n').map(n => n.trim()).filter(Boolean)
    });

    setIsCreating(false);

    if (data) {
      setIsModalOpen(false);
      setNewEventTitle('');
      setNewEventStartDate('');
      setNewEventEndDate('');
      setNewEventLocation('');
      setNewEventExhibitNames('');
      setEventType('group');
      setHasEventSurvey(true);
      setHasExhibits(true);
      setExhibitTerm('作家');
      setEvents(prev => [data, ...prev]);
    } else {
      alert('イベントの作成に失敗しました。');
    }
  };

  return (
    <div className="content-area fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title" style={{ margin: 0 }}>マイイベント一覧</h1>
          <p className="subtitle" style={{ marginTop: '8px', marginBottom: 0 }}>管理しているイベントを選択してください</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ width: 'auto', padding: '12px 24px' }}>
          <Plus size={20} />
          <span className="hide-on-mobile">新規イベント</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>読み込み中...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-light)' }}>
          イベントがありません。「新規イベント」から作成してください。
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {events.map((ev) => (
            <div 
              key={ev.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onClick={() => router.push(`/admin/events/${ev.id}/dashboard`)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>{ev.title}</h2>
                <div style={{ padding: '6px', backgroundColor: 'var(--color-surface)', borderRadius: '50%' }}>
                  <Settings size={18} color="var(--color-text-light)" />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} />
                  {ev.startDate ? new Date(ev.startDate).toLocaleDateString('ja-JP') : ''} 〜 {ev.endDate ? new Date(ev.endDate).toLocaleDateString('ja-JP') : ''}
                </div>
              </div>
              
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 'bold', textAlign: 'right' }}>
                ダッシュボードを開く →
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新規イベント作成モーダル */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '500px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', padding: '8px', color: 'var(--color-text-light)' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px' }}>新規イベントの作成</h2>
            
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">イベント名 <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  className="input-text" 
                  value={newEventTitle} 
                  onChange={e => setNewEventTitle(e.target.value)} 
                  required 
                  placeholder="例：秋の芸術祭 2024"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">開始日 <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="date" 
                    className="input-text" 
                    value={newEventStartDate} 
                    onChange={e => setNewEventStartDate(e.target.value)} 
                    required 
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">終了日 <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="date" 
                    className="input-text" 
                    value={newEventEndDate} 
                    onChange={e => setNewEventEndDate(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">開催場所</label>
                <input 
                  type="text" 
                  className="input-text" 
                  value={newEventLocation} 
                  onChange={e => setNewEventLocation(e.target.value)} 
                  placeholder="例：〇〇ギャラリー"
                />
              </div>

              <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '8px 0' }}></div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={hasExhibits} 
                    onChange={e => setHasExhibits(e.target.checked)} 
                    style={{ width: 'auto' }}
                  />
                  <span>個別枠（作家や作品ごと）の感想を集める</span>
                  <span onClick={(e) => { e.preventDefault(); setShowExhibitHelp(true); }}>
                    <HelpCircle size={16} style={{ color: 'var(--color-text-light)', cursor: 'pointer' }} />
                  </span>
                </label>
              </div>

              {hasExhibits && (
                <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">個別枠の呼び名</label>
                    <select 
                      className="input-text" 
                      value={exhibitTerm} 
                      onChange={e => setExhibitTerm(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="作家">作家 (Creator)</option>
                      <option value="作品">作品 (Artwork)</option>
                      <option value="ブース">ブース (Booth)</option>
                      <option value="発表者">発表者 (Presenter)</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">個別枠の名前を一括追加（任意）</label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 0, marginBottom: '4px' }}>
                      1行に1つの名前を入力してください。後からでも追加できます。
                    </p>
                    <textarea 
                      className="input-text" 
                      value={newEventExhibitNames}
                      onChange={e => setNewEventExhibitNames(e.target.value)}
                      placeholder={"山田太郎\n鈴木花子\n佐藤次郎"}
                      rows={4}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>
                  キャンセル
                </button>
                <button type="submit" className="btn-primary" disabled={isCreating}>
                  {isCreating ? '作成中...' : '作成する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 個別枠の説明モーダル */}
      {showExhibitHelp && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button 
              onClick={() => setShowExhibitHelp(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', padding: '8px', color: 'var(--color-text-light)' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px' }}>個別枠とは？</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
              イベント全体だけでなく、参加している<strong>「個別の作家」「出展ブース」「個々の作品」</strong>に対する感想を分けて集めたい場合に使用します。
              <br /><br />
              チェックをオンにすると、各個別枠ごとに専用のQRコードやURLが発行でき、鑑賞者はピンポイントで感想を送ることができます。
            </p>
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button className="btn-primary" onClick={() => setShowExhibitHelp(false)} style={{ width: '100%' }}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
