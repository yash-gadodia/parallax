// Refocus AI - couples conflict mediation.
// Each partner privately shares their side; Claude returns a structured resolution:
// where they agree, each person's angle, the need underneath, a way back, and a
// kind bridge message. The ANTHROPIC_API_KEY lives only here (server-side); the
// Expo client calls this via supabase.functions.invoke('refocus').

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
const RESOLUTION_TOOL = {
  name: "provide_resolution",
  description: "Return the structured mediation result for the couple.",
  input_schema: {
    type: "object",
    properties: {
      agree: {
        type: "array",
        items: { type: "string" },
        description:
          "2-3 short, neutral facts BOTH partners would agree actually happened. Specific to their story. No interpretations, no blame, no em dashes.",
      },
      angles: {
        type: "object",
        properties: {
          you: {
            type: "string",
            description:
              "Partner A's perspective, stated with empathy in the second person ('You ...'). Make their reaction make sense.",
          },
          dani: {
            type: "string",
            description:
              "Partner B's perspective, stated with empathy using their name. Make their reaction make sense.",
          },
        },
        required: ["you", "dani"],
      },
      underneath: {
        type: "object",
        properties: {
          you: {
            type: "string",
            description:
              "The deeper emotional need underneath Partner A's reaction (a need, not a complaint).",
          },
          dani: {
            type: "string",
            description:
              "The deeper emotional need underneath Partner B's reaction (a need, not a complaint).",
          },
        },
        required: ["you", "dani"],
      },
      wayback: {
        type: "string",
        description:
          "A short, warm reframe specific to what happened: neither of them stopped caring, what they actually collided on, and the one small thing that prevents a repeat. 1-2 plain sentences, no platitudes, no em dashes.",
      },
      bridge: {
        type: "string",
        description:
          "A warm first-person message Partner A could actually text to repair things, specific to their situation. Lowercase, casual, 1-2 sentences, may end with a soft emoji like 🤍. No quotes around it, no em dashes.",
      },
    },
    required: ["agree", "angles", "underneath", "wayback", "bridge"],
  },
};

const SYSTEM = `You are the quiet third person inside Parallax, a couples app. Two partners just had a rough moment and each privately told their side. Help them find each other again. You are even-handed, never a referee, and nobody is "right".

Do:
- Pull out the few plain facts both would agree happened.
- Put each person's side in words the other could actually nod at.
- Name the real need under each reaction (a need, not a jab).
- Offer a genuine way back that assumes both of them meant well.
- Write one warm message Partner A could actually send.

Voice (this matters most):
- Sound like a perceptive friend who knows them, not a therapist, a coach, or an AI.
- Be specific to what they ACTUALLY said. Use their real details. Nothing generic that would fit any couple.
- Short, plain sentences. Warm, not mushy. Direct, not preachy.
- NEVER use an em dash. Use a comma, a period, "and", or "but".
- Do not use these tells: "it makes sense", "it stings", "pulls away", "can feel like", "a signal that", "at the end of the day", "hold space", "showing up", or hedging like "maybe X, or maybe Y".

Keep every field tight. Always answer by calling the provide_resolution tool.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!ANTHROPIC_API_KEY) {
    // Not configured - the client falls back to its scripted EXEMPLAR.
    return json({ error: "not_configured" }, 503);
  }

  let body: { userText?: string; daniText?: string; youName?: string; partnerName?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const userText = (body.userText ?? "").trim();
  const daniText = (body.daniText ?? "").trim();
  const youName = (body.youName ?? "you").trim() || "you";
  const partnerName = (body.partnerName ?? "Dani").trim() || "Dani";

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
    // fail open: a rate-check failure must not block legit mediation
  }

  const userMsg = `Partner A (${youName}) shared their side:
"""
${userText}
"""

Partner B (${partnerName})'s side:
"""
${daniText || `(${partnerName} hasn't typed a side. Infer it gently and fairly from A's account; do not invent specifics or take A's side.)`}
"""

Mediate this for them. Refer to Partner B as "${partnerName}". Call provide_resolution.`;

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
        tools: [RESOLUTION_TOOL],
        tool_choice: { type: "tool", name: "provide_resolution" },
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

  if (!toolUse?.input?.agree || !toolUse?.input?.angles || !toolUse?.input?.bridge) {
    return json({ error: "no_resolution", raw: data }, 502);
  }

  return json(toolUse.input);
});
