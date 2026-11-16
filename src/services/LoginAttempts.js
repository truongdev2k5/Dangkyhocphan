// Authentication requests from the same address are checked in arrival order.
class LoginAttempts {
  constructor(now = Date.now) {
    this.now = now;
    this.attempts = new Map();
    this.pending = new Map();
  }

  async run(key, authenticate) {
    const previous = this.pending.get(key) || Promise.resolve();
    const result = previous.then(() => this.check(key, authenticate));
    const settled = result.catch(() => {});
    this.pending.set(key, settled);
    try {
      return await result;
    } finally {
      if (this.pending.get(key) === settled) this.pending.delete(key);
    }
  }

  async check(key, authenticate) {
    let state = this.attempts.get(key);
    const wait = (state?.until || 0) - this.now();
    if (wait > 0) throw this.locked(wait);
    if (state?.count >= 5) {
      this.clear(key);
      state = undefined;
    }
    try {
      const data = await authenticate();
      this.clear(key);
      return data;
    } catch (err) {
      if (err.status !== 401) throw err;
      const count = (state?.count || 0) + 1;
      const delay = count >= 5 ? 300000 : count === 3 ? 30000 : 0;
      this.clear(key);
      const next = { count, until: this.now() + delay };
      // Forget incomplete sequences after 24h of inactivity; restart after the 5th penalty.
      next.timer = setTimeout(() => {
        if (this.attempts.get(key) === next) this.clear(key);
      }, count >= 5 ? delay : 86400000);
      next.timer.unref();
      this.attempts.set(key, next);
      if (delay) throw this.locked(delay);
      throw err;
    }
  }

  clear(key) {
    clearTimeout(this.attempts.get(key)?.timer);
    this.attempts.delete(key);
  }

  locked(ms) {
    const retryAfter = Math.ceil(ms / 1000);
    return { status: 429, retryAfter, message: `Vui lòng thử lại sau ${retryAfter} giây.` };
  }
}
module.exports = LoginAttempts;
