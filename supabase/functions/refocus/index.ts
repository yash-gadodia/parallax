// Refocus AI — couples conflict mediation.
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
          "2-3 short, neutral facts BOTH partners would agree actually happened — not interpretations or blame.",
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
          "A short, warm reframe: name that neither stopped caring, what they collided on, and the tiny thing that prevents a repeat. 1-2 sentences.",
      },
      bridge: {
        type: "string",
        description:
          "A kind, first-person message Partner A could actually send to repair things. Lowercase, casual, warm, 1-2 sentences; may end with a soft emoji like 🤍. No quotes around it.",
      },
    },
    required: ["agree", "angles", "underneath", "wayback", "bridge"],
  },
};

const SYSTEM = `You are the mediator inside Parallax, a couples app. Two partners have had a rough moment and each privately shares their side. You are a calm, even-handed mediator — never a referee. Nobody is "right". Your job:
- Find the small set of neutral facts both would agree on.
- Steelman EACH person's angle so the other could nod at it.
- Name the real need underneath each reaction (needs, not accusations).
- Offer a genuine way back that assumes good intent on both sides.
- Write one warm, sendable bridge message in Partner A's voice.
Tone: warm, plain, modern, emotionally intelligent, never clinical or preachy. Keep every field tight. Always answer by calling the provide_resolution tool.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!ANTHROPIC_API_KEY) {
    // Not configured — the client falls back to its scripted EXEMPLAR.
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
