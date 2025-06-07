'use client'

export default function FixAuthPage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>Direct Authentication Fix</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Option 1: Direct OAuth Link</h2>
        <p>Click this link to sign in with Google:</p>
        <a 
          href="https://eaahmigctnbqhaqptlvw.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://poppy-idea-engine.vercel.app/auth/callback"
          style={{ 
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#4285f4',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px'
          }}
        >
          Sign in with Google (Direct Link)
        </a>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Option 2: Manual JavaScript</h2>
        <button
          onClick={() => {
            const url = 'https://eaahmigctnbqhaqptlvw.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://poppy-idea-engine.vercel.app/auth/callback';
            window.location.href = url;
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#34a853',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Sign in with Google (JavaScript)
        </button>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Debug Info:</h2>
        <p>If neither button works, JavaScript is not loading.</p>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server Side'}</p>
      </div>
    </div>
  )
}
