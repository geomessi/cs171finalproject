# Prototype 2 work plan (final project check)

**Where this lives:** branch `prototype-2`, previewed at **https://prototype-2.cs171finalproject.pages.dev**.
`main` (https://cs171finalproject.pages.dev) stays frozen as Prototype V1 until the TF has graded it. Don't merge into `main`. The V1 plan is in `WORKPLAN-v1.md`.

**How to work:**
```
git fetch
git checkout prototype-2
git pull
git checkout -b yourname/what-youre-doing
# ...commit...
git push -u origin yourname/what-youre-doing
```
Open the pull request **into `prototype-2`** (not `main`). Cloudflare comments a preview link on it.

**Goal for the check:** answer the TF's first-check feedback. That means narrowed questions (incl. parents vs. no kids and weekdays vs. weekends), a story that ends in a **final explorable view**, AI as a **short closing thought**, and a prototype we can demo live in 5 minutes.

**Shared deadline:** everything merged into `prototype-2` **two days before our slot** (date: _TBD_), so we rehearse the demo together at least once.

| Owner | Chunk | Files you own |
| --- | --- | --- |
| Chloe | "Explore your day" final chapter, Clue 2 spike note, suspects age label | new `js/ch-explore.js`, `css/explore.css`; `js/ch-moved.js`, `js/ch-alone.js`, `css/moved.css`, `scripts/`, `data/` |
| Mariah | The ending, methods and data notes, accessibility, phone polish | new `js/ch-end.js` (if needed), `css/opening.css`; `js/ch-guess.js`, `js/ch-drop.js`, `js/ch-weekdays.js` |
| Georgia | 3D performance, honest "I'm…" menu, demo prep, process book | `js/world.js`, `js/clock.js`, `js/balance.js`, `css/clock.css`, `css/balance.css`, `js/main.js` (scope notes) |

## Chloe · Explore your day (the final explorable view)

1. **New last chapter, after the verdict** (`ch-explore.js`). Readers pick a group and a day type and see:
   - socializing then (2003–04) vs. now (2024–25);
   - what grew and what shrank (reuse your diverging chart);
   - time alone vs. with others, where BLS has it (by age only, from 2010).
2. **One group list, not two filters.** BLS doesn't publish age *crossed with* parent status, so the picker is a single list: 15–24, 25–34, 35–44, 45–54, 55–64, 65+, parents of a child under 18, no kids at home. Day type: all days / weekdays / weekends.
   - Data: ages from `act[age][day]`, parents from `par[13|01][day]`, alone from `who["01|age|day"]`. When a group has no alone data, say so in the view instead of showing an empty chart.
3. **Clue 2: name the 2021 spike.** Alone time peaked around 2021 (~6h45m) and has come down since. Add a short annotation on the chart, e.g. "Pandemic years: alone time peaked, then eased, but stayed above 2010."
4. **Suspects chapter: label it "Ages 15–24".** A small tag on the chart so it doesn't look broken when someone changes "I'm…".

Done when the explore view works for every group and day type, and both labels are in.

## Mariah · The ending, methods, accessibility

1. **"What this means," after the verdict** (short text step or block): it's not that young people are busy, they got time back. Time together turned into something saved for weekends.
2. **The AI closing thought (one or two lines).** In July 2026 BLS proposed adding questions about AI use to the ATUS, for collection starting January 2027. It's a *proposal*, not approved, so phrase it that way. Then the question: if AI gives us back hours, will we spend them on each other?
3. **Methods and data notes section** (before the footer): source (BLS ATUS published time series), what "socializing" counts, two-year averages, no 2020 estimates, the who-with data starts in 2010, no age × parent breakdown, changes show what moved together and not causes. Credits for the three of us and the tools.
4. **Accessibility pass on every chart:** an `aria-label` / short text summary per chart, visible keyboard focus on sliders and buttons, and respect `prefers-reduced-motion` (skip the animations).
5. **Phone polish for the opening chapters** (guess, the case, Clue 1).

Done when the ending and methods are on the page and every chart has a text summary.

## Georgia · World, demo, process book

1. **3D performance on real devices:** test on a couple of laptops and phones; lower shadow resolution and the walker count on weak GPUs, and make sure the 2D fallback kicks in cleanly.
2. **Honest "I'm…" menu** (`main.js`): in chapters that only show young adults, show a small note like "This chapter shows ages 15–24."
3. **Demo prep:** the 5-minute run-of-show, a backup screen recording, our questions for the TF, and an implementation cheat sheet (how the scroll steps, the data pipeline and the 3D clock work).
4. **Process book:** what changed since the first check, the new question list, screenshots.

## Stretch (only if everything above is merged)

- **Chloe:** a "who we spend time with" slope chart (friends, family, coworkers, 2010 → 2025) as a second view inside Clue 2.
- **Georgia:** side-by-side age clocks for the methods section.

## Rules that keep us out of each other's way

- Pull before you start, push small commits often.
- Only edit the files you own. `index.html`, `js/main.js` and `css/base.css` are shared: tell the team first, then make the change in its own small commit. New chapters need a `<section data-chapter="...">` in `index.html` and a `<script>` tag. Add yours in one commit.
- Use the colors and fonts in `css/base.css` (`var(--c-social)` is pink and only for socializing; `var(--sand)` is "you").
- Test locally: `python3 -m http.server 8000`, then open http://localhost:8000.

## How a chapter plugs in

```js
story.chapter('explore', {
  init(el, data) { /* once, after data loads. el is the chapter's chart box */ },
  step(n, dir)  { /* text step n scrolled into view */ },
  age(code)     { /* reader changed "I'm…"; code like '103' */ },
});
```

Helpers: `story.series(age, activity, day)` returns minutes per day for 2003–2025 (`null` = no estimate, including 2020). `story.avg(arr, [2024, 2025])` averages years. `story.you`, `story.ageName('103')` → `'15–24'`, `story.color('600024')`.

## Data cheat sheet (`data/atus.json`, minutes per day)

- `act[age][day][activity]`: ages `000` all, `103` 15–24, `020` 20–24, `031` 25–34, `038` 35–44, `042` 45–54, `049` 55–64, `065` 65+. Days `00` all, `19` weekdays, `16` weekends.
- `par[13|01][day][activity]`: parents of a child under 18 / no kids at home.
- `who["who|age|day"]`: waking time by companion, from 2010. `01` alone, `02` with others, `43` friends, `24`/`42` family, `03` spouse, `35` coworkers, `36` own kids.
- Socializing is `600024`. The 14 activities in `story.DAY_PARTS` add up to 24 hours.
