// Suppress React DevTools errors in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    // Filter out React DevTools errors
    if (
      args[0]?.includes('Cannot read properties of null (reading \'alternate\')') ||
      args[0]?.includes('Cannot read properties of null (reading \'child\')') ||
      args[0]?.includes('slow execution detected') ||
      args[0]?.includes('Instrumentation') ||
      args[0]?.includes('downloadReactDevTools') ||
      args[0]?.includes('launchChromely') ||
      args[0]?.includes('openStreamConnection') ||
      args[0]?.includes('browserTracingIntegration')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}
