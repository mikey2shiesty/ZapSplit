// ═══════════════════════════════════════════════════════════════
// Rate Limiter Client - Call Edge Function for rate limiting
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../services/supabase';

export type RateLimitAction =
  | 'api_default'
  | 'receipt_scan'
  | 'friend_request'
  | 'split_create'
  | 'payment'
  | 'login';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check if an action is rate limited
 * @param action - The type of action to check
 * @returns RateLimitResult with allowed status and remaining quota
 */
export async function checkRateLimit(action: RateLimitAction): Promise<RateLimitResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Allow unauthenticated users but with stricter limits
      return {
        allowed: true,
        remaining: 10,
        resetAt: Date.now() + 60000,
        limit: 10,
      };
    }

    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: {
        userId: user.id,
        action,
      },
    });

    if (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow the action if rate limiter fails
      return {
        allowed: true,
        remaining: -1,
        resetAt: 0,
        limit: 0,
      };
    }

    return data as RateLimitResult;
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Fail open
    return {
      allowed: true,
      remaining: -1,
      resetAt: 0,
      limit: 0,
    };
  }
}

/**
 * Wrapper to check rate limit before performing an action
 * @param action - The type of action
 * @param fn - The function to execute if allowed
 * @returns The result of fn or throws if rate limited
 */
export async function withRateLimit<T>(
  action: RateLimitAction,
  fn: () => Promise<T>
): Promise<T> {
  const result = await checkRateLimit(action);

  if (!result.allowed) {
    const resetIn = Math.ceil((result.resetAt - Date.now() / 1000) / 60);
    throw new Error(`Rate limited. Try again in ${resetIn} minutes.`);
  }

  return fn();
}

/**
 * Get human-readable rate limit status
 */
export function getRateLimitMessage(result: RateLimitResult): string {
  if (result.allowed) {
    return `${result.remaining} of ${result.limit} remaining`;
  }

  const now = Math.floor(Date.now() / 1000);
  const seconds = result.resetAt - now;

  if (seconds < 60) {
    return `Rate limited. Try again in ${seconds} seconds.`;
  } else if (seconds < 3600) {
    return `Rate limited. Try again in ${Math.ceil(seconds / 60)} minutes.`;
  } else {
    return `Rate limited. Try again in ${Math.ceil(seconds / 3600)} hours.`;
  }
}

/**
 * Rate limit configurations (for display purposes)
 */
export const RATE_LIMIT_INFO = {
  api_default: {
    description: 'General API calls',
    limit: 60,
    window: '1 minute',
  },
  receipt_scan: {
    description: 'Receipt scans',
    limit: 20,
    window: '24 hours',
  },
  friend_request: {
    description: 'Friend requests',
    limit: 30,
    window: '1 hour',
  },
  split_create: {
    description: 'Split creations',
    limit: 50,
    window: '1 hour',
  },
  payment: {
    description: 'Payment attempts',
    limit: 20,
    window: '1 hour',
  },
  login: {
    description: 'Login attempts',
    limit: 10,
    window: '15 minutes',
  },
};
