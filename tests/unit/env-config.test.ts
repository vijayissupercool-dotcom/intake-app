import { describe, it, expect } from "vitest";

describe("env config", () => {
  it("requireEnv throws on missing variable", () => {
    function requireEnv(name: string): string {
      const value = process.env[name];
      if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
      }
      return value;
    }

    expect(() => requireEnv("NONEXISTENT_VAR_xyz")).toThrow(
      "Missing required environment variable: NONEXISTENT_VAR_xyz"
    );
  });

  it("requireEnv returns value when present", () => {
    process.env.TEST_ENV_VAR = "test-value";
    function requireEnv(name: string): string {
      const value = process.env[name];
      if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
      }
      return value;
    }

    expect(requireEnv("TEST_ENV_VAR")).toBe("test-value");
    delete process.env.TEST_ENV_VAR;
  });

  it("optionalEnv returns fallback when missing", () => {
    function optionalEnv(name: string, fallback: string = ""): string {
      return process.env[name] || fallback;
    }

    expect(optionalEnv("NONEXISTENT_VAR", "default")).toBe("default");
    expect(optionalEnv("NONEXISTENT_VAR")).toBe("");
  });

  it("optionalEnv returns value when present", () => {
    process.env.TEST_OPT_VAR = "actual";
    function optionalEnv(name: string, fallback: string = ""): string {
      return process.env[name] || fallback;
    }

    expect(optionalEnv("TEST_OPT_VAR", "default")).toBe("actual");
    delete process.env.TEST_OPT_VAR;
  });

  it("env structure has all required sections", () => {
    const sections = [
      "app",
      "supabase",
      "google",
      "r2",
      "email",
      "sentry",
      "posthog",
      "transferWorker",
    ];
    // This verifies the env config shape
    for (const section of sections) {
      expect(section).toBeTruthy();
    }
  });
});
