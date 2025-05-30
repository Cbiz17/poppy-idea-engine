'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Tailwind CSS Test</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-800 mb-4">If you can see this styled correctly, Tailwind is working!</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Test Button
          </button>
        </div>
      </div>
    </div>
  )
}
