import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 標準クライアント
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false // Node.js環境でのテスト用
  }
})

async function runTest() {
  console.log('=== Supabase Anonymous User Upgrade Test ===\n')
  
  console.log('[1] Creating Anonymous User...')
  const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
  if (anonError) throw anonError
  
  const originalUser = anonData.user
  if (!originalUser) throw new Error('No user returned')
  
  console.log('UUID:', originalUser.id)
  console.log('is_anonymous:', originalUser.is_anonymous)
  
  console.log('\n[2] Executing updateUser({ email, password }) ALL AT ONCE...')
  const testEmail = `test_${Date.now()}@example.com`
  const testPassword = 'password123'
  
  // 1発で設定
  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    email: testEmail,
    password: testPassword
  })
  
  if (updateError) {
    console.error('updateUser(All at once) Failed:', updateError.message)
    console.log('-> 一括更新は仕様により弾かれるようです。')
  } else {
    console.log('updateUser(All at once) Succeeded.')
  }

  // もし弾かれたら、別のAnonymousユーザーを作って2段階設定を試す
  if (updateError) {
    console.log('\n--- 2段階設定のテスト ---')
    await supabase.auth.signOut()
    
    console.log('[1] Creating another Anonymous User...')
    const { data: anonData2 } = await supabase.auth.signInAnonymously()
    const user2 = anonData2.user!
    console.log('UUID:', user2.id)
    
    const email2 = `test2_${Date.now()}@example.com`
    console.log(`\n[2] Executing updateUser({ email: '${email2}' }) only...`)
    const { error: emailError } = await supabase.auth.updateUser({ email: email2 })
    if (emailError) {
      console.error('Email update failed:', emailError.message)
    } else {
      console.log('Email set successfully.')
      
      console.log('\n[3] Executing updateUser({ password }) BEFORE email is confirmed...')
      const { error: passError } = await supabase.auth.updateUser({ password: testPassword })
      if (passError) {
        console.error('Password update failed:', passError.message)
        console.log('-> メール確認前にはパスワードは設定できない仕様のようです。')
      } else {
        console.log('Password set successfully before confirmation.')
      }
    }
  }
}

runTest().catch(e => console.error('Test script crashed:', e))
