# Reel Eats — Demo Day Runbook

For the IBM Technical Sales live demo, Thursday Oct 1. Read top to bottom the night before;
run section 4 cold on the morning.

## 0. Fill these in Wednesday night

| Blank | Value |
|---|---|
| **Demo reel URL** (fresh — never saved in this account) | `https://www.instagram.com/reel/________/` |
| **Backup reel URL** (tested once, then deleted) | `https://www.instagram.com/reel/________/` |
| **Mood to click** (the one that returns 2–3 good recipes) | ________ |
| **Cost per recipe** (from Apify + Replicate + Anthropic usage pages ÷ recipes saved) | $______ |
| **Price** you'll quote | Free for ___ recipes/month, $___/month unlimited |
| **#1 next feature** you'll name | ________ (suggested: flag + edit estimated quantities) |
| **One competitor** (App Store search: "save recipes from Instagram") | ________ — how you differ: ________ |
| **iOS Shortcut tested?** (section 3) | yes / no |
| **Android share sheet tested on a real Android phone?** | yes / no — if no, don't claim it works |

---

## 1. Things to remember (read these twice)

1. **They're grading you, not the app.** Communicate value, tell a story, engage the audience. The app is
   the prop.
2. **Four value beats beat forty features.** A feature dump is the classic junior mistake. Depth over breadth.
3. **Never overclaim.** If it isn't built or tested, say "that's next" — not "it does". Getting caught
   overclaiming costs more trust than any missing feature.
   - Estimated quantities are **not flagged** in the UI yet.
   - Android share sheet is **built but untested** unless you tested it.
   - Don't say "no one else does this" or "it costs cents" unless you checked.
4. **Talk in benefits, not components.** Say "it catches amounts she said but never wrote", not "it
   reconciles three text sources".
5. **Pitch implementation at their level.** Sentence first. Diagram only if asked. Stack only if they push —
   then stop and ask *"which part should I go into?"*
6. **Half of a great demo is them talking.** Open with a question, close with a question and an ask.
7. **Everything you show is live and real.** That *is* "show, don't tell". Say so once: "this is the live app".

---

## 2. What you are demoing

**Primary:** the production app at **https://reel-eats-client.vercel.app** — real URL, nothing to boot.
Server on Railway, database/auth/photos on Supabase.

**Fallback:** the same app on your laptop at `http://localhost:5173` (section 7). Only if production is down.

Verified working: Google sign-in, paste → recipe (~30 s), friendly failure card, cookbook + search,
"Already saved", mood recommendations + "Good for" tags.

---

## 3. Wednesday night (~45 min)

**Cookbook (4–6 recipes, all with photos, all weeknight-friendly)**
- [ ] Delete the recipes showing the 🍽️ plate (Pad See Ew, Miso Soup with Chicken, Thai Coconut Cod) —
      or delete + re-paste their reels to get a permanent photo (each re-paste uses 1 of 10/hour).
- [ ] Decide on "Meat Stock for Babies & Gut Healing" — niche; probably remove from the demo cookbook.
- [ ] Open each remaining recipe: no embarrassing health note (e.g. "dairy-free (uses Greek yogurt)").

**Reels**
- [ ] Pick the **demo reel** (criteria in section 8). Paste once, check the result, **delete it**.
- [ ] Pick the **backup reel**. Paste once, check, **delete it**.
- [ ] On instagram.com, open the demo reel → **⋯ → Copy link** → paste into Reel Eats → confirm the app
      accepts that exact URL form. If not, you'll paste the clean URL from your notes.

**iOS Shortcut (optional, 5 min — only mention it in Q&A if this works)**
1. Shortcuts app → **+** → name it *Save to Reel Eats*.
2. ⓘ → **Show in Share Sheet** on → accepted types: **URLs**.
3. Action **URL Encode** (input: *Shortcut Input*).
4. Action **Text**: `https://reel-eats-client.vercel.app/share?url=` + the *URL Encoded Text* variable.
5. Action **Open URLs** (input: that Text).
6. Instagram → a reel → Share → *Share to… / More* → **Save to Reel Eats** → expect "Recipe queued!".
   It opens in **Safari**, so be signed in to Reel Eats in Safari.

