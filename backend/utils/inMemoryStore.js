/**
 * In-memory store for failed attempts and temporary blocks.
 * PRIVACY: No personal data stored. Only counts and block expiry.
 * Data is lost on process restart (no persistence).
 */

const BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const MAX_FAILED_ATTEMPTS = 5;

// key: arbitrary session/key (e.g. wallet address or session id) -> { count, blockedUntil }
const failedAttempts = new Map();

/**
 * Record a failed attempt. Returns true if caller should be blocked.
 * @param {string} key - Identifier (e.g. wallet address). Not stored long-term; used only for this Map.
 * @returns {{ blocked: boolean, remainingAttempts?: number }}
 */
export function recordFailedAttempt(key) {
  const now = Date.now();
  let entry = failedAttempts.get(key);

  if (!entry) {
    entry = { count: 0, blockedUntil: 0 };
    failedAttempts.set(key, entry);
  }

  if (entry.blockedUntil > now) {
    return { blocked: true };
  }

  entry.count += 1;
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    return { blocked: true };
  }

  return { blocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - entry.count };
}

/**
 * Clear failed attempts on success so user is not penalized.
 * @param {string} key
 */
export function clearFailedAttempts(key) {
  failedAttempts.delete(key);
}

/**
 * Check if key is currently blocked (no personal data returned).
 * @param {string} key
 * @returns {{ blocked: boolean, retryAfterMs?: number }}
 */
export function isBlocked(key) {
  const entry = failedAttempts.get(key);
  if (!entry) return { blocked: false };
  const now = Date.now();
  if (entry.blockedUntil <= now) {
    failedAttempts.delete(key);
    return { blocked: false };
  }
  return { blocked: true, retryAfterMs: entry.blockedUntil - now };
}

export { MAX_FAILED_ATTEMPTS, BLOCK_DURATION_MS };
