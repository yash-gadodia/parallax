# Working with Claude on Parallax (for Dani)

You don't need to be technical to build here. Claude Code does the engineering — you describe what you want in plain English, and it plans, writes the code, tests it, and shows you the result. This guide is everything you need.

## The one thing to know

**Describe the outcome you want, like you'd tell a designer or a friend. Claude figures out the how.** You don't need the right words, file names, or code terms. If Claude needs to know something, it will ask you 2–3 short questions first.

## How to ask for things (real examples)

Good prompts are specific about the *what*, not the *how*:

- "On the Today screen, make the 'Get started' button a bit bigger and add more space above it."
- "The reveal screen feels cramped. Here's a screenshot — make it match the design." *(drag in a screenshot)*
- "Add a setting to turn off daily notifications."
- "Something's broken when I tap a prompt — here's what I see." *(screenshot)*
- "Change the welcome tagline to 'see each other clearly'."
- "Write a new daily prompt pack about travel."

**Screenshots are gold.** When something looks wrong, paste a picture. Claude can see it and match the design.

## What Claude does automatically (you don't have to ask)

- **Plans** bigger changes and asks you to confirm before doing a lot of work.
- **Writes tests** and **runs them** so changes don't break other things.
- **Checks the app still builds** and often **opens it on the phone simulator and screenshots it** to confirm it looks right.
- **Won't claim "done" without proof** — it shows you the result.
- **Records what it learns** so it gets smarter over time.

So you can just say "make this change" and trust it'll verify its own work.

## When something's not right

- "That didn't work — the button is still small." (It'll re-check and try again.)
- "Hmm, that's not what I meant. I wanted ___." (Re-describe; no need to apologize or be precise.)
- "Show me what it looks like now." (It'll screenshot the running app.)
- If it goes in circles, say: **"Stop and rethink this from scratch."** (There's a built-in rule to do exactly that after 2 failed tries.)

## Seeing your changes on the phone

- Ask: **"Open the app"** — Claude launches it on the iPhone simulator and shows you.
- To log in for testing without the email step: on the welcome screen tap **"I already have an account"** → email `test@parallax.app`, password `parallax123`.

## Things you do NOT need to worry about

- Git, branches, commits — Claude handles version history. (Just say "save this" / "ship it" if you want it committed.)
- Tests passing, builds, types — Claude keeps these green; it'll tell you if something's genuinely blocked.
- Breaking the app — changes are tested before they're called done, and everything is recoverable.

## A few useful shortcuts (type them in the prompt)

- **`/preview`** — opens the app on the phone simulator and shows you how it looks right now.
- **`/fix <describe it>`** — Claude finds and fixes a bug or something that looks wrong, then proves it's fixed. (A screenshot helps a lot.)
- **`/ship`** — saves your changes to GitHub (after checking everything still works). Say this when you're happy with a change.
- **`/goal <what you want>`** — sets a target Claude must fully finish before it stops (e.g. `/goal make the Us screen match the design`). Great for "don't stop until it's actually done."
- **`! <command>`** — runs a terminal command for you if Claude ever asks you to (rare).
- Just talking normally works for everything else.

## Your to-do list

`docs/BACKLOG.md` is the shared task list. Each item is tagged with who owns it — **(Dani)** for product/design calls (that's you), **(Yash)** for accounts/credentials, **(Claude)** for things the agent builds.

- Add anything you want in plain words — Claude files it under the right person.
- Say **"work on the backlog"** and Claude builds the next **(Claude)** task and ticks it off.
- Your **(Dani)** items are decisions only you can make (e.g. "ship the Wrapped feature?") — answer them in chat and Claude takes it from there.

## Where the deeper docs live (for Claude, or a technical helper)

- `README.md` — setup + commands · `docs/DEV_SETUP.md` — run it locally
- `docs/FLOWS.md` — how every feature works · `docs/HANDOFF.md` — extending it + go-live
- `docs/DECISIONS.md` — why things are built the way they are
- `CLAUDE.md` + `.claude/rules/` — the rules Claude follows automatically

If you ever get stuck, paste the error or a screenshot and say "help me fix this." That's enough.
