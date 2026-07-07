// Refocus AI — two modes, one safety stack.
//
// SOLO (back-compat, body: { userText, partnerName?, youName? }):
//   one partner privately shares only THEIR side; Claude reflects it back
//   (what happened, other angles as possibilities, the need underneath, a kind
//   way to raise it, a draft message). Nothing persists; the AI never invents
//   the partner's side.
//
// TWO-SIDED (body: { sessionId }): a refocus_sessions row (0020) holds BOTH
//   partners' real sides. When state='ready', this function mediates from the
//   two real inputs (shared ground, each side's underneath, one kind bridge
//   each), writes ai_result with the service role, and flips the session to
//   'revealed'. It NEVER runs on one side and NEVER invents a side.
//
// SAFETY STACK (both modes, non-negotiable — STRATEGY.md §4.4):
//   before any mediation/reflection, a cheap forced-tool-use screening pass
//   flags crisis (self-harm/suicide) and violence/abuse (physical danger,
//   coercive control).
//   - crisis → NO mediation; a warm, direct safety response with SG helplines
//     (SOS 1767, IMH 6389 2222, AWARE 1800 777 5555) + findahelpline.com.
//   - abuse-signal → mediation declines gently; a couples app is not a safety
//     tool; same resources.
//   - screening API failure (unavailable):
//     * TWO-SIDED → FAIL-CLOSED: return retryable 503 (screening_unavailable).
//       Mediation requires both inputs; screening both is non-negotiable.
//     * SOLO → FAIL-OPEN: reflection proceeds + screening_unavailable flag so
//       client appends resources note. Rationale: blocking someone in crisis
//       from ANY reflection is worse than a reflection unscreened once.
//   Every AI result is rendered client-side with the persistent therapy
//   disclaimer + explicit "written by AI" disclosure (src/content/refocus.ts).
//
// The ANTHROPIC_API_KEY and the service-role key live only here (server-side);
// the Expo client calls this via supabase.functions.invoke('refocus').

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-haiku-4-5-20251001";
// Screening uses the same cheap model family (haiku) — a separate env override
// keeps it swappable without touching the mediation model.
const SCREEN_MODEL = Deno.env.get("ANTHROPIC_SCREEN_MODEL") ?? "claude-haiku-4-5-20251001";
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

// ── Service-role REST helpers (session mode only) ─────────────────────────

async function dbGet(path: string): Promise<Record<string, unknown>[]> {
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

async function dbPatch(
  path: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`db patch failed: ${resp.status}`);
  return resp.json();
}

// Extract the authenticated user id from the caller's JWT. verify_jwt = true
// means the gateway already validated signature + expiry; we only decode the
// payload. Same pattern as notify-partner.
function jwtSub(req: Request): string | null {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof payload.sub === "string" && payload.sub.length > 0
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}

// Per-user rate limit (both modes spend Anthropic tokens). claim_refocus_slot()
// runs as the caller (forwarded JWT); a null uid / over-limit returns false.
// Fail open: a rate-CHECK failure must not block legit use.
async function overRateLimit(req: Request): Promise<boolean> {
  try {
    const rl = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_refocus_slot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        "Authorization": req.headers.get("Authorization") ?? "",
      },
      body: "{}",
    });
    return rl.ok && (await rl.json()) === false;
  } catch {
    return false;
  }
}

// ── Anthropic helper ───────────────────────────────────────────────────────

interface ToolCallArgs {
  model: string;
  system: string;
  tool: Record<string, unknown>;
  toolName: string;
  userMsg: string;
  maxTokens: number;
}

// One forced-tool-use Messages call; returns the tool input or null.
async function anthropicToolCall(
  args: ToolCallArgs
): Promise<Record<string, unknown> | null> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: args.maxTokens,
      system: args.system,
      tools: [args.tool],
      tool_choice: { type: "tool", name: args.toolName },
      messages: [{ role: "user", content: args.userMsg }],
    }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new AnthropicError(resp.status, detail);
  }
  const data = await resp.json();
  const toolUse = Array.isArray(data?.content)
    ? data.content.find((c: { type?: string }) => c?.type === "tool_use")
    : null;
  return toolUse?.input ?? null;
}