**Homework for Q&A** — fill section 0: cost per recipe, price, #1 next feature, one competitor.

**Setup**
- [ ] Notes file on a second screen: both reel URLs, the mood, section 0, and the talk track (section 5).
- [ ] Instagram tab: demo reel open on instagram.com, logged in.
- [ ] Screenshot of one recipe detail page — disaster-only, never shown otherwise.
- [ ] **Rehearse section 5 out loud twice, with a timer, on the real app.**

---

## 4. Thursday, T-45 min

1. **Supabase** dashboard → project *Active*, not *Paused* (free tier pauses after 7 idle days).
2. **Railway** → `reel-eats` service → latest deployment *Active*.
   `https://reel-eats-production.up.railway.app/health` → `{"data":{"status":"ok"}}`.
3. **Vercel app** in your normal Chrome profile (not incognito) → Home, signed in.
   If you see sign-in → **Continue with Google**.
4. **Warm-up paste**: paste the **backup reel**, wait for "Recipe saved!". Leave it — it's "the one I saved
   this morning". (Verifies all API keys and warms the pipeline.)
5. **Chrome setup**
   - `Cmd+Opt+I` → DevTools `⋮` → *Dock side* → **Undock into separate window**.
   - `Cmd+Shift+M` → device dropdown → **iPhone 16** (or 14 Pro) → zoom **100%**.
   - Device toolbar **⋮** (far right of the bar above the page, *not* in DevTools):
     **Hide media queries**, **Hide rulers**. *Show device frame* is optional — skip it if it's not offered.
   - Drag DevTools off-screen. `Cmd+Shift+B` hides bookmarks. `Cmd+R` once.
   - In the call, **share the Chrome window only** — never the full screen.
6. **Don't paste anything else before the demo.** Limit is 10 saves/hour; you've used 1.

---

## 5. The demo (target 12–13 min, then Q&A)

| Min | Beat | Do | Say (paraphrase) |
|---|---|---|---|
| 0–3 | **Open + discovery** | Camera on you, not the app | "Quick question before I show you anything — do you ever cook from Instagram or TikTok? When did you last save a food video and actually make it?" *Listen. Their answer is your hook.* |
| 3–5 | **Problem** | Instagram tab, play ~5 s of the reel | "Looks incredible. Where's the recipe? She says 'a bit of miso' — how much? The steps go by in four seconds. So you save it, and it dies in your saved folder with the other 300." |
| 5–6 | **Magic** | Reel **⋯ → Copy link**. Switch to Reel Eats, paste, **Save Recipe**. *(If the copied URL is rejected, paste the clean one from notes.)* | "This is the live app. Copy the link, paste it in — that's the whole input." |
| 6–7 | **Wait, gracefully** | Processing card. **Stay on Home.** | "It's listening to what she says, reading her caption, and building the recipe. Usually under a minute." *Fill with why a blank quantity is useless at the stove.* |
| 7–10 | **Value tour** | "Recipe saved!" → **View →** | Photo · **servings / prep / cook** ("planning dinner, I know instantly") · **ingredients with amounts** ("she never said '1 tbsp'; when the creator doesn't say, it estimates — a blank is useless in a kitchen") · **numbered steps** ("phone on the counter, hands covered in flour") · **health notes** (skip if any is wrong) · **Good for** tags · **View original Reel** ("never loses the source"). |
| 10–11 | **Cookbook** | ← Back → Recipes. Type one word in **Search**. | "Every reel I've saved, searchable." Home → paste the **same** URL → "Already saved". "It knows. Won't waste your time — or my money — re-processing." |
| 11–12 | **Moods** | Home → tap **your mood** | "And when I don't know what I want — I'm wiped after the gym…" *Cards with reasons appear.* "It picks from my own cookbook and tells me why. Next: 'what can I make with what's in my fridge.'" Then: **"Which of those would matter more to you?"** |
| 12–13 | **Close** | Camera on you | One sentence tying value to *their* minute-1 answer. Then an ask: "Would you try it with three reels this week?" |
| 13–30 | **Q&A** | | Section 6. |

**Never show:** sign-in, delete, Profile, terminals, DevTools, code. Don't say "Apify/Whisper/Claude" unless asked.

---

## 6. Q&A

### How to talk about implementation — three depths

**Depth 1, one sentence (default):**
> "It watches the video for you: it pulls the reel, listens to what the creator says, reads the caption,
> and an AI model turns all of that into a structured recipe."

**Depth 2, 30 seconds (if asked "how does it work?"):**
```
You paste a link
  → server fetches the reel (video, caption, thumbnail)
  → speech-to-text transcribes what the creator says
  → an AI model combines caption + transcript into ingredients, amounts, steps, times, health notes
  → saved to your private account
```
> "It takes ~30 seconds, so the app answers instantly and works in the background — you can leave."

**Depth 3, only if they push:** React web app on Vercel · Node/Express server on Railway · Supabase for
login, database and photo storage · Apify (scraping), Whisper via Replicate (speech-to-text), Claude
(extraction) · 60+ automated tests. Then stop: *"Which part would you like me to go into?"*

**Always convert a technical fact into a benefit:**

| Fact | Say |
|---|---|
| Caption + two transcripts reconciled | "It catches amounts she *says* but never *wrote*." |
| Estimates instead of blanks | "A recipe with a blank amount is useless at the stove." |
| Background processing | "You can leave; it keeps working." |
| Duplicate detection | "It won't waste your time re-processing." |
| Fails cleanly on dead/private reels | "When it can't, it tells you plainly." |
| Mood matching runs on your own cookbook | "Recommendations from recipes you already chose." |

### Product and customer
- **Who's it for?** "The 28-year-old who saves ten food reels a week and cooks none of them." Home cooks
  roughly 22–40 who get inspiration from short video.
- **Why not just screenshot / use Instagram's save?** Repeat minute 3: saves don't give you amounts, steps
  or search; they give you a pile.
- **What's next?** Your section-0 answer, with *why*. Good candidates: flag + edit estimated quantities
  (trust), iOS share extension (friction), pantry "what can I make now" (daily use), backlog import (onboarding).
- **How would you measure success?** Reels saved per user per week — and recipes actually cooked.

### Business
- **How does it make money?** Section 0. Say it confidently.
- **Cost per recipe?** Section 0 — the real number. "One scrape, one transcription, one AI call."
- **Competition?** Section 0. "Most recipe savers import from a written recipe web page; we start from the
  video." Don't say "no one does this" unless you checked.

### Platform — phone, share sheet, bulk import
- **Why a laptop, not a phone?** "So all of you can see it clearly on a video call. This is the live
  production app, the same one you'd install on your phone."
- **Why doesn't it appear in Instagram's share sheet?**
  > "It's built to — the app registers as a share target, and Android supports that for installed web apps.
  > iPhone doesn't let web apps into the share sheet, so on iPhone it's Copy link and paste — or a one-tap
  > Shortcut *(only if you tested it)*. A native iOS share extension is next."
  - Only say Android works if you tested it on an Android phone.
- **Could it import everything I've already saved?** (Or if they suggest pasting a saved-collection link.)
  > "Saved collections are private — the only way to read them is to log in as you, and I won't ask for your
  > Instagram login. The right way is Instagram's own data export: you request it, upload it, and your saved
  > reels become a cookbook on day one — your data, your consent."
  - Be honest it's roadmap. Real constraints if pushed: each reel is a paid pipeline run, and today's limit
    is 10/hour, so it needs a queue and a per-user cap.
  - Check your own Instagram export includes saved posts before claiming it.
- **What if Instagram blocks the scraper?** "Scraping sits behind one interface, so switching providers is
  contained. Long-term, the share-sheet path means the user hands us the video directly."
- **Can I try it?** Email-link sign-in works for anyone. Google sign-in is in **Testing** mode — only your
  listed test users can use it.

