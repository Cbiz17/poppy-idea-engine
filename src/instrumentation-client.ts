// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Debug mode
  debug: false,
  
  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Filtering
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    // Facebook related errors
    "fb_xd_fragment",
    // Chrome extensions
    /extension\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
  ],
  
  beforeSend(event, hint) {
    // Filter out errors from browser extensions
    if (event.exception) {
      const error = hint.originalException as Error & { stack?: string };
      if (error && error.stack && error.stack.match(/chrome-extension:|moz-extension:|ms-browser-extension:/)) {
        return null;
      }
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