class AnthropicError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(`anthropic_error ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

// ── Safety screening ───────────────────────────────────────────────────────

type SafetyVerdict = "ok" | "crisis" | "abuse" | "unavailable";

const SCREENING_TOOL = {
  name: "report_safety_verdict",
  description: "Report the safety screening verdict for the provided text.",
  input_schema: {
    type: "object",
    properties: {
      crisis: {
        type: "boolean",
        description:
          "true if the text contains any signal of self-harm, suicidal thoughts or intent, or wanting to disappear / not be here anymore — from either person.",
      },
      abuse: {
        type: "boolean",
        description:
          "true if the text contains any signal of physical violence or threats, fear for one's safety, intimidation, or coercive control (isolation, monitoring, financial control, threats about leaving) — in either direction.",
      },
    },
    required: ["crisis", "abuse"],
  },
};

const SCREENING_SYSTEM = `You are a safety screener for a couples app. You will be shown text one or both partners wrote about a conflict. Your ONLY job is to flag safety signals; you do not give advice and you do not judge the relationship.

Flag crisis for any signal of self-harm or suicide, even oblique ("what's the point of me", "they'd be better off without me").
Flag abuse for any signal of physical danger, threats, fear of a partner, or coercive control. Coercive control includes ultimatums that isolate ("it's them or me" about friends or family), demands to stop seeing people, monitoring or controlling the partner's money, movement, or communication, and threats (including threats of self-harm) used to control the partner's behaviour. Ordinary anger, sarcasm, or a heated argument alone is NOT abuse.

When a signal is genuinely present, err on the side of flagging. Always answer by calling report_safety_verdict.`;

async function screenForSafety(texts: string[], mode: 'solo' | 'mediation' = 'solo'): Promise<SafetyVerdict> {
  try {
    const userMsg = `Screen the following text from a couples conflict:\n"""\n${texts.join('\n"""\n\n"""\n')}\n"""`;
    const input = await anthropicToolCall({
      model: SCREEN_MODEL,
      system: SCREENING_SYSTEM,
      tool: SCREENING_TOOL,
      toolName: "report_safety_verdict",
      userMsg,
      maxTokens: 256,
    });
    if (!input || typeof input.crisis !== "boolean" || typeof input.abuse !== "boolean") {
      console.log(JSON.stringify({
        event: "refocus_screen",
        mode,
        verdict: "unavailable",
        reason: "invalid_response",
      }));
      return "unavailable";
    }
    if (input.crisis) {
      console.log(JSON.stringify({ event: "refocus_screen", mode, verdict: "crisis" }));
      return "crisis";
    }
    if (input.abuse) {
      console.log(JSON.stringify({ event: "refocus_screen", mode, verdict: "abuse" }));
      return "abuse";
    }
    console.log(JSON.stringify({ event: "refocus_screen", mode, verdict: "ok" }));
    return "ok";
  } catch (e) {
    console.log(JSON.stringify({
      event: "refocus_screen",
      mode,
      verdict: "unavailable",
      reason: "api_error",
      error: String(e),
    }));
    return "unavailable";
  }
}

// Static safety responses — deliberately NOT generated by the model (crisis
// routing must bypass the LLM, STRATEGY.md §4.4 #2).
const HELPLINES = [
  { name: "SOS (Samaritans of Singapore), 24h", contact: "1767" },
  { name: "IMH Mental Health Helpline, 24h", contact: "6389 2222" },
  { name: "AWARE Women's Helpline (Mon-Fri)", contact: "1800 777 5555" },
  { name: "Anywhere else in the world", contact: "findahelpline.com" },
];

function crisisResult() {
  return {
    type: "crisis" as const,
    title: "Before anything else, you matter.",
    message:
      "Some of what was shared here sounds heavier than a rough moment between you two. An app is not the right companion for that, but a real human is, and they want to hear from you. Please reach out now, you don't have to have it figured out first.",
    helplines: HELPLINES,
  };
}

function abuseResult() {
  return {
    type: "abuse" as const,
    title: "This sounds bigger than a misunderstanding.",
    message:
      "Some of what was shared here sounds like it could be about safety, feeling afraid, controlled, or hurt. That is not a communication problem to mediate, and a couples app isn't the right tool for safety. Please talk to someone whose whole job is exactly this. You deserve to feel safe.",
    helplines: HELPLINES,
  };
}

// ── SOLO reflection (unchanged behavior + screening) ───────────────────────

const REFLECTION_TOOL = {
  name: "provide_reflection",
  description: "Return the structured solo reflection for the user.",
  input_schema: {
    type: "object",
    properties: {
      happened: {
        type: "array",
        items: { type: "string" },
        description:
          "2-3 short, plain facts pulled from the user's OWN account of what happened. Specific to their story. No interpretations, no blame, no em dashes.",
      },
      angles: {
        type: "array",
        items: { type: "string" },
        description:
          "2-3 other directions this moment could be seen from. Each one is clearly a possibility ('it could be that...', 'maybe...'), NEVER stated as the partner's actual feelings, thoughts, or words. You only know one side.",
      },
      underneath: {
        type: "string",
        description:
          "The deeper emotional need underneath the user's reaction (a need, not a complaint).",
      },
      wayback: {
        type: "string",
        description:
          "A short, warm suggestion for how the user could raise this kindly, specific to what happened. 1-2 plain sentences, no platitudes, no em dashes. Do not promise how the partner will respond.",
      },
      bridge: {
        type: "string",
        description:
          "A warm first-person message the user could choose to send to open the conversation, specific to their situation and only about their own side. Lowercase, casual, 1-2 sentences, may end with a soft emoji like 🤍. No quotes around it, no em dashes.",
      },
    },
    required: ["happened", "angles", "underneath", "wayback", "bridge"],
  },
};

const SOLO_SYSTEM = `You are the quiet third person inside Parallax, a couples app. One partner just had a rough moment and privately told you their side. Only their side. Help them untangle it for themselves.

Do:
- Pull out the few plain facts from what they actually said.
- Offer a couple of other directions the moment could be seen from, always framed as possibilities. You have NOT heard the partner's side, so never invent it, never attribute feelings or words to the partner, and never speak for them.
- Name the real need under the user's reaction (a need, not a jab).
- Suggest one kind, low-pressure way they could raise it.
- Write one warm message they could choose to send, about their own side only.

Voice (this matters most):
- Sound like a perceptive friend who knows them, not a therapist, a coach, or an AI.
- Be specific to what they ACTUALLY said. Use their real details. Nothing generic that would fit anyone.
- Short, plain sentences. Warm, not mushy. Direct, not preachy.
- NEVER use an em dash. Use a comma, a period, "and", or "but".
- Do not use these tells: "it makes sense", "it stings", "pulls away", "can feel like", "a signal that", "at the end of the day", "hold space", "showing up".

Keep every field tight. Always answer by calling the provide_reflection tool.`;

async function handleSolo(
  req: Request,
  body: { userText?: string; youName?: string; partnerName?: string }
): Promise<Response> {
  const userText = (body.userText ?? "").trim();
  const youName = (body.youName ?? "you").trim() || "you";
  const partnerName = (body.partnerName ?? "your partner").trim() || "your partner";

  if (!userText) return json({ error: "missing_userText" }, 400);

  if (await overRateLimit(req)) return json({ error: "rate_limited" }, 429);

  // Safety screening before any reflection (see the safety-stack note above).
  const verdict = await screenForSafety([userText], 'solo');
  if (verdict === "crisis") {
    console.log(JSON.stringify({ event: "refocus_escalation", mode: "solo", type: "crisis" }));
    return json({ safety: crisisResult() });
  }
  if (verdict === "abuse") {
    console.log(JSON.stringify({ event: "refocus_escalation", mode: "solo", type: "abuse" }));
    return json({ safety: abuseResult() });
  }

  const userMsg = `${youName} shared their side of a rough moment with their partner ${partnerName}:
"""
${userText}
"""

This is the ONLY side you have. Reflect it back for them. Refer to their partner as "${partnerName}" but never invent ${partnerName}'s perspective. Call provide_reflection.`;

  let input: Record<string, unknown> | null;
  try {
    input = await anthropicToolCall({
      model: MODEL,
      system: SOLO_SYSTEM,
      tool: REFLECTION_TOOL,
      toolName: "provide_reflection",
      userMsg,
      maxTokens: 1024,
    });
  } catch (e) {
    if (e instanceof AnthropicError) {
      return json({ error: "anthropic_error", status: e.status, detail: e.detail }, 502);
    }
    return json({ error: "fetch_failed", detail: String(e) }, 502);
  }

  if (!input?.happened || !input?.angles || !input?.bridge) {
    return json({ error: "no_reflection" }, 502);
  }

  if (verdict === "unavailable") {
    // Fail-open path: reflection proceeds, the client appends the resources note.
    return json({ ...input, screening_unavailable: true });
  }
  return json(input);
}

