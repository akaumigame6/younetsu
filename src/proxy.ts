import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // src/app/admin/layout.tsx でセットした Cookie からトークンを取得
  const token = request.cookies.get('sb-access-token')?.value;

  // 保護するパスの判定
  // （ログイン画面である /admin 自体は除外する）
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin';
  const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    // トークンがない（未認証）場合は弾く
    if (!token) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
      } else {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Middlewareを実行するパスを指定
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
