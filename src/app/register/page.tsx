import { signup } from '../login/actions'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string, error?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams.error;

  let displayError = error;
  if (error) {
    if (error.includes('Password should be at least 6 characters')) {
      displayError = 'パスワードは6文字以上で入力してください。';
    } else if (error.toLowerCase().includes('rate limit exceeded') || error.includes('429')) {
      displayError = 'メール送信回数の上限に達しました。しばらく時間をおいてから再度お試しください。';
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>新規登録</h1>
      
      {displayError && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {displayError}
        </div>
      )}

      <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="email" style={{ fontWeight: 600 }}>メールアドレス</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="password" style={{ fontWeight: 600 }}>パスワード</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            required 
            minLength={6}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
          <small style={{ color: '#666', fontSize: '0.8rem' }}>※6文字以上の半角英数字</small>
        </div>
        
        <button 
          formAction={signup} 
          style={{ 
            padding: '0.75rem', 
            background: '#0066cc', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '1rem'
          }}
        >
          登録する
        </button>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <a href="/login" style={{ color: '#333', textDecoration: 'none' }}>
          すでにアカウントをお持ちの方はこちら
        </a>
      </div>
    </div>
  )
}
