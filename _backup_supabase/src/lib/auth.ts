import { cookies } from 'next/headers';
import { supabase } from './supabase';

/**
 * サーバーコンポーネントおよびAPIルート向けの管理者検証関数。
 */
export async function verifyAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    
    if (!token) {
      return false;
    }

    // トークンからユーザー情報を取得
    const { data: { user }, error } = await supabase!.auth.getUser(token);
    
    if (error || !user) {
      return false;
    }

    // 匿名ユーザー（来場者など）を弾く
    if (user.is_anonymous) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in verifyAdmin:', error);
    return false;
  }
}


