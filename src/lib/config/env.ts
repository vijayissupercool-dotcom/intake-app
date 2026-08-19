function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string = ""): string {
  return process.env[name] || fallback;
}

export const env = {
  app: {
    url: requireEnv("NEXT_PUBLIC_APP_URL"),
  },
  supabase: {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  },
  google: {
    drive: {
      clientId: requireEnv("GOOGLE_DRIVE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_DRIVE_CLIENT_SECRET"),
    },
  },
  r2: {
    accountId: requireEnv("R2_ACCOUNT_ID"),
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucketName: requireEnv("R2_BUCKET_NAME"),
    endpoint: requireEnv("R2_ENDPOINT"),
  },
  email: {
    apiKey: requireEnv("RESEND_API_KEY"),
    from: requireEnv("EMAIL_FROM"),
  },
  sentry: {
    dsn: optionalEnv("SENTRY_DSN"),
    authToken: optionalEnv("SENTRY_AUTH_TOKEN"),
  },
  posthog: {
    key: optionalEnv("NEXT_PUBLIC_POSTHOG_KEY"),
    host: optionalEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://app.posthog.com"),
  },
  transferWorker: {
    secret: optionalEnv("TRANSFER_WORKER_SECRET"),
  },
} as const;
