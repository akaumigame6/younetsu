"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, Link as LinkIcon, Edit, BarChart2, Shield } from 'lucide-react';

export default function TestDashboard() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState<any[]>([]);

  // クライアント側でオリジンを取得してフルURLを生成しやすくする
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleSeedTest = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/dev/seed-test', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to seed');
      
      setMessage('テストデータの生成に成功しました！');
      setEvents(data.events);
    } catch (err: any) {
      setMessage(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Shield size={32} color="var(--color-primary)" />
        <h1 className="title" style={{ margin: 0 }}>開発用テストダッシュボード</h1>
      </div>
      
      <p style={{ color: 'var(--color-text-light)', marginBottom: '32px' }}>
        各種設定パターンを網羅したテスト用イベントを一括生成し、各画面のリンクを素早く確認できます。
      </p>

      <div className="card" style={{ marginBottom: '40px', backgroundColor: '#f8f9fa' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>テストデータの生成</h2>
        <button 
          className="btn-primary" 
          onClick={handleSeedTest} 
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Database size={20} />
          {loading ? '生成中...' : 'テストイベントを一括生成する (既存のテストデータは上書きされます)'}
        </button>
        {message && (
          <p style={{ marginTop: '16px', fontWeight: 600, color: message.startsWith('エラー') ? 'var(--color-error)' : 'var(--color-primary)' }}>
            {message}
          </p>
        )}
      </div>

      {events.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, borderBottom: '2px solid var(--color-border)', paddingBottom: '8px' }}>
            生成されたテストリンク
          </h2>

          {events.map((evt) => (
            <div key={evt.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {evt.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', margin: 0 }}>
                  {evt.description}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--color-bg)', padding: '16px', borderRadius: '8px' }}>
                
                {/* 1. 来場者用（回答画面） */}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Edit size={14} /> 来場者用 (回答画面)
                  </div>
                  <a 
                    href={`${origin}/events/${evt.id}/survey`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ color: 'var(--color-primary)', wordBreak: 'break-all', textDecoration: 'underline', fontSize: '0.9rem' }}
                  >
                    {`${origin}/events/${evt.id}/survey`}
                  </a>
                </div>

                {/* 2. 管理者用（ダッシュボード画面） */}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BarChart2 size={14} /> 管理者用 (ダッシュボード)
                  </div>
                  <a 
                    href={`${origin}/admin/events/${evt.id}/dashboard`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ color: 'var(--color-primary)', wordBreak: 'break-all', textDecoration: 'underline', fontSize: '0.9rem' }}
                  >
                    {`${origin}/admin/events/${evt.id}/dashboard`}
                  </a>
                </div>

                {/* 3. 作家用（トークン画面） */}
                {evt.hasExhibits && (
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <LinkIcon size={14} /> 作家用 (小枠1の共有トークン)
                    </div>
                    <a 
                      href={`${origin}/events/${evt.id}/exhibits/${evt.id}-token-1`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: 'var(--color-primary)', wordBreak: 'break-all', textDecoration: 'underline', fontSize: '0.9rem' }}
                    >
                      {`${origin}/events/${evt.id}/exhibits/${evt.id}-token-1`}
                    </a>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
