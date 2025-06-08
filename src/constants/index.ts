/**
 * Application Constants
 * Centralized location for all magic numbers, strings, and configuration values
 */

// ============================================
// UI Constants
// ============================================
export const UI = {
  // Animation durations (ms)
  ANIMATION_DURATION_SHORT: 150,
  ANIMATION_DURATION_MEDIUM: 300,
  ANIMATION_DURATION_LONG: 500,

  // Scroll behavior
  SCROLL_THRESHOLD: 100, // px from bottom to trigger actions
  SCROLL_DELAY: 50, // ms delay for scroll actions

  // Chat interface
  CHAT_INPUT_MAX_LENGTH: 5000,
  CHAT_MESSAGE_BATCH_SIZE: 20,
  TYPING_INDICATOR_DELAY: 200,

  // Ideas
  IDEA_TITLE_MAX_LENGTH: 200,
  IDEA_CONTENT_MAX_LENGTH: 10000,
  IDEA_CARD_PREVIEW_LENGTH: 150,
} as const

// ============================================
// API Constants
// ============================================
export const API = {
  // Timeouts (ms)
  DEFAULT_TIMEOUT: 30000,
  AI_CHAT_TIMEOUT: 60000,
  EMBED_TIMEOUT: 10000,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // Rate limiting
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
} as const

// ============================================
// AI Constants
// ============================================
export const AI = {
  // Model configuration
  MODEL_NAME: 'claude-3-opus-20240229',
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,

  // Embeddings
  EMBEDDING_MODEL: 'text-embedding-ada-002',
  EMBEDDING_DIMENSIONS: 1536,

  // Vector search
  SIMILARITY_THRESHOLD: 0.7,
  MAX_SEARCH_RESULTS: 50,

  // Continuation detection
  CONTINUATION_CONFIDENCE_THRESHOLD: 0.3,
  CONTINUATION_CHECK_INTERVAL: 4, // messages
  CONTINUATION_TIME_WINDOW: 48, // hours
} as const

// ============================================
// Feature Flags
// ============================================
export const FEATURES = {
  // These can be overridden by environment variables
  SELF_IMPROVEMENT: true,
  PERSONAL_CONTEXT: true,
  DYNAMIC_PROMPTS: true,
  PUBLIC_SHARING: true,
  IDEA_BRANCHING: true,
  BULK_EXPORT: true,
} as const

// ============================================
// Categories
// ============================================
export const CATEGORIES = [
  'productivity',
  'personal',
  'work',
  'learning',
  'creative',
  'health',
  'finance',
  'other',
] as const

export type Category = typeof CATEGORIES[number]

// ============================================
// Storage Keys
// ============================================
export const STORAGE_KEYS = {
  // Local storage
  THEME_PREFERENCE: 'poppy:theme',
  SIDEBAR_STATE: 'poppy:sidebar',
  LAST_CONVERSATION: 'poppy:lastConversation',
  
  // Session storage
  CURRENT_CHAT_ID: 'poppy:currentChatId',
  PENDING_SAVE: 'poppy:pendingSave',
} as const

// ============================================
// Error Messages
// ============================================
export const ERROR_MESSAGES = {
  // Generic errors
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',

  // Auth errors
  AUTH_REQUIRED: 'Please sign in to continue.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',

  // API errors
  RATE_LIMITED: 'Too many requests. Please try again later.',
  SERVER_ERROR: 'Server error. Please try again later.',

  // Feature errors
  IDEA_SAVE_FAILED: 'Failed to save idea. Please try again.',
  IDEA_LOAD_FAILED: 'Failed to load idea. Please try again.',
  CHAT_FAILED: 'Failed to send message. Please try again.',
} as const

// ============================================
// Success Messages
// ============================================
export const SUCCESS_MESSAGES = {
  IDEA_SAVED: 'Idea saved successfully!',
  IDEA_UPDATED: 'Idea updated successfully!',
  IDEA_DELETED: 'Idea deleted successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  FEEDBACK_SENT: 'Thank you for your feedback!',
} as const

// ============================================
// Regular Expressions
// ============================================
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SPECIAL_COMMAND: /^\/([\w]+)(?:\s+(.*))?$/,
} as const

// ============================================
// Keyboard Shortcuts
// ============================================
export const SHORTCUTS = {
  SAVE_IDEA: { key: 's', meta: true },
  NEW_CHAT: { key: 'n', meta: true },
  SEARCH: { key: 'k', meta: true },
  TOGGLE_SIDEBAR: { key: 'b', meta: true },
  FOCUS_CHAT: { key: '/', meta: false },
} as const