'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=Could not authenticate user')
  }

  revalidatePath('/admin/events')
  redirect('/admin/events')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  // 現在のセッション（匿名ユーザー等）が存在するか確認
  const { data: { user } } = await supabase.auth.getUser()

  let authError;

  if (user) {
    // 既存のセッションがある場合は「昇格（UUID維持）」として updateUser を使う
    const { error } = await supabase.auth.updateUser({ email, password })
    authError = error;
  } else {
    // キャッシュクリア等によりセッションが全くない場合は、通常の新規登録として signUp を使う
    const { error } = await supabase.auth.signUp({ email, password })
    authError = error;
  }

  if (authError) {
    console.error('Signup Error:', authError.message)
    redirect(`/register?error=${encodeURIComponent(authError.message)}`)
  }

  // 匿名から正規ユーザーへの昇格後、古いJWTトークン(is_anonymous: true)が残るのを防ぐため、
  // 明示的に再ログイン処理を行って最新のセッション(is_anonymous: false)をCookieに焼き直す
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (loginError) {
    console.error('Auto-login Error after signup:', loginError.message)
  }

  redirect('/admin/events')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
