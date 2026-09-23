import { NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // next パラメータがあればそこへ遷移、なければ /admin/events
  const next = searchParams.get('next') ?? '/admin/events'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Auth Callback Error:', error)
      return NextResponse.redirect(`${origin}/login?error=Invalid+or+expired+link`)
    }
  }

  // code がない場合はエラーとする
  return NextResponse.redirect(`${origin}/login?error=Missing+auth+code`)
}
