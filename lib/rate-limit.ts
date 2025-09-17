/**
 * Simple in-memory rate limiter for API endpoints
 * In production, consider using Redis or a service like Upstash
 */

type RateLimitStore = Map<string, { count: number; resetTime: number }>;

const store: RateLimitStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetTime < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  interval?: number; // Time window in milliseconds (default: 1 minute)
  uniqueTokenPerInterval?: number; // Max requests per interval (default: 10)
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const interval = options.interval || 60 * 1000; // 1 minute
  const limit = options.uniqueTokenPerInterval || 10;
  
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / interval)}`;
  
  const record = store.get(key) || {
    count: 0,
    resetTime: now + interval
  };
  
  if (record.resetTime < now) {
    record.count = 0;
    record.resetTime = now + interval;
  }
  
  record.count++;
  store.set(key, record);
  
  const remaining = Math.max(0, limit - record.count);
  const success = record.count <= limit;
  
  return {
    success,
    remaining,
    reset: record.resetTime
  };
}

// Helper to get IP from request
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real.trim();
  }
  
  // Fallback to a generic identifier
  return 'anonymous';
}