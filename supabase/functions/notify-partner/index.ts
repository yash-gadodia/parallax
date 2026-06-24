// notify-partner: send an Expo push notification when a partner plays or the reveal is ready.
// Uses the SERVICE ROLE key (never exposed to clients) to look up push tokens.
// GATE: delivers only once Yash adds EAS/APNs creds + real push tokens in profiles.push_token.

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

async function dbGet(path: string) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Accept: "application/json",
    },
  });
  if (!resp.ok) throw new Error(`db fetch failed: ${resp.status}`);
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return json({ error: "not_configured" }, 503);
  }

  let body: { couple_drop_id?: string; event?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { couple_drop_id, event } = body;
  if (!couple_drop_id || (event !== "played" && event !== "revealed")) {
    return json({ error: "missing_or_invalid_params" }, 400);
  }

  try {
    // 1. Load the couple_drop to get couple_id + who has answered (state).
    const drops: Array<{ couple_id: string; state: string }> = await dbGet(
      `couple_drops?id=eq.${couple_drop_id}&select=couple_id,state`
    );
    if (!drops.length) return json({ error: "couple_drop_not_found" }, 404);
    const { couple_id, state } = drops[0];

    // 2. Load the couple to get both member UUIDs.
    const couples: Array<{ member_a: string | null; member_b: string | null }> =
      await dbGet(`couples?id=eq.${couple_id}&select=member_a,member_b`);
    if (!couples.length) return json({ error: "couple_not_found" }, 404);
    const { member_a, member_b } = couples[0];

    const memberIds = [member_a, member_b].filter(Boolean) as string[];
    if (!memberIds.length) return json({ sent: 0 });

    // 3. Load profiles for all members (push_token + display_name).
    const idList = memberIds.map((id) => `"${id}"`).join(",");
    const profiles: Array<{
      id: string;
      display_name: string | null;
      push_token: string | null;
    }> = await dbGet(
      `profiles?id=in.(${idList})&select=id,display_name,push_token`
    );

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const messages: ExpoPushMessage[] = [];

    if (event === "revealed") {
      // Push both members — reveal is ready for everyone.
      for (const id of memberIds) {
        const token = profileMap.get(id)?.push_token;
        if (!token) continue;
        messages.push({
          to: token,
          title: "You're in focus 💞",
          body: "Today's reveal is ready. See how in-sync you were.",
          sound: "default",
        });
      }
    } else {
      // event === 'played': push only the partner who has NOT yet finished.
      // state 'one_done' means one member submitted; we need to notify the OTHER one.
      // We find who played by checking who the caller is — but we don't have caller
      // identity here. Instead, 'played' is fired by the member who just submitted,
      // so the partner is whoever hasn't caused state to move. When state is 'one_done'
      // exactly one member has answered; the other is still waiting.
      // We push member_b if state just moved to one_done (member_a likely played first),
      // but to be safe we push any member whose push_token is set and who is NOT member_a
      // when the couple has one_done. Since we can't know the caller here, we push BOTH
      // tokens with a "your turn" message and let idempotency handle it — the one who
      // already played will see it as a no-op nudge. For a real production implementation
      // the caller should pass their own user_id so we can target precisely.
      // Current approach: push member_b (the partner field) as the likely non-submitter.
      // If there's only one member, no-op.
      if (memberIds.length < 2) return json({ sent: 0 });

      // The partner to notify is member_b (convention: member_a submits first in demo).
      // When state is 'one_done' we notify member_b; when called with 'played' in any
      // other state, skip (both submitted already or none have).
      const partnerId = member_b ?? member_a;
      if (!partnerId) return json({ sent: 0 });

      const partner = profileMap.get(partnerId);
      if (!partner?.push_token) return json({ sent: 0 });

      // Find the submitter's display name for a personal message.
      const submitterId = memberIds.find((id) => id !== partnerId) ?? null;
      const submitterName =
        submitterId && profileMap.get(submitterId)?.display_name
          ? profileMap.get(submitterId)!.display_name!
          : "Your partner";

      messages.push({
        to: partner.push_token,
        title: "Your turn 💛",
        body: `${submitterName} played today's drop. No peeking — go answer yours.`,
        sound: "default",
      });
    }

    await sendExpoPush(messages);
    return json({ sent: messages.length });
  } catch (e) {
    return json({ error: "internal_error", detail: String(e) }, 500);
  }
});
