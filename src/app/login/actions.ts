'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'

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

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect('/register?error=Could not authenticate user')
  }

  // NOTE: Supabase側で「Confirm email」が有効な場合、サインアップしてもすぐにはログインできず、
  // 確認メールをクリックするまで認証されません。
  // テスト用ですぐにログインさせたい場合は、Supabaseダッシュボードから「Confirm email」の設定をオフにしてください。

  revalidatePath('/admin/events')
  redirect('/admin/events')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
