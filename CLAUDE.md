# The Case of the Shrinking Hour — working notes

CS171 (Harvard, Fall 2026) final project. A scrollytelling data story about how much time
Americans spend with other people, built on the BLS American Time Use Survey.

**Team:** Georgia Messinger (lead), Chloe Nelson-Arzuaga, Mariah Crawford.

---

## The story — read this before changing any copy

Everything on the site is built to deliver one takeaway. If a change doesn't serve it, it
doesn't belong.

**The takeaway:** *You still see the people you live with. You see your friends half as much.*

Why: seeing a friend takes planning. Seeing someone in your house doesn't. The time that needs
planning is the time that's gone.

**The ending:** *Nobody took the hour. Hanging out just takes more work than it used to, and
people do less of it.*

**The beats, in order:**
1. Young people used to spend about an hour a day with other people. Now it's 36 minutes.
2. They're not busier. Work down 18 min/day, TV down 34 — **52 minutes handed back** — and
   socializing fell anyway.
3. They didn't spend it on fun either. Total leisure fell too, 333 → 305. It went to **sleep
   (+39) and chores (+18)**.
4. Phones are the suspect everyone names and we can't convict them: ATUS has **no phone
   category**, so phone time is scattered across every activity. We say this on the page.
5. **The ladder** (the payoff): sort company by how much has to be arranged before you see that
   person, and the losses line up perfectly.
6. On AI: we're about to get more time back. Last time, it went to sleeping and chores. *The next
   hour you get back won't go to anyone unless you decide it does.*

**Register:** plain spoken English. Say it as it is. Earlier drafts failed user testing because
they were writerly — "the hour dissolved", "who was holding it", "it stopped happening by itself"
all confused readers. If a sentence wouldn't be said out loud, rewrite it.

---

## Verified numbers

All from `data/atus.json`. Re-derive before changing any figure in copy; don't trust memory.

**The ladder** (ATUS companion series, all ages 15+, 2010–11 → 2024–25):

| Who | Minutes/day | Change |
| --- | --- | --- |
| Spouse or partner | 158 → 157 | unchanged |
| Family in your household | 262 → 243 | −7% |
| Coworkers | 148 → 108 | −27% |
| Family elsewhere | 61 → 43 | −30% |
| Friends | 64 → 32 | −50% |

**Ages 15–24, 2003–04 → 2024–25:** socializing 59 → 36 (−23, −39%) · work −18 · TV −34 ·
sleep & personal care +39 · chores +18 · other leisure +29 · total leisure 333 → 305.

**Other:** weekdays 50 → 28 (−44%), weekends 80 → 54 (−33%) · parents −6 vs. no kids −13 (weekends
−4 vs −17) · alone, 20–24: 4h13m → 5h37m, peak 2021 at 6h44m · games/computer, 20–24: 29 → 60.

**In human time** (use these — "23 minutes a day" lands as nothing, "six days a year" lands):
15–24 socializing −23 min/day = **six full days a year** · 20–24 time with others −117 min/day =
**a month a year** · friends −32 min/day = **eight days a year**, leaving under one evening a week.

---

## The visual system

Three motifs, recombined. Same comparison → same motif; different comparison → different motif.
A user tester's sharpest note was that we drew the same comparison two different ways.

- **The circle** is a day. Every clock means 1,440 minutes, socializing as the pink wedge, angle
  always exact.
- **The figure** is a person, or one unit of time with a person.
- **The melt** is what's gone — always proportional to minutes lost, always drawn *outside* the
  quantity it describes, so the metaphor can never distort a number being read.

**`--c-social` (pink) means socializing and nothing else, anywhere on the site.** `--sand` means
"you". Everything else in a day is muted. One bright thing per chart. All tokens in `css/base.css`;
fuller guide in `STYLEGUIDE.md`.

There are no generic line charts in the story. The only conventional charts are inside the case
file at the end, where the reader explores rather than being told.

---

## Architecture

Static site, no build step. D3 v7.8.5 and three.js r149 from CDNs. Cloudflare Pages deploys every
branch; `main` is the graded V1 and is frozen.

`js/main.js` is a small runtime. Each chapter registers hooks:

```js
story.chapter('id', {
  init(el, data) {},   // once, after data loads; el is the chapter's .viz box
  step(n, dir) {},     // text step n scrolled into view
  age(code) {},        // reader changed "I'm…"; code like '103'
  year(y) {},          // another chapter moved the shared year
});
```

Steps are **position-based**, not event-based: the active step is the last one whose top passed the
middle of the screen, so fast scrolling lands on the right state instead of skipping.

**Linked views:** the scale, the lineup and the verdict share one year via
`story.setYear(y, 'who-moved-it')`. Whoever the reader touches broadcasts; the others get `year(y)`.
Scroll-driven states stay local so scrolling never fights the reader.

