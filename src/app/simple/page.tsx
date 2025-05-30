'use client'

export default function SimpleTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Simple Test Page</h1>
      <p style={{ marginBottom: '10px' }}>This page uses inline styles instead of Tailwind.</p>
      <button 
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#6366f1', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
        onClick={() => alert('Button clicked!')}
      >
        Test Button
      </button>
    </div>
  )
}
