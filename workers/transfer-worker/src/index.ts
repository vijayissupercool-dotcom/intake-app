/**
 * Cloudflare Worker — R2 → Google Drive transfer dispatcher
 *
 * The Next.js `/api/transfer` route is a fallback. In production, this worker
 * runs on a schedule (Cron Trigger) and picks up uploads that are in
 * "uploaded" status but not yet transferred, so transfers survive process
 * restarts and scale independently of the web server.
 */

export interface Env {
  APP_URL: string;
  TRANSFER_WORKER_SECRET: string;
}

interface ScheduledEvent {
  cron: string;
}

const worker = {
  async scheduled(event: ScheduledEvent, env: Env) {
    console.log("Running scheduled transfer check", event.cron);
    await processPendingTransfers(env);
  },

  async fetch(request: Request, env: Env) {
    if (request.method === "POST") {
      const auth = request.headers.get("authorization");
      if (auth !== `Bearer ${env.TRANSFER_WORKER_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
      }
      await processPendingTransfers(env);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("Not found", { status: 404 });
  },
};

export default worker;

async function processPendingTransfers(env: Env) {
  const res = await fetch(`${env.APP_URL}/api/transfer`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.TRANSFER_WORKER_SECRET}`,
    },
  });

  if (!res.ok) {
    console.error("Transfer dispatch failed", res.status, await res.text());
  }
}