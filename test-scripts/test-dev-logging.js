// Test script for dev logging
// Run this in your browser console while on localhost:3000

async function testDevLogging() {
  console.log('Testing dev logging system...');
  
  try {
    // Test 1: Log an info message
    const response1 = await fetch('/api/dev-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'info',
        component: 'TestScript',
        message: 'Dev logging system test - INFO level',
        data: { test: true, timestamp: new Date().toISOString() }
      })
    });
    
    console.log('Info log response:', response1.ok ? 'Success' : 'Failed');
    
    // Test 2: Log a warning
    const response2 = await fetch('/api/dev-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'warn',
        component: 'TestScript',
        message: 'Dev logging system test - WARN level',
        data: { warning: 'This is a test warning' }
      })
    });
    
    console.log('Warn log response:', response2.ok ? 'Success' : 'Failed');
    
    // Test 3: Log an error
    const response3 = await fetch('/api/dev-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        component: 'TestScript',
        message: 'Dev logging system test - ERROR level',
        data: { error: 'This is a test error', stack: 'No real stack trace' }
      })
    });
    
    console.log('Error log response:', response3.ok ? 'Success' : 'Failed');
    
    // Test 4: Check if we can retrieve logs
    const getResponse = await fetch('/api/dev-logs?limit=10');
    if (getResponse.ok) {
      const logs = await getResponse.json();
      console.log('Retrieved logs:', logs);
    }
    
    console.log('✅ Dev logging test complete!');
    
  } catch (error) {
    console.error('❌ Dev logging test failed:', error);
  }
}

// Run the test
testDevLogging();
