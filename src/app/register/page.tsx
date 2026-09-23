import { signup } from '../login/actions'

export default function RegisterPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>新規登録</h1>
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
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
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
