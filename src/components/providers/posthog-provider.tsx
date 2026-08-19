"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

// NEXT_PUBLIC_* vars are inlined into the client bundle by Next.js.
// Read them directly here — do NOT import the strict server `env` object,
// which eagerly requires server-only vars unavailable in the browser.
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthogKey) return;
    if (pathname) {
      const url = pathname + searchParams.toString();
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!posthogKey) return;
    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: false,
    });
  }, []);

  return (
    <>
      <Suspense>
        <PageViewTracker />
      </Suspense>
      {children}
    </>
  );
}