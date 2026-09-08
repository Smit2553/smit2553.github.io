import type { Request } from "express";

export class RateLimitError extends Error {
  status = 429;
  retryAfterSeconds: number;

  constructor(message = "Too many requests. Please try again later.", retryAfterMs = 60000) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  }
}

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
// This protects one Node process. Multi-process deployments need an atomic
// shared limiter (for example Redis) to enforce a global request budget.
const maxBucketCount = 10000;
const cleanupBatchSize = 250;
let cleanupIterator: IterableIterator<[string, Bucket]> | null = null;

export function getClientIp(request: Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function cleanupExpiredBuckets(now: number): void {
  if (!cleanupIterator) {
    cleanupIterator = buckets.entries();
  }

  for (let scanned = 0; scanned < cleanupBatchSize; scanned += 1) {
    const entry = cleanupIterator.next();

    if (entry.done) {
      cleanupIterator = null;
      return;
    }

    const [key, bucket] = entry.value;

    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function assertRateLimit(request: Request, action: string, limit: number, windowMs: number, identity?: string): void {
  const now = Date.now();
  const key = `${action}:${identity ?? getClientIp(request)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (bucket) {
      buckets.delete(key);
    }

    if (buckets.size >= maxBucketCount) {
      cleanupExpiredBuckets(now);
    }

    if (buckets.size >= maxBucketCount) {
      throw new RateLimitError("Too many requests. Please try again later.");
    }

    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= limit) {
    throw new RateLimitError("Too many requests. Please try again later.", bucket.resetAt - now);
  }

  bucket.count += 1;
}