// ── TWO-SIDED mediation ────────────────────────────────────────────────────

const MEDIATION_TOOL = {
  name: "provide_mediation",
  description: "Return the structured two-sided mediation for the couple.",
  input_schema: {
    type: "object",
    properties: {
      shared_ground: {
        type: "string",
        description:
          "2-3 plain sentences naming what BOTH sides show they actually care about, the thing they share underneath the clash. It must be earned from their real words on both sides, never generic, never invented. No em dashes.",
      },
      initiator_underneath: {
        type: "string",
        description:
          "The deeper emotional need underneath the initiator's side (a need, not a complaint), drawn only from the initiator's own words.",
      },
      partner_underneath: {
        type: "string",
        description:
          "The deeper emotional need underneath the partner's side (a need, not a complaint), drawn only from the partner's own words.",
      },
      initiator_bridge: {
        type: "string",
        description:
          "A warm first-person message the INITIATOR could choose to send: their own side plus one small step toward the shared ground. Lowercase, casual, 1-2 sentences, may end with a soft emoji like 🤍. No em dashes, no ghost-written apology they didn't imply.",
      },
      partner_bridge: {
        type: "string",
        description:
          "A warm first-person message the PARTNER could choose to send: their own side plus one small step toward the shared ground. Lowercase, casual, 1-2 sentences, may end with a soft emoji like 🤍. No em dashes, no ghost-written apology they didn't imply.",
      },
    },
    required: [
      "shared_ground",
      "initiator_underneath",
      "partner_underneath",
      "initiator_bridge",
      "partner_bridge",
    ],
  },
};

