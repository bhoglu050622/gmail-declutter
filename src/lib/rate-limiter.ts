export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsed * this.refillRate
    );
    this.lastRefill = now;
  }

  async consume(units: number): Promise<void> {
    this.refill();
    if (this.tokens >= units) {
      this.tokens -= units;
      return;
    }
    const wait = ((units - this.tokens) / this.refillRate) * 1000;
    await new Promise((r) => setTimeout(r, wait));
    this.tokens = 0;
  }
}

export const gmailRateLimiter = new TokenBucket(200, 200);
