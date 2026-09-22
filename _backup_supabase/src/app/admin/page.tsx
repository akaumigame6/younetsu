"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Lock, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * AdminLogin - イベント主催者ログインページ
 * 現段階ではモックのみ。SupabaseのAuth実装後に接続。
 */
export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // 既にログイン済みの場合はダッシュボードへ自動遷移
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // 通常ログイン（匿名でない）セッションの場合のみ自動遷移する
      if (session && !session.user.is_anonymous) {
        // ローカルストレージにはセッションがあるがCookieが無い場合、Middlewareに弾かれて無限ループになるのを防ぐ
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax`;
        window.location.href = '/admin/dashboard';
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('ログインに失敗しました: ' + error.message);
    } else if (data.session) {
      // Middlewareが確実に認証を検知できるよう、遷移前にCookieをセット
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${data.session.expires_in}; SameSite=Lax`;
      // Next.jsのSoft Navigation(router.push)ではなくフルロードさせることでMiddlewareに確実を通す
      window.location.href = '/admin/dashboard';
    }
  };

  return (
    <div
      className="content-area fade-in"
      style={{ justifyContent: 'center', maxWidth: '400px', margin: '0 auto' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚙️</div>
        <h1 className="title" style={{ margin: 0 }}>主催者ログイン</h1>
        <p className="subtitle" style={{ marginTop: '8px', marginBottom: 0 }}>
          イベント主催者専用ページです。
        </p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label" htmlFor="email">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> メールアドレス
            </span>
          </label>
          <input
            id="email"
            type="email"
            className="input-text"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label" htmlFor="password">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> パスワード
            </span>
          </label>
          <input
            id="password"
            type="password"
            className="input-text"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#FFF3CD',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #FFD970',
            fontSize: '0.85rem',
            color: '#856404',
            whiteSpace: 'pre-wrap',
          }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary">
          <LogIn size={20} />
          ログイン
        </button>
      </form>

      <div style={{
        marginTop: '32px',
        padding: '12px 16px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        fontSize: '0.8rem',
        color: 'var(--color-text-light)',
        textAlign: 'center',
      }}>
        🔒 このページはイベント主催者のみアクセスできます
      </div>
    </div>
  );
}
