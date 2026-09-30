# Reel Eats — Demo Day Runbook

For the IBM Technical Sales live demo, Thursday Oct 1. Read top to bottom the night before;
run the Thursday section cold on the morning.

Fill in the three blanks before Wednesday night ends:

| Blank | Value |
|---|---|
| **Demo reel URL** (fresh — never saved in this account) | `https://www.instagram.com/reel/________/` |
| **Backup reel URL** (tested once, then deleted) | `https://www.instagram.com/reel/________/` |
| **Mood to click** (the one that returns 2–3 good recipes) | ________ |

---

## 1. What you are demoing

**Primary:** the production app at **https://reel-eats-client.vercel.app** — real URL, no terminals,
nothing to boot. Server runs on Railway, database/auth on Supabase.

**Fallback:** the same app on your laptop at `http://localhost:5173` (section 6). Only if
production is down at T-10.

Everything below is verified working as of Wednesday: Google sign-in, the full paste → recipe
pipeline (~30 s), the friendly failure card, mood recommendations, "Good for" tags.

---

## 2. Wednesday night (~30 min)

- [ ] **Cookbook**: 3–4 recipes with real photos. Delete any showing the 🍽️ plate (expired image)
      or the `<UNKNOWN>` leftovers. Open each; make sure no health note is embarrassing
      (e.g. "dairy-free (uses Greek yogurt)").
- [ ] **Demo reel**: pick it (criteria in section 7). Paste it once, check the result looks great,
      note the health notes, then **delete it** so Thursday's paste is fresh.
- [ ] **Backup reel**: same — paste, check, delete.
- [ ] **Mood**: click each pill; write the one that gives 2–3 good cards into the table above.
- [ ] **Notes file** open on a second screen with: both reel URLs (exact `/reel/` form),
      the mood, and the talk track (section 4).
- [ ] **Instagram tab**: open the demo reel on instagram.com, logged in. Leave the tab open.
- [ ] Take a screenshot of one recipe detail page — disaster-only backup, never shown otherwise.

---

## 3. Thursday, T-45 min

1. **Supabase** → dashboard → project shows *Active*, not *Paused*. (Free tier pauses after
   7 idle days; you've been using it all week, so this is a 10-second sanity check.)
2. **Railway** → `reel-eats` service → latest deployment *Active*.
   Open `https://reel-eats-production.up.railway.app/health` → `{"data":{"status":"ok"}}`.
3. **Vercel app** → open https://reel-eats-client.vercel.app in your normal Chrome profile
   (not incognito). You should land on Home, signed in. If you see the sign-in screen →
   **Continue with Google** (30 s).
4. **Warm-up paste**: paste the **backup reel**, wait for "Recipe saved!" (verifies all four API
   keys live and warms the pipeline). Leave it in the cookbook — it's "the one I saved this morning."
5. **Chrome setup**:
   - `Cmd+Opt+I` → DevTools `⋮` → *Dock side* → **Undock into separate window**.
   - `Cmd+Shift+M` → device dropdown → **iPhone 14 Pro** → zoom 100% → device-bar `⋮` →
     **Show device frame**.
   - Drag the DevTools window off-screen. `Cmd+Shift+B` hides bookmarks. `Cmd+R` once.
   - In the video call, **share the Chrome window only** — never the full screen.
6. **Do not** paste anything else before the demo. Rate limit is 10 saves/hour; you've used 1.

---

## 4. The demo (target 12–13 min, then Q&A)

| Min | Beat | Do | Say (paraphrase) |
|---|---|---|---|
| 0–3 | **Open + discovery** | Camera on you, not the app | "Quick question before I show you anything — do you ever cook from Instagram or TikTok? When was the last time you saved a food video and actually made it?" *Listen. Their answer is your hook.* |
| 3–5 | **Problem** | Switch to the **Instagram tab**, play 5 s of the reel | "Looks incredible. Where's the recipe? She says 'a bit of miso' — how much? The steps go by in four seconds. So you screenshot it and it dies in your camera roll with the other 300." |
| 5–6 | **Magic** | On the Instagram tab: reel's **⋯ → Copy link**. Switch to Reel Eats, paste, tap Save. *(If Instagram's copy gives a URL the app rejects, paste the clean `/reel/` URL from your notes instead.)* | "Copy the link, paste it in. That's the whole input." |
| 6–7 | **Wait, gracefully** | Processing card shows. **Stay on Home.** | "While it works — it's listening to what she says, reading her caption, and building the recipe. Usually under a minute." *Fill with the story of why blank quantities are useless.* |
| 7–10 | **Value tour** | "Recipe saved!" → **View →** | Photo · **servings / prep / cook** ("planning a dinner, I know instantly") · **ingredients with amounts** ("she never said '1 tbsp'. The app estimated it, because a blank quantity is useless in a kitchen — that's a deliberate choice") · **numbered steps** ("phone propped on the counter, hands covered in flour") · **health notes** (skip if any is wrong) · **View original Reel** ("never loses the source"). |
| 10–11 | **Cookbook** | ← Back → Recipes. Type one word in **Search**. | "Every reel I've saved, searchable." Then Home → paste the **same** URL → "Already saved" card. "It knows. Won't burn 30 seconds re-processing." |
| 11–12 | **Moods** | Home → tap **your mood** | "And when I don't know what I want — I'm wiped after the gym…" *Cards appear with reasons.* "It picks from my own cookbook and tells me why. Next is 'what can I make with what's in my fridge right now.'" Then a question: **"Which of those would matter more to you?"** |
| 12–13 | **Close** | Camera on you | One sentence tying value to *their* answer from minute 1. Then an ask: "Would you try it with three reels this week?" |
| 13–30 | **Q&A** | | Section 5. |

