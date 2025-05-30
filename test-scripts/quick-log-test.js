// Quick test to verify dev logging is working
// Run this in your browser console while on localhost:3000

async function quickLogTest() {
  console.log('Testing if dev logging is working...');
  
  try {
    const response = await fetch('/api/dev-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'info',
        component: 'QuickTest',
        message: 'Dev logging verification test - ' + new Date().toISOString(),
        data: { verified: true }
      })
    });
    
    if (response.ok) {
      console.log('✅ Dev logging is working!');
      
      // Try to fetch recent logs
      const getResponse = await fetch('/api/dev-logs?limit=5');
      if (getResponse.ok) {
        const logs = await getResponse.json();
        console.log('Recent logs:', logs);
      }
    } else {
      console.log('❌ Dev logging test failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing dev logs:', error);
  }
}

quickLogTest();
