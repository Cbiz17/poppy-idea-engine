'use client';

import { useEffect } from 'react';

export function DevToolsInitializer() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Suppress console errors about devtools
      import('@/lib/suppress-devtools-errors');
      
      // Initialize monitoring tools
      Promise.all([
        import('@/lib/monitoring/network'),
        import('@/lib/monitoring/performance'),
        import('@/lib/monitoring/browser-devtools').then(({ initBrowserDevTools }) => {
          initBrowserDevTools();
        })
      ]).catch(err => {
        console.warn('Failed to initialize dev tools:', err);
      });
    }
  }, []);

  return null;
}