// Refocus AI - solo reflection on one partner's side of a rough moment.
// The user privately shares only THEIR side; Claude reflects it back: what
// happened, other angles it might look from (possibilities, never the partner's
// actual words), the need underneath, a kind way to raise it, and a draft
// message the user can choose to share. The ANTHROPIC_API_KEY lives only here
// (server-side); the Expo client calls this via supabase.functions.invoke('refocus').

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-haiku-4-5-20251001";

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

// Force a valid RefocusResult via tool use (no brittle JSON parsing).
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

const SYSTEM = `You are the quiet third person inside Parallax, a couples app. One partner just had a rough moment and privately told you their side. Only their side. Help them untangle it for themselves.

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!ANTHROPIC_API_KEY) {
    // Not configured - the client shows its honest error state.
    return json({ error: "not_configured" }, 503);
  }

  let body: { userText?: string; youName?: string; partnerName?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const userText = (body.userText ?? "").trim();
  const youName = (body.youName ?? "you").trim() || "you";
  const partnerName = (body.partnerName ?? "your partner").trim() || "your partner";

  if (!userText) return json({ error: "missing_userText" }, 400);

  // Per-user rate limit (refocus spends Anthropic tokens). claim_refocus_slot()
  // runs as the caller (forwarded JWT); a null uid / over-limit returns false.
  try {
    const rl = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/claim_refocus_slot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        "Authorization": req.headers.get("Authorization") ?? "",
      },
      body: "{}",
    });
    if (rl.ok && (await rl.json()) === false) {
      return json({ error: "rate_limited" }, 429);
    }
  } catch {
    // fail open: a rate-check failure must not block legit reflection
  }

  const userMsg = `${youName} shared their side of a rough moment with their partner ${partnerName}:
"""
${userText}
"""

This is the ONLY side you have. Reflect it back for them. Refer to their partner as "${partnerName}" but never invent ${partnerName}'s perspective. Call provide_reflection.`;

  let resp: Response;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM,
        tools: [REFLECTION_TOOL],
        tool_choice: { type: "tool", name: "provide_reflection" },
        messages: [{ role: "user", content: userMsg }],
      }),
    });
  } catch (e) {
    return json({ error: "fetch_failed", detail: String(e) }, 502);
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    return json({ error: "anthropic_error", status: resp.status, detail }, 502);
  }

  const data = await resp.json();
  const toolUse = Array.isArray(data?.content)
    ? data.content.find((c: { type?: string }) => c?.type === "tool_use")
    : null;

  if (!toolUse?.input?.happened || !toolUse?.input?.angles || !toolUse?.input?.bridge) {
    return json({ error: "no_reflection", raw: data }, 502);
  }

  return json(toolUse.input);
});
