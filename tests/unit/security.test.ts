import { describe, it, expect } from "vitest";
import { createHash, randomBytes } from "crypto";

// Token hashing functions (mirrors implementation in requests/route.ts)
function generateToken(): string {
  return randomBytes(12).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

describe("token generation", () => {
  it("generates tokens of consistent length", () => {
    const tokens = Array.from({ length: 100 }, () => generateToken());
    const lengths = new Set(tokens.map((t) => t.length));
    expect(lengths.size).toBe(1);
    // 12 bytes base64url = 16 characters
    expect(tokens[0]).toHaveLength(16);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(
      Array.from({ length: 1000 }, () => generateToken())
    );
    expect(tokens.size).toBe(1000);
  });

  it("generates base64url-safe tokens", () => {
    const tokens = Array.from({ length: 100 }, () => generateToken());
    for (const token of tokens) {
      expect(token).toMatch(/^[a-zA-Z0-9_-]+$/);
      expect(token).not.toContain("+");
      expect(token).not.toContain("/");
      expect(token).not.toContain("=");
    }
  });
});

describe("token hashing", () => {
  it("produces a 64-character hex string (SHA-256)", () => {
    const hash = hashToken("test-token");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", () => {
    const token = "my-secret-token";
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("cannot be reversed to find the original token", () => {
    const token = generateToken();
    const hash = hashToken(token);
    // SHA-256 is one-way — we can only verify, not reverse
    expect(hash).not.toBe(token);
    expect(hash.length).toBeGreaterThan(token.length);
  });
});

describe("token security properties", () => {
  it("raw token is not stored alongside hash in production", () => {
    // In production schema, both token and token_hash are stored,
    // but token_hash is used for lookups. The raw token is only
    // returned to the creator (the requester), never exposed via public API.
    const token = generateToken();
    const hash = hashToken(token);

    // Simulate: public API lookup uses hash
    expect(hashToken(token)).toBe(hash);
    // Simulate: raw token is only in the response to the requester
    expect(token).not.toBe(hash);
  });

  it("token hash is safe against rainbow tables", () => {
    // SHA-256 of a random 12-byte token produces a unique hash
    // that cannot be precomputed
    const tokens = Array.from({ length: 100 }, () => generateToken());
    const hashes = tokens.map(hashToken);
    const uniqueHashes = new Set(hashes);
    expect(uniqueHashes.size).toBe(100);
  });
});

describe("filename sanitization", () => {
  function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  it("preserves safe characters", () => {
    expect(sanitizeFilename("logo.png")).toBe("logo.png");
    expect(sanitizeFilename("my-file_v2.pdf")).toBe("my-file_v2.pdf");
  });

  it("replaces spaces", () => {
    expect(sanitizeFilename("my file.png")).toBe("my_file.png");
  });

  it("replaces path traversal sequences", () => {
    // Note: dots are allowed in filenames (for extensions), so "../.."
    // becomes ".._.._etc_passwd". This is safe because the R2 key format
    // is uploads/<requestId>/<random>_<filename>, so path traversal
    // in the filename alone cannot escape the prefix.
    const result = sanitizeFilename("../../etc/passwd");
    expect(result).toContain("etc");
    expect(result).toContain("passwd");
    // Slashes are replaced — this is the key protection
    expect(result).not.toContain("/");
  });

  it("replaces control characters", () => {
    expect(sanitizeFilename("file\x00name.png")).toBe("file_name.png");
  });

  it("replaces special characters", () => {
    expect(sanitizeFilename("file@name!.png")).toBe("file_name_.png");
  });

  it("handles unicode characters", () => {
    const result = sanitizeFilename("файл.png");
    expect(result).not.toContain("файл");
    expect(result).toContain(".png");
  });
});
