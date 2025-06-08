/**
 * Environment Configuration
 * Centralized configuration for environment-specific settings
 */

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Performance monitoring configuration
const showPerformanceMetrics = isDevelopment && process.env.NEXT_PUBLIC_SHOW_PERFORMANCE_METRICS !== 'false'

export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment,
  isProduction,

  // Development tools
  dev: {
    showPerformanceMetrics,
    showDebugPanel: isDevelopment && process.env.NEXT_PUBLIC_SHOW_DEBUG_PANEL !== 'false',
    enableBrowserDevTools: isDevelopment && process.env.NEXT_PUBLIC_ENABLE_BROWSER_DEVTOOLS !== 'false',
    enableConsoleLogging: isDevelopment && process.env.NEXT_PUBLIC_ENABLE_CONSOLE_LOGGING !== 'false',
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || (isDevelopment ? 'http://localhost:3000' : ''),
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },

  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },

  // Sentry Configuration
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    enabled: isProduction && process.env.NEXT_PUBLIC_SENTRY_ENABLED !== 'false',
  },

  // Feature Flags (can override constants)
  features: {
    selfImprovement: process.env.NEXT_PUBLIC_FEATURE_SELF_IMPROVEMENT !== 'false',
    personalContext: process.env.NEXT_PUBLIC_FEATURE_PERSONAL_CONTEXT !== 'false',
    dynamicPrompts: process.env.NEXT_PUBLIC_FEATURE_DYNAMIC_PROMPTS !== 'false',
    publicSharing: process.env.NEXT_PUBLIC_FEATURE_PUBLIC_SHARING !== 'false',
    ideaBranching: process.env.NEXT_PUBLIC_FEATURE_IDEA_BRANCHING !== 'false',
    bulkExport: process.env.NEXT_PUBLIC_FEATURE_BULK_EXPORT !== 'false',
  },

  // MCP Server Configuration
  mcp: {
    browserDevTools: {
      enabled: isDevelopment && process.env.NEXT_PUBLIC_MCP_BROWSER_DEVTOOLS !== 'false',
      url: process.env.NEXT_PUBLIC_MCP_BROWSER_DEVTOOLS_URL || 'ws://localhost:8080',
    },
  },
} as const

// Type for the config object
export type Config = typeof config
