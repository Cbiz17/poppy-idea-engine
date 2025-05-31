// Application-wide constants
export const CATEGORIES = [
  'General',
  'Business', 
  'Creative',
  'Technology',
  'Personal Growth',
  'Learning',
  'Health & Wellness',
  'Productivity',
  'Finance',
  'Travel'
] as const

export type Category = typeof CATEGORIES[number]

export const FEEDBACK_TYPES = {
  THUMBS_UP: 'thumbs_up',
  THUMBS_DOWN: 'thumbs_down',
  RATING: 'rating'
} as const

export const DEVELOPMENT_TYPES = {
  REFINEMENT: 'refinement',
  MAJOR_REVISION: 'major_revision',
  BRANCH: 'branch',
  MERGE: 'merge'
} as const

export const VISIBILITY_OPTIONS = {
  PRIVATE: 'private',
  SHARED: 'shared',
  PUBLIC: 'public'
} as const

export const LIMITS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_IDEA_TITLE_LENGTH: 100,
  MAX_IDEA_CONTENT_LENGTH: 5000,
  MIN_FEEDBACK_FOR_ANALYSIS: 10,
  CONTINUATION_DETECTION_THRESHOLD: 0.3,
  RELATED_IDEAS_THRESHOLD: 0.7
} as const

export const TIMEOUTS = {
  CONTINUATION_BANNER: 10000, // 10 seconds
  API_REQUEST: 5000, // 5 seconds
  SAVE_SUCCESS_MESSAGE: 1500 // 1.5 seconds
} as const

export const ROUTES = {
  HOME: '/',
  CHAT: '/chat',
  IDEAS: '/ideas',
  ADMIN: '/admin',
  PROFILE: '/profile',
  DISCOVER: '/discover',
  ONBOARDING: '/onboarding'
} as const

export const API_ENDPOINTS = {
  CHAT: '/api/chat-enhanced',
  DETECT_CONTINUATION: '/api/detect-continuation',
  EMBED: '/api/embed',
  FEEDBACK: '/api/feedback',
  IDEAS: '/api/ideas',
  PROMPTS: '/api/prompts'
} as const
