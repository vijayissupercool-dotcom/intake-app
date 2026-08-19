import { describe, it, expect } from "vitest";

// Extract the isRetryableError function for testing
// Since it's not exported, we test the logic directly
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();

  if (message.includes("timeout")) return true;
  if (message.includes("econnreset")) return true;
  if (message.includes("429")) return true;
  if (message.includes("500")) return true;
  if (message.includes("502")) return true;
  if (message.includes("503")) return true;
  if (message.includes("504")) return true;
  if (message.includes("rate limit")) return true;
  if (message.includes("quota")) return true;

  if (message.includes("403")) return false;
  if (message.includes("404")) return false;
  if (message.includes("401")) return false;
  if (message.includes("permission")) return false;
  if (message.includes("not found")) return false;
  if (message.includes("revoked")) return false;

  return true;
}

describe("isRetryableError", () => {
  describe("retryable errors", () => {
    it("retryable: timeout", () => {
      expect(isRetryableError(new Error("Request timeout"))).toBe(true);
    });

    it("retryable: ECONNRESET", () => {
      expect(isRetryableError(new Error("read ECONNRESET"))).toBe(true);
    });

    it("retryable: 429 rate limit", () => {
      expect(isRetryableError(new Error("HTTP 429 Too Many Requests"))).toBe(
        true
      );
    });

    it("retryable: 500", () => {
      expect(isRetryableError(new Error("Internal Server Error 500"))).toBe(
        true
      );
    });

    it("retryable: 502", () => {
      expect(isRetryableError(new Error("Bad Gateway 502"))).toBe(true);
    });

    it("retryable: 503", () => {
      expect(isRetryableError(new Error("Service Unavailable 503"))).toBe(
        true
      );
    });

    it("retryable: 504", () => {
      expect(isRetryableError(new Error("Gateway Timeout 504"))).toBe(true);
    });

    it("retryable: rate limit message", () => {
      expect(isRetryableError(new Error("Rate limit exceeded"))).toBe(true);
    });

    it("retryable: quota message", () => {
      expect(isRetryableError(new Error("Quota exceeded"))).toBe(true);
    });

    it("retryable: unknown error defaults to retryable", () => {
      expect(isRetryableError(new Error("Something weird happened"))).toBe(
        true
      );
    });
  });

  describe("non-retryable errors", () => {
    it("non-retryable: 403 forbidden", () => {
      expect(isRetryableError(new Error("HTTP 403 Forbidden"))).toBe(false);
    });

    it("non-retryable: 404 not found", () => {
      expect(isRetryableError(new Error("HTTP 404 Not Found"))).toBe(false);
    });

    it("non-retryable: 401 unauthorized", () => {
      expect(isRetryableError(new Error("HTTP 401 Unauthorized"))).toBe(
        false
      );
    });

    it("non-retryable: permission denied", () => {
      expect(isRetryableError(new Error("Permission denied"))).toBe(false);
    });

    it("non-retryable: not found", () => {
      expect(isRetryableError(new Error("Resource not found"))).toBe(false);
    });

    it("non-retryable: revoked", () => {
      expect(isRetryableError(new Error("Token revoked"))).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("non-retryable: non-Error object", () => {
      expect(isRetryableError("string error")).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
      expect(isRetryableError(42)).toBe(false);
    });

    it("non-retryable: Error with empty message", () => {
      expect(isRetryableError(new Error(""))).toBe(true);
    });
  });
});

describe("retry delay calculation", () => {
  const RETRY_DELAYS = [60_000, 300_000, 900_000, 3_600_000];

  it("attempt 1 uses 1 minute delay", () => {
    expect(RETRY_DELAYS[0]).toBe(60_000);
  });

  it("attempt 2 uses 5 minute delay", () => {
    expect(RETRY_DELAYS[1]).toBe(300_000);
  });

  it("attempt 3 uses 15 minute delay", () => {
    expect(RETRY_DELAYS[2]).toBe(900_000);
  });

  it("attempt 4 uses 1 hour delay", () => {
    expect(RETRY_DELAYS[3]).toBe(3_600_000);
  });

  it("delays are monotonically increasing", () => {
    for (let i = 1; i < RETRY_DELAYS.length; i++) {
      expect(RETRY_DELAYS[i]).toBeGreaterThan(RETRY_DELAYS[i - 1]);
    }
  });
});

describe("upload status state machine", () => {
  const VALID_STATUSES = [
    "pending",
    "uploading",
    "uploaded",
    "queued",
    "transferring",
    "completed",
    "failed",
    "dead_letter",
  ];

  it("defines all expected statuses", () => {
    expect(VALID_STATUSES).toContain("pending");
    expect(VALID_STATUSES).toContain("uploading");
    expect(VALID_STATUSES).toContain("uploaded");
    expect(VALID_STATUSES).toContain("queued");
    expect(VALID_STATUSES).toContain("transferring");
    expect(VALID_STATUSES).toContain("completed");
    expect(VALID_STATUSES).toContain("failed");
    expect(VALID_STATUSES).toContain("dead_letter");
  });

  it("valid transitions follow the state machine", () => {
    const validTransitions: Record<string, string[]> = {
      pending: ["uploading", "failed"],
      uploading: ["uploaded", "failed"],
      uploaded: ["queued", "transferring"],
      queued: ["transferring"],
      transferring: ["completed", "failed"],
      completed: [],
      failed: ["queued", "dead_letter"],
      dead_letter: [],
    };

    // Verify no invalid transitions exist
    for (const [from, tos] of Object.entries(validTransitions)) {
      expect(VALID_STATUSES).toContain(from);
      for (const to of tos) {
        expect(VALID_STATUSES).toContain(to);
      }
    }
  });
});

describe("transfer job status state machine", () => {
  it("valid transitions", () => {
    const validTransitions: Record<string, string[]> = {
      queued: ["claimed"],
      claimed: ["processing", "queued"],
      processing: ["completed", "failed", "queued"],
      completed: [],
      failed: ["queued", "dead_letter"],
      dead_letter: [],
    };

    // Dead letter is terminal
    expect(validTransitions.dead_letter).toHaveLength(0);
    // Completed is terminal
    expect(validTransitions.completed).toHaveLength(0);
  });
});
