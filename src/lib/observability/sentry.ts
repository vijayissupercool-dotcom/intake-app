import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/config/env";

export function initSentry() {
  if (!env.sentry.dsn) return;

  Sentry.init({
    dsn: env.sentry.dsn,
    tracesSampleRate: 1.0,
    debug: false,
  });
}

export default Sentry;