const MEDIATION_SYSTEM = `You are the quiet third person inside Parallax, a couples app. Both partners privately shared their real side of the same rough moment, and you are the first to see both. Help them find the middle ground.

Do:
- Find the genuinely shared ground: what both sides show they each care about. It must be earned from their actual words on BOTH sides, never invented.
- Name the real need underneath EACH side (a need, not a jab), using only that person's own words as evidence.
- Write one kind bridge for each of them: a first-person message that person could choose to send, about their own side, taking one small step toward the other. Coach the writer, never ghost-write an apology or a feeling they didn't imply.

Never:
- Decide who is right. You are not a judge and you refuse to score the argument.
- Take sides, flatter, or validate one account over the other. If one side is louder, the quieter side gets equal care.
- Attribute feelings or words that are not in what they wrote.
- Use an em dash. Use a comma, a period, "and", or "but".

Voice (this matters most):
- Sound like a perceptive friend who knows them both, not a therapist, a coach, or an AI.
- Be specific to what they ACTUALLY said. Use their real details. Nothing generic that would fit anyone.
- Short, plain sentences. Warm, not mushy. Direct, not preachy.
- Do not use these tells: "it makes sense", "it stings", "pulls away", "can feel like", "a signal that", "at the end of the day", "hold space", "showing up".

Keep every field tight. Always answer by calling the provide_mediation tool.`;

async function handleSession(req: Request, sessionId: string): Promise<Response> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "not_configured" }, 503);

  const caller = jwtSub(req);
  if (!caller) return json({ error: "unauthenticated" }, 401);

  const sessions = await dbGet(
    `refocus_sessions?id=eq.${sessionId}&select=id,couple_id,initiator,topic,initiator_side,partner_side,state,ai_result`
  );
  if (!sessions.length) return json({ error: "session_not_found" }, 404);
  const session = sessions[0] as {
    id: string;
    couple_id: string;
    initiator: string;
    topic: string;
    initiator_side: string;
    partner_side: string | null;
    state: string;
    ai_result: unknown;
  };

  const couples = await dbGet(
    `couples?id=eq.${session.couple_id}&select=member_a,member_b`
  );
  if (!couples.length) return json({ error: "couple_not_found" }, 404);
  const { member_a, member_b } = couples[0] as {
    member_a: string | null;
    member_b: string | null;
  };
  const memberIds = [member_a, member_b].filter(Boolean) as string[];
  if (!memberIds.includes(caller)) return json({ error: "not_a_member" }, 403);

  // Idempotent: a revealed session just returns its stored result (both
  // clients call this; only the first pays for mediation).
  if (session.state === "revealed" && session.ai_result) {
    return json(session.ai_result);
  }
  if (session.state !== "ready" || !session.partner_side) {
    return json({ error: "session_not_ready", state: session.state }, 409);
  }

  if (await overRateLimit(req)) return json({ error: "rate_limited" }, 429);

  const partnerId = memberIds.find((id) => id !== session.initiator);
  const idList = memberIds.map((id) => `"${id}"`).join(",");
  const profiles = (await dbGet(
    `profiles?id=in.(${idList})&select=id,display_name`
  )) as Array<{ id: string; display_name: string | null }>;
  const nameOf = (id: string | null | undefined, fallback: string): string =>
    (id && profiles.find((p) => p.id === id)?.display_name) || fallback;
  const initiatorName = nameOf(session.initiator, "one partner");
  const partnerName = nameOf(partnerId, "the other partner");

  // Safety screening over the topic + BOTH real sides.
  const verdict = await screenForSafety([
    session.topic,
    session.initiator_side,
    session.partner_side,
  ], 'mediation');

  let result: Record<string, unknown>;
  if (verdict === "crisis") {
    console.log(JSON.stringify({ event: "refocus_escalation", mode: "mediation", type: "crisis" }));
    result = crisisResult();
  } else if (verdict === "abuse") {
    console.log(JSON.stringify({ event: "refocus_escalation", mode: "mediation", type: "abuse" }));
    result = abuseResult();
  } else if (verdict === "unavailable") {
    // FAIL-CLOSED for two-sided: return retryable 503. Both inputs are
    // required for safe mediation; we cannot proceed without screening both.
    console.log(JSON.stringify({
      event: "refocus_unavailable",
      mode: "mediation",
      session_id: sessionId,
    }));
    return json({ error: "screening_unavailable", retry: true }, 503);
  } else {
    const userMsg = `The topic, as ${initiatorName} labelled it: "${session.topic}"

${initiatorName}'s side (the initiator):
"""
${session.initiator_side}
"""

${partnerName}'s side (the partner):
"""
${session.partner_side}
"""

These are the only two accounts you have. In the tool fields, "initiator" means ${initiatorName} and "partner" means ${partnerName}. Call provide_mediation.`;

    let input: Record<string, unknown> | null;
    try {
      input = await anthropicToolCall({
        model: MODEL,
        system: MEDIATION_SYSTEM,
        tool: MEDIATION_TOOL,
        toolName: "provide_mediation",
        userMsg,
        maxTokens: 1024,
      });
    } catch (e) {
      if (e instanceof AnthropicError) {
        return json({ error: "anthropic_error", status: e.status, detail: e.detail }, 502);
      }
      return json({ error: "fetch_failed", detail: String(e) }, 502);
    }
    if (
      !input?.shared_ground ||
      !input?.initiator_underneath ||
      !input?.partner_underneath ||
      !input?.initiator_bridge ||
      !input?.partner_bridge
    ) {
      return json({ error: "no_mediation" }, 502);
    }
    result = { type: "mediation", ...input };
  }

  // Guarded write: only flips ready -> revealed. If a concurrent call already
  // revealed it, return the stored result so both callers see the SAME output.
  try {
    const patched = await dbPatch(
      `refocus_sessions?id=eq.${session.id}&state=eq.ready`,
      {
        ai_result: result,
        state: "revealed",
        revealed_at: new Date().toISOString(),
      }
    );
    if (!patched.length) {
      const again = await dbGet(
        `refocus_sessions?id=eq.${session.id}&select=ai_result`
      );
      const stored = again[0]?.ai_result;
      if (stored) return json(stored);
    }
  } catch (e) {
    return json({ error: "session_write_failed", detail: String(e) }, 500);
  }

  return json(result);
}

// ── Entry ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!ANTHROPIC_API_KEY) {
    // Not configured - the client shows its honest error state.
    return json({ error: "not_configured" }, 503);
  }

  let body: {
    userText?: string;
    youName?: string;
    partnerName?: string;
    sessionId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  try {
    if (typeof body.sessionId === "string" && body.sessionId.length > 0) {
      return await handleSession(req, body.sessionId);
    }
    return await handleSolo(req, body);
  } catch (e) {
    return json({ error: "internal_error", detail: String(e) }, 500);
  }
});