**Shared helpers — use these, don't reinvent them:**
- `story.gapMark(g, x, top, bottom)` — the "2020: no survey" band. BLS published no 2020 estimate.
- `story.gapBridge(g, x, rows)` — dashed bridge across the gap so lines stay identifiable.
- `story.howto(el, text)` — the instruction line. **Every interactive chart needs one.**
- `story.PLAY_MS`, `story.reduceMotion`, `.year-big` — autoplay pace, motion preference, year readout.

`init` and `step` are wrapped in try/catch per chapter: one bad chapter logs and dies alone instead
of blanking the page. (It happened — one bad line once took down nine chapters.)

---

## Data

`scripts/fetch_atus.py` → `data/atus.json`, minutes per day, 2003–2025, `null` where BLS published
nothing (2020 included). Needs `BLS_CONTACT=you@email` set; BLS rejects anonymous scripted requests.

- `act[age][day][activity]` — ages `000` all, `103` 15–24, `020` 20–24, `031` 25–34, `038` 35–44,
  `042` 45–54, `049` 55–64, `065` 65+. Days `00` all, `19` weekdays, `16` weekends.
- `par['13'|'01'][day][activity]` — parent of a child under 18 / no kids at home.
- `who["who|age|day"]` — waking minutes by companion, from 2010. `01` alone, `02` with others,
  `03` spouse, `24` family in household, `35` coworkers, `36` own children, `42` family elsewhere,
  `43` friends.
- Socializing `600024`. TV `600025`. Games/computer `600058` (not published for 15–24, which is why
  some chapters use 20–24). Other leisure = `600023 − 600024 − 600025`.
- The 14 activities in `story.DAY_PARTS` sum to 24 hours.

**Honesty rules that stay on the page:** never claim causation — activities moved together, the
survey can't say what displaced what. Mark the 2020 gap rather than drawing through it. Label any
chapter locked to one age group (`data-scope` on the section does this automatically). BLS doesn't
cross age with parent status, so there's no age-by-parent filter.

---

## File ownership

Three people push to one branch, so stay in your own files.

- **Mariah:** `js/ch-guess.js`, `js/ch-drop.js`, `js/ch-ladder.js`, `css/opening.css`, `css/ladder.css`
- **Chloe:** `js/ch-moved.js`, `js/ch-parents.js`, `js/ch-file.js`, `css/moved.css`, `css/parents.css`,
  `css/file.css`, `scripts/`, `data/`
- **Georgia:** `js/world.js`, `js/clock.js`, `js/balance.js`, `js/lineup.js`, `css/clock.css`,
  `css/balance.css`, `css/lineup.css`
- **Shared — announce before editing:** `index.html`, `js/main.js`, `css/base.css`

Branch off the current prototype branch, open a pull request into it, never into `main`.

---

## What user testing taught us

Two sessions, Nov 2026. Both testers independently hit the same two problems, which is why the
shared helpers exist:

1. **They didn't know what they were allowed to do.** Neither noticed the age menu in the top bar,
   so there's now a second one inside the story and they stay in sync. Both scrolled back and forth
   hunting for controls, so every chart states its instruction where the chart is.
2. **The 2020 gap broke every line chart.** One tester lost track of which line continued across it.

Also: one driver per chapter (scroll *or* slider, never both — two drivers confused a tester);
charts say what they encode on the chart; anything that looks clickable must be clickable.

---

## Running and testing

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

Before claiming anything works, drive it in a real browser: load the page, walk every `.step`,
and check the console is clean. Headless Chromium with `--use-angle=swiftshader` works for the 3D
scene. The usual check is: all steps walked, zero console errors, zero `.viz` left without the
`live` class.

---

## Known loose ends

- **Dead files.** `js/ch-alone.js`, `ch-friends.js`, `ch-games.js`, `ch-weekdays.js`, `ch-who.js`
  are no longer loaded — their chapters were absorbed elsewhere. `js/ch-day.js` is still script-tagged
  but its section was removed, so it loads and does nothing. Safe to delete all six.
- **Own children left off the ladder.** That series fell 20% (94 → 75), which would break the
  monotonic staircase. The defensible reason is that it tracks how many adults have a child under 18
  at home rather than how much arranging it takes — but it was dropped without being flagged, and
  it should either go back on as a stated exception or be named in the methods.
- **The 3D world has never been tested on real hardware**, only in a software renderer. It picks a
  quality tier from the device and steps down if frames are slow, but nobody's watched it on a real
  laptop or phone.
- **No accessibility pass has been completed** across all charts (labels, keyboard focus, reduced
  motion are partial).
