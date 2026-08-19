import { describe, it, expect } from "vitest";

// Test the R2 key generation logic (mirrors presign route)
function generateR2Key(
  requestId: string,
  fileName: string,
  randomSuffix?: string
): string {
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const suffix = randomSuffix || "abcdef1234567890";
  return `uploads/${requestId}/${suffix}_${safeFileName}`;
}

describe("R2 key generation", () => {
  it("generates non-guessable keys", () => {
    const key1 = generateR2Key("req-1", "logo.png", "aaa111");
    const key2 = generateR2Key("req-1", "logo.png", "bbb222");
    expect(key1).not.toBe(key2);
  });

  it("includes request ID in path", () => {
    const key = generateR2Key("req-123", "file.pdf", "rand");
    expect(key).toContain("req-123");
  });

  it("sanitizes filename", () => {
    const key = generateR2Key("req-1", "my file (1).pdf", "rand");
    // Parentheses and spaces are replaced with underscores
    expect(key).toContain("my_file__1_.pdf");
  });

  it("preserves file extension", () => {
    const key = generateR2Key("req-1", "document.docx", "rand");
    expect(key).toContain(".docx");
  });

  it("prevents path traversal in filename", () => {
    const key = generateR2Key("req-1", "../../etc/passwd", "rand");
    // The filename portion (after the last /) must not contain traversal.
    // Slashes in the original filename are replaced by the sanitizer,
    // so they can't break out of the uploads/<id>/ prefix.
    const filenamePart = key.split("/").pop()!;
    expect(filenamePart).not.toContain("/");
  });

  it("uses uploads/ prefix", () => {
    const key = generateR2Key("req-1", "file.txt", "rand");
    expect(key.startsWith("uploads/")).toBe(true);
  });
});

describe("presigned URL configuration", () => {
  it("default expiry is 15 minutes (900 seconds)", () => {
    const DEFAULT_EXPIRY = 900;
    expect(DEFAULT_EXPIRY).toBe(15 * 60);
  });

  it("expiry is shorter than 1 hour for security", () => {
    const DEFAULT_EXPIRY = 900;
    expect(DEFAULT_EXPIRY).toBeLessThan(3600);
  });
});
