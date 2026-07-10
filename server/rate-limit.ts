import type { Request } from "express";

export class RateLimitError extends Error {
  status = 429;

  constructor(message = "Too many requests. Please try again later.") {
    super(message);
    this.name = "RateLimitError";
  }
}

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const maxBucketCount = 10000;

function getClientIp(request: Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

export function assertRateLimit(request: Request, action: string, limit: number, windowMs: number, identity?: string): void {
  const now = Date.now();

  if (buckets.size > maxBucketCount) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(bucketKey);
      }
    }
  }

  const key = `${action}:${identity ?? getClientIp(request)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= limit) {
    throw new RateLimitError();
  }

  bucket.count += 1;
}
