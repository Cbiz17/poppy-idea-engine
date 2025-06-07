import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  message?: string;  // Custom error message
}

// In-memory store for rate limiting (consider Redis for production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = config;

  return async function rateLimitMiddleware(req: NextRequest) {
    // Get client identifier (IP or user ID)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const identifier = forwardedFor || realIp || 'anonymous';
    const now = Date.now();

    // Get or create request count entry
    let requestData = requestCounts.get(identifier);
    
    if (!requestData || now > requestData.resetTime) {
      // Create new window
      requestData = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // Increment request count
    requestData.count++;
    requestCounts.set(identifier, requestData);

    // Check if limit exceeded
    if (requestData.count > max) {
      return NextResponse.json(
        { 
          error: message,
          retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((requestData.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(requestData.resetTime).toISOString()
          }
        }
      );
    }

    // Add rate limit headers to response
    const headers = {
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': (max - requestData.count).toString(),
      'X-RateLimit-Reset': new Date(requestData.resetTime).toISOString()
    };

    return { headers };
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime + 60000) { // Clean up entries older than 1 minute past reset
      requestCounts.delete(key);
    }
  }
}, 60000); // Run cleanup every minute

// Preset configurations
export const rateLimits = {
  // Chat endpoint: 30 requests per minute
  chat: rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many chat requests. Please wait before sending more messages.'
  }),
  
  // Feedback: 100 requests per minute
  feedback: rateLimit({
    windowMs: 60 * 1000,
    max: 100
  }),
  
  // Ideas: 50 requests per minute
  ideas: rateLimit({
    windowMs: 60 * 1000,
    max: 50
  }),
  
  // Embedding: 20 requests per minute
  embedding: rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Embedding generation rate limit exceeded.'
  }),
  
  // Auth: 10 requests per minute
  auth: rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts.'
  })
};