**Never show:** sign-in, delete, Profile, terminals, DevTools, code, the word "Apify/Whisper/Claude"
unless asked.

---

## 5. Q&A — have these ready

- **Who's it for?** Home cooks 22–40 who get food inspiration from short video and never cook it.
- **How does it make money?** Free tier with a monthly save limit; subscription above that.
  *(Pick a number and say it with confidence.)*
- **What if the AI gets a quantity wrong?** "When the creator doesn't say an amount, it estimates one,
  because a blank is useless in a kitchen. Today it doesn't mark which amounts were estimated; flagging
  those and letting you edit them are the next two things I'd build." *(Don't claim it already flags them.)*
- **Why not just screenshot?** Repeat minute 3.
- **Competition?** Most recipe savers import from a written recipe web page. Check before Thursday which
  apps already start from a video, and name one if you can. Don't say "none do" unless you've checked.
- **Cost per recipe?** One scrape, one transcription, one AI call. Get the real number from your
  Apify, Replicate and Anthropic usage pages tonight and quote it. Don't guess.
- **What's under the hood?** "Three AI services orchestrated in one pipeline: it pulls the video,
  transcribes the speech, and a language model reconciles caption + transcript into a structured recipe."
- **What if it fails?** "It tells you plainly and you try another reel." (You may have shown it.)
- **Why a laptop, not a phone?** "So all of you can see it clearly on a video call. It's the same live
  production app you'd install on your phone."
- **Why doesn't it pop up in Instagram's share sheet?** "It's built to: the app registers as a share
  target. Android supports that for installed web apps. iPhone doesn't let web apps into the share sheet
  yet, so on iPhone it's Copy link, then paste. The fix there is a small native iOS wrapper; that's on the
  roadmap." *(Only say it works on Android if you've tested it on an Android phone.)*
- **Can I try it?** Only offer it if you've set it up: Google sign-in is in Testing mode, so only your
  listed test users can log in. The email-link sign-in works for anyone.

---

## 6. Recovery — 30-second plans

| What you see | Say | Do |
|---|---|---|
| **"We couldn't read that Reel"** on the live paste | "Instagram throttles scrapers now and then — let me grab another." | Paste the **backup reel** from notes. |
| Backup fails too | "Here's the one I pulled from a Reel this morning — same 30 seconds, here's what came out." | Recipes → open the warm-up recipe. Continue the tour from there. |
| Processing runs past 60 s | Keep talking (roadmap, the blank-quantity story). | If 90 s+: tap **📖 View my recipes** and tour a pre-saved recipe; come back to Recipes after — the new one will be at the top. |
| "Already saved" on the live paste | "Ha — I rehearsed with this one." | Paste the backup. (Prevent: delete the demo reel Wednesday night.) |
| Cookbook empty / cards not loading | Production server issue. | Switch to the **localhost tab** (section 7) — same account, same recipes. |
| Mood returns nothing | "Nothing fits yet — that's the honest answer with four recipes." | Tap a second mood; move on. |

### Localhost fallback (boot at T-45 as insurance, keep in a second tab)

```bash
cd ~/Projects/Recipes
kill $(lsof -ti :3000) $(lsof -ti :5173) 2>/dev/null   # clear zombies
# terminal 1
just dev-server        # wait for: Server listening  port: 3000
# terminal 2
just dev-client        # wait for: Local: http://localhost:5173/
```
Open `http://localhost:5173` in a second tab; sign in with Google if needed. Env lives in
`server/.env` (all keys, `APIFY_API_TOKEN` not `_KEY`) and `client/.env.local` (two `VITE_` vars).
Don't save any code file while a job is running (`tsx watch` restarts and orphans it).

---

## 7. Picking a safe reel

1. **Public account, real video Reel, `/reel/` URL** (not `/reels/`, not `/p/`).
2. **English voiceover that states quantities** ("two tablespoons of soy sauce").
3. **Caption with a written ingredient list** — redundancy if transcription is weak.
4. **Under 60 s, one dish, ≤ ~12 ingredients**, food-forward thumbnail.
5. **Never saved in this account before.**

---

## 8. Known gotchas (learned the hard way this week)

- Supabase free tier **pauses after 7 idle days** → check the dashboard first thing.
- Railway trial expired once; now on Hobby ($5/mo). If the service ever shows *offline*, redeploy from
  Deployments; env vars must include `APIFY_API_TOKEN` and `CORS_ORIGIN=https://reel-eats-client.vercel.app`.
- Google sign-in needs the Supabase provider toggle **on and saved**; error otherwise reads
  "Unsupported provider".
- Instagram thumbnails expire; the app re-hosts them, but recipes saved before that fix show 🍽️.
- The server's in-memory rate limits reset on restart (localhost only).
- Chrome device-mode DevTools must be **undocked** or it shows in the shared window.
