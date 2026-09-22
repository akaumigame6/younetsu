"use client";
import { useRouter, usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  // トップページとアンケートフロー最初のページはヘッダーを非表示
  if (pathname === '/' || pathname === '/survey') return null;

  const isAdmin = pathname.startsWith('/admin');

  const handleTitleClick = () => {
    if (isAdmin) router.push('/admin/dashboard');
    else router.push('/viewer');
  };

  return (
    <header
      className="header"
      style={{ display: 'flex', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <button
        onClick={handleTitleClick}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--color-text)',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={20} />
          {isAdmin ? '主催者管理' : 'YouNestu'}
        </div>
      </button>
    </header>
  );
}
