import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows correct content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Intake");
    await expect(page.getByText("Collect files from anyone")).toBeVisible();
    await expect(page.getByText("Intake").first()).toBeVisible();
  });

  test("has working navigation to login and signup", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
  });

  test("shows how it works section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("How it works")).toBeVisible();
    await expect(page.getByText("Connect Google Drive")).toBeVisible();
    await expect(page.getByText("Create a file request")).toBeVisible();
    await expect(page.getByText("Files land in Drive")).toBeVisible();
  });
});

test.describe("Health endpoint", () => {
  test("returns ok status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeTruthy();
  });

  test("does not expose secrets", async ({ request }) => {
    const response = await request.get("/api/health");
    const body = await response.json();
    const responseStr = JSON.stringify(body);
    expect(responseStr).not.toContain("SECRET");
    expect(responseStr).not.toContain("SUPABASE");
    expect(responseStr).not.toContain("GOOGLE");
  });
});

test.describe("Public request page", () => {
  test("shows not found for invalid token", async ({ page }) => {
    await page.goto("/r/invalid-token-12345");
    await expect(page.getByText("Request not found")).toBeVisible();
  });
});

test.describe("Auth pages", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Sign in")).toBeVisible();
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText("Create account")).toBeVisible();
  });
});

test.describe("Security headers", () => {
  test("X-Frame-Options is DENY", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
  });

  test("X-Content-Type-Options is nosniff", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("Strict-Transport-Security is set", async ({ request }) => {
    const response = await request.get("/");
    const hsts = response.headers()["strict-transport-security"];
    expect(hsts).toContain("max-age");
  });
});

test.describe("API security", () => {
  test("requests endpoint requires auth", async ({ request }) => {
    const response = await request.get("/api/requests");
    expect(response.status()).toBe(401);
  });

  test("transfer endpoint rejects unauthorized", async ({ request }) => {
    const response = await request.post("/api/transfer", {
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(401);
  });

  test("transfer endpoint rejects wrong secret", async ({ request }) => {
    const response = await request.post("/api/transfer", {
      headers: {
        Authorization: "Bearer wrong-secret",
        "Content-Type": "application/json",
      },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe("Mobile viewport", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("landing page is usable on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Collect files from anyone")).toBeVisible();
    await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
  });
});
