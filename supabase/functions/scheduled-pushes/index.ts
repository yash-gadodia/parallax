// scheduled-pushes: the sanctioned scheduled push set (IMPROVEMENT_PLAN.md 3.2,
// law #9 — partner-triggered plus exactly these two, warm and guilt-free):
//   * streak-saver (~10pm couple-local): streak > 0 and exactly one member
//     played today — the other gets one honest heads-up.
//   * drift reminder: neither member played and the couple-local time is past
//     their ritual hour (profiles.notify_time) — 3 warm variants rotated
//     deterministically by date.
// Invoked HOURLY with the service-role bearer (see migrations/0022 header for
// the cron contract — no pg_net wiring is committed because the service key
// can't live in this public repo). The SQL candidate functions claim a
// per-day push_ledger row as they select, so reruns and overlapping
// invocations never double-send.
// Ops gate: the bearer must BE the service-role key (generate-drops pattern);
// verify_jwt is off in config.toml because this gate is stricter.

import {
  driftReminderBody,
  driftTitle,
  streakSaverBody,
  streakSaverTitle,
} from "./copy.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function rpc<T>(fn: string): Promise<T> {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!resp.ok) throw new Error(`rpc ${fn} failed: ${resp.status}`);
  return resp.json();
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
}

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(messages),
  });
}

interface StreakSaverRow {
  couple_id: string;
  target_member: string;
  push_token: string;
  partner_name: string;
  streak: number;
}

interface DriftRow {
  couple_id: string;
  target_member: string;
  push_token: string;
  partner_name: string;
  local_day: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return json({ error: "not_configured" }, 503);
  }

  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (bearer !== SERVICE_ROLE_KEY) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const streak = await rpc<StreakSaverRow[]>("_streak_saver_candidates");
    const drift = await rpc<DriftRow[]>("_drift_reminder_candidates");

    const messages: ExpoPushMessage[] = [
      ...streak.map((r) => ({
        to: r.push_token,
        title: streakSaverTitle(r.partner_name),
        body: streakSaverBody(r.partner_name),
        sound: "default" as const,
      })),
      ...drift.map((r) => ({
        to: r.push_token,
        title: driftTitle(),
        body: driftReminderBody(r.partner_name, r.local_day),
        sound: "default" as const,
      })),
    ];

    await sendExpoPush(messages);
    return json({
      streak_saver: streak.length,
      drift: drift.length,
      sent: messages.length,
    });
  } catch (e) {
    return json({ error: "internal_error", detail: String(e) }, 500);
  }
});
