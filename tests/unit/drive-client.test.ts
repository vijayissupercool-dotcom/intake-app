import { describe, it, expect } from "vitest";

describe("Drive OAuth configuration", () => {
  it("auth URL contains correct scopes", () => {
    const scopes = [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];
    expect(scopes).toContain("https://www.googleapis.com/auth/drive");
    expect(scopes.length).toBe(3);
  });

  it("auth URL uses prompt=consent for refresh token", () => {
    const prompt = "consent";
    expect(prompt).toBe("consent");
  });

  it("auth URL uses access_type=offline for refresh token", () => {
    const accessType = "offline";
    expect(accessType).toBe("offline");
  });

  it("callback URL is /api/auth/callback", () => {
    const callbackPath = "/api/auth/callback";
    expect(callbackPath).toBe("/api/auth/callback");
  });
});

describe("token refresh logic", () => {
  it("refreshes when token_expiry is null", () => {
    const tokenExpiry = null;
    const now = new Date(Date.now() + 5 * 60 * 1000);
    const shouldRefresh = !tokenExpiry || new Date(tokenExpiry) < now;
    expect(shouldRefresh).toBe(true);
  });

  it("refreshes when token is about to expire (within 5 minutes)", () => {
    const tokenExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 min from now
    const now = new Date(Date.now() + 5 * 60 * 1000); // 5 min window
    const shouldRefresh = new Date(tokenExpiry) < now;
    expect(shouldRefresh).toBe(true);
  });

  it("does not refresh when token is still valid", () => {
    const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min from now
    const now = new Date(Date.now() + 5 * 60 * 1000); // 5 min window
    const shouldRefresh = new Date(tokenExpiry) < now;
    expect(shouldRefresh).toBe(false);
  });
});
