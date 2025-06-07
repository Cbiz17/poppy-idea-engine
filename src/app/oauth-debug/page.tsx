export default function OAuthDebugPage() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'Server-side rendered';
  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'Server-side rendered';
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OAuth Configuration Debug</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Current URLs</h2>
            <div className="space-y-2 font-mono text-sm">
              <p><strong>Origin:</strong> {origin}</p>
              <p><strong>Redirect URL:</strong> {redirectUrl}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Required Supabase Configuration</h2>
            <p className="mb-4">Add these URLs to your Supabase project's Authentication → URL Configuration → Redirect URLs:</p>
            <div className="bg-gray-100 p-4 rounded space-y-2 font-mono text-sm">
              <p>https://poppy-idea-engine-git-main-christian-butlers-projects.vercel.app/auth/callback</p>
              <p>https://poppy-idea-engine-j8i8d9d5g-christian-butlers-projects.vercel.app/auth/callback</p>
              <p>https://poppy-idea-engine.vercel.app/auth/callback</p>
              <p>http://localhost:3000/auth/callback</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Supabase Project Info</h2>
            <div className="space-y-2 font-mono text-sm">
              <p><strong>Project URL:</strong> https://eaahmigctnbqhaqptlvw.supabase.co</p>
              <p><strong>Auth Callback:</strong> https://eaahmigctnbqhaqptlvw.supabase.co/auth/v1/callback</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Google OAuth Configuration</h2>
            <p className="mb-4">In Google Cloud Console, ensure your OAuth 2.0 Client ID has this authorized redirect URI:</p>
            <div className="bg-gray-100 p-4 rounded font-mono text-sm">
              <p>https://eaahmigctnbqhaqptlvw.supabase.co/auth/v1/callback</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Test Links</h2>
            <div className="space-y-2">
              <a href="/auth-debug" className="text-blue-600 hover:underline block">→ Auth Debug Page</a>
              <a href="/test/manual-auth-test.html" className="text-blue-600 hover:underline block">→ Manual Auth Test</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}