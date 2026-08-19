"use client";

import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

export function initPostHog() {
  if (!posthogKey) return;

  if (typeof window !== "undefined") {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: false,
    });
  }
}

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}

export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, properties);
}

export { posthog };