### Trust and quality
- **What if the AI gets a quantity wrong?** "When the creator doesn't say, it estimates, because a blank is
  useless in a kitchen. Today it doesn't mark which amounts were estimated — flagging those and letting you
  edit are the next two things I'd build."
- **What if it fails?** "It tells you plainly and you try another reel." (Maybe you showed it.)
- **Privacy?** "Recipes are private to each account; the database enforces that per user, and every
  request is authenticated."

### About you
- **Hardest part?** "A made-up reel URL was saving as a garbage recipe full of `<UNKNOWN>`. I traced it to a
  fallback that downloaded the Instagram web page instead of the video, and made it fail cleanly at the
  first step — no wasted AI spend."
- **What would you do differently?** Pick one honestly (e.g. "test on real devices earlier", "design the
  share path for iOS from day one").
- **How would you sell this to a business?** Practise one: *grocery chain* — "every saved reel becomes a
  shopping list, so inspiration becomes a basket." *Meal-kit company* — "turn trending reels into kits."
- **How does this relate to IBM?** "It's a small version of what enterprises pay for: turning unstructured
  content — video, audio — into structured data a business can act on."

---

## 7. Recovery — 30-second plans

| What you see | Say | Do |
|---|---|---|
| **"We couldn't read that Reel"** on the live paste | "Instagram throttles scrapers now and then — let me grab another." | Paste the **backup reel** from notes. |
| Backup fails too | "Here's the one I pulled from a reel this morning — same 30 seconds." | Recipes → open the warm-up recipe; tour from there. |
| Copied link rejected | — | Paste the clean `/reel/` URL from notes. |
| Processing past 60 s | Keep talking (the blank-quantity story, roadmap). | At 90 s+: **📖 View my recipes** → tour a pre-saved recipe → back to Recipes; the new one appears at the top. |
| "Already saved" on the live paste | "I rehearsed with this one." | Paste the backup. |
| Cookbook empty / cards not loading | — | Switch to the **localhost tab** (below): same account, same recipes. |
| Mood returns nothing | "Nothing fits yet — honest answer with a small cookbook." | Tap a second mood; move on. |

### Localhost fallback (boot at T-45 as insurance, keep in a second tab)
```bash
cd ~/Projects/Recipes
kill $(lsof -ti :3000) $(lsof -ti :5173) 2>/dev/null   # clear zombie processes
# terminal 1
just dev-server        # wait for: Server listening  port: 3000
# terminal 2
just dev-client        # wait for: Local: http://localhost:5173/
```
Open `http://localhost:5173`, sign in if needed. Env: `server/.env` (all server keys, `APIFY_API_TOKEN`
not `_KEY`) and `client/.env.local` (the two `VITE_` vars only). Don't save a code file while a job runs.

---

## 8. Picking a safe reel

1. **Public account, real video Reel, `/reel/` URL** (not `/reels/`, not `/p/`).
2. **English voiceover that states quantities** ("two tablespoons of soy sauce").
3. **Caption with a written ingredient list** — redundancy if the transcript is weak.
4. **Under 60 s, one dish, ≤ ~12 ingredients**, food-forward thumbnail.
5. **Never saved in this account before.**

---

## 9. Known gotchas (learned this week)

- Supabase free tier **pauses after 7 idle days** → check the dashboard first.
- Railway: on Hobby ($5/mo). If the service shows *offline*, redeploy; env must include `APIFY_API_TOKEN`
  and `CORS_ORIGIN=https://reel-eats-client.vercel.app`.
- Google sign-in: Supabase provider toggle must be **on and saved** ("Unsupported provider" otherwise);
  OAuth consent screen is in **Testing** mode (only listed test users).
- Recipes saved before thumbnail re-hosting show 🍽️ — delete or re-save them.
- iOS Shortcut opens Safari, not the home-screen app — sign in there too.
- Chrome device toolbar controls live **above the page**, not in the DevTools window.
- Your shell aliases `grep` → `rg`.
