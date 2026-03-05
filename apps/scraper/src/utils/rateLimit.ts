export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait a random duration between min and max milliseconds.
 * Use between requests to be polite to target servers.
 */
export async function politeDelay(minMs = 800, maxMs = 1800): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  await sleep(delay);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        console.warn(`  Attempt ${attempt} failed, retrying in ${delayMs}ms…`);
        await sleep(delayMs * attempt);
      }
    }
  }
  throw lastError;
}
