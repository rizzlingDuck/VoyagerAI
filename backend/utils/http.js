class ToolError extends Error {
  constructor(message, { tool, status, retryable = true, cause } = {}) {
    super(message);
    this.name = "ToolError";
    this.tool = tool;
    this.status = status;
    this.retryable = retryable;
    this.cause = cause;
  }
}

async function fetchJson(url, { tool = "external_api", timeoutMs = 10000, signal, ...options } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const handleAbort = () => controller.abort(signal.reason);

  if (signal?.aborted) {
    clearTimeout(timeout);
    throw new ToolError(`${tool} request was cancelled`, {
      tool,
      retryable: false,
      cause: signal.reason,
    });
  }

  signal?.addEventListener("abort", handleAbort, { once: true });

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const responseText = await response.text();

    if (!response.ok) {
      throw new ToolError(`${tool} request failed with HTTP ${response.status}`, {
        tool,
        status: response.status,
        retryable: response.status === 429 || response.status >= 500,
      });
    }

    if (!responseText) return null;

    try {
      return JSON.parse(responseText);
    } catch (err) {
      throw new ToolError(`${tool} returned invalid JSON`, {
        tool,
        retryable: false,
        cause: err,
      });
    }
  } catch (err) {
    if (err instanceof ToolError) throw err;

    const timedOut = err.name === "AbortError" && !signal?.aborted;
    throw new ToolError(
      timedOut
        ? `${tool} request timed out after ${timeoutMs}ms`
        : `${tool} request failed: ${err.message}`,
      {
        tool,
        retryable: !signal?.aborted,
        cause: err,
      }
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", handleAbort);
  }
}

module.exports = { ToolError, fetchJson };
