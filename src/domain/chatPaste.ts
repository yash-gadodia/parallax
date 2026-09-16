// Parse a pasted chat excerpt (WhatsApp multi-copy / export, or plain
// "Name: message" lines) into who-said-what. Returns null when the text does
// not look like a chat, so the caller treats it as ordinary prose.
//
// Formats tolerated:
//   [21:43, 16/09/2026] Dani: message        (WhatsApp iOS copy)
//   16/09/2026, 21:43 - Dani: message        (WhatsApp Android export)
//   Dani: message                            (plain)
// A line with no sender prefix continues the previous message.

export interface ChatLine {
  who: string;
  text: string;
}

const IOS_PREFIX = /^\[\d{1,2}:\d{2}(?::\d{2})?,\s*[^\]]+\]\s*/;
const ANDROID_PREFIX = /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*-\s*/;
// Sender names are short and human: letters, spaces, a few symbols. A colon
// deep into a long clause ("the thing is: he left") must not read as a sender.
const SENDER = /^([^:\n]{1,24}?):\s+(.*)$/;

function parseLine(line: string): ChatLine | null {
  const stripped = line.replace(IOS_PREFIX, '').replace(ANDROID_PREFIX, '');
  const m = stripped.match(SENDER);
  if (!m) return null;
  const who = m[1].trim();
  // Reject "senders" that are clearly clause fragments, not names.
  if (!who || /\d{2}[/.]\d{2}/.test(who) || who.split(/\s+/).length > 4) {
    return null;
  }
  return { who, text: m[2].trim() };
}

export function parseChatPaste(raw: string): ChatLine[] | null {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const out: ChatLine[] = [];
  let matched = 0;
  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) {
      matched++;
      out.push(parsed);
    } else if (out.length) {
      out[out.length - 1].text = `${out[out.length - 1].text}\n${line}`.trim();
    } else {
      return null; // leading free text means this is prose, not a chat
    }
  }
  // A real chat excerpt has at least two sender-prefixed lines.
  return matched >= 2 ? out : null;
}

/** Render parsed chat back into the plain block the edge fn receives. */
export function chatToText(lines: ChatLine[]): string {
  return lines.map((l) => `${l.who}: ${l.text}`).join('\n');
}
