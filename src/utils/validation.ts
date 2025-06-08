/**
 * Validation Utilities
 * Common validation functions for form inputs and data
 */

import { REGEX, UI } from '@/constants'

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  return REGEX.EMAIL.test(email.trim())
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  return REGEX.URL.test(url.trim())
}

/**
 * Validate idea title
 */
export function validateIdeaTitle(title: string): { isValid: boolean; error?: string } {
  const trimmed = title.trim()
  
  if (!trimmed) {
    return { isValid: false, error: 'Title is required' }
  }
  
  if (trimmed.length > UI.IDEA_TITLE_MAX_LENGTH) {
    return { isValid: false, error: `Title must be less than ${UI.IDEA_TITLE_MAX_LENGTH} characters` }
  }
  
  return { isValid: true }
}

/**
 * Validate idea content
 */
export function validateIdeaContent(content: string): { isValid: boolean; error?: string } {
  const trimmed = content.trim()
  
  if (!trimmed) {
    return { isValid: false, error: 'Content is required' }
  }
  
  if (trimmed.length > UI.IDEA_CONTENT_MAX_LENGTH) {
    return { isValid: false, error: `Content must be less than ${UI.IDEA_CONTENT_MAX_LENGTH} characters` }
  }
  
  return { isValid: true }
}

/**
 * Validate chat message
 */
export function validateChatMessage(message: string): { isValid: boolean; error?: string } {
  const trimmed = message.trim()
  
  if (!trimmed) {
    return { isValid: false, error: 'Message cannot be empty' }
  }
  
  if (trimmed.length > UI.CHAT_INPUT_MAX_LENGTH) {
    return { isValid: false, error: `Message must be less than ${UI.CHAT_INPUT_MAX_LENGTH} characters` }
  }
  
  return { isValid: true }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Check if a string contains only alphanumeric characters and underscores
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(str)
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
} {
  const errors: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  // Calculate strength
  const strengthScore = [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length
  
  if (strengthScore >= 5) strength = 'strong'
  else if (strengthScore >= 3) strength = 'medium'
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}