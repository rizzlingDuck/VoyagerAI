/**
 * Retries an async function with exponential backoff.
 *
 * @param {() => Promise<any>} fn - The async function to retry.
 * @param {object} [options]
 * @param {number} [options.maxAttempts=3] - Maximum number of attempts.
 * @param {number} [options.baseDelayMs=500] - Base delay in ms. Doubles each attempt.
 * @param {string} [options.label="operation"] - Label for log messages.
 * @returns {Promise<any>}
 */
async function withRetry(fn, { maxAttempts = 3, baseDelayMs = 500, label = "operation" } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;

      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 500ms → 1000ms → 2000ms
      console.warn(
        `[Retry] ${label} failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms... Error: ${err.message}`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { withRetry };
