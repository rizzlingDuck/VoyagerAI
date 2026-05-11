async function withRetry(fn, { maxAttempts = 3, baseDelayMs = 500, label = "operation" } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (err.retryable === false || err.name === "AbortError" || attempt === maxAttempts) {
        break;
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
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
