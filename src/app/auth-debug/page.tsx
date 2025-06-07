import { SimpleAuthButton } from '@/components/auth/SimpleAuthButton';

export default function AuthDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Simple Auth Test</h2>
          <p className="text-gray-600 mb-6">
            This is a minimal authentication implementation to test if basic OAuth flow works.
          </p>
          
          <SimpleAuthButton />
          
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <ul className="text-sm space-y-1">
              <li>Origin: {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</li>
              <li>Callback URL: {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'SSR'}</li>
              <li>Environment: {process.env.NODE_ENV}</li>
            </ul>
          </div>
          
          <div className="mt-6">
            <a 
              href="/test/manual-auth-test.html" 
              className="text-blue-600 hover:underline"
            >
              → Try manual auth test (no React)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}