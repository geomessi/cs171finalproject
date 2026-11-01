# Prototype 2 — the work plan

**Where this lives:** branch `prototype-2`, preview at **https://prototype-2.cs171finalproject.pages.dev**.
`main` (https://cs171finalproject.pages.dev) stays frozen as Prototype V1 until the TF has graded it. **Do not merge into `main`.** The V1 plan is in `WORKPLAN-v1.md`.

```
git fetch && git checkout prototype-2 && git pull
git checkout -b yourname/what-youre-doing
# ...commit...
git push -u origin yourname/what-youre-doing
```
Open the pull request **into `prototype-2`**. Cloudflare comments a preview link on it.

---

## The story

> In 2003, young Americans spent about an hour a day just being with other people. A fifth of that hour is now gone. This is a case file: we round up every suspect who could have taken it, clear them one by one, follow three clues, weigh the day, and deliver a verdict. Nobody took the hour. It dissolved.

**The rule of the site:** every chapter either **clears a suspect** or **adds a clue**. If a chart does neither, it doesn't belong in the story — it belongs in the case file at the end. Hold each other to this.

**Three findings we didn't have at the first check.** These are what make the arc work, and they're all verified in `data/atus.json`:

1. **Parents lost the least.** Parents of a child under 18 lost 6 minutes a day of socializing since 2003–04. People with no kids at home lost 13. On weekends it's starker: 4 minutes against 17. The people with the least free time kept the most of their social lives.
2. **It started before the pandemic.** Time with friends was 65 minutes a day in 2010 and already down to 43 by 2019, before any lockdown. The pandemic didn't start this; it finished a decade-long slide.
3. **Only one block of the day more than doubled.** Playing games and using a computer for fun: 29 minutes a day for 20–24-year-olds in 2003–04, 60 now. It's the one suspect that doesn't walk free — and we're honest that the survey can't prove it took anything.

---

## The arc

Sixteen sections, five novel views, two sets of linked views. ✚ is new since V1.

| # | Chapter | The view | Owner |
| --- | --- | --- | --- |
| 1 | Hero | The melting-clock world — **novel** | Georgia |
| 2 | Make a guess | Guess slider → reveal | Mariah |
| 3 | The case | Socializing by age, 2003–2025 | Mariah |
| 4 ✚ | A day can't grow | One 24-hour day morphing 2003 → 2025 — **novel** | Mariah |
| 5 | Suspects: work and the screen | Diverging change bars, with verdict stamps | Chloe |
| 6 ✚ | Suspect: the kids | Parents vs. no kids, by day type | Chloe |
| 7 ✚ | The one that didn't walk | Games and computer use, doubled | Chloe |
| 8 | Clue 1: the weekdays | Weekday vs. weekend, then and now | Mariah |
| 9 | Clue 2: the day went quiet | Alone vs. with others, 2010–2025 | Chloe |
| 10 ✚ | Clue 3: the empty chair | Friends pictogram — **novel** — plus a who-with slope | Mariah / Chloe |
| 11 | Weigh it | The balance scale — **novel** | Georgia |
| 12 ✚ | The lineup | Six melting clocks on one slider — **novel, linked** | Georgia |
| 13 | The verdict | The melting clock, played out | Georgia |
| 14 ✚ | What the file says | The close, and the AI question | Mariah |
| 15 ✚ | Your case file | Explorable ending, three charts moving together — **linked** | Chloe |
| 16 ✚ | Methods and notes | Sources, limits, credits | Mariah |

**Novel views: 5** (world, day morph, friends pictogram, scale, clock lineup). **Linked views: 2** (the lineup drives the scale; the case file brushes across three charts).

---

## The copy

**Paste-ready.** Every line below is final copy for `index.html`. Numbers are verified. If you change a number, change it here too. If a sentence feels stiff when you see it on the page, say so in the pull request — don't quietly rewrite it alone.

### 4 ✚ A day can't grow (Mariah)
- **Kicker** The constraint · **H2** A day can't grow
- Twenty-four hours. Fourteen hundred and forty minutes, every one of them written down. If socializing lost 23 minutes, those 23 minutes are sitting somewhere else in this column.
- Watch 2003 become 2025. Four blocks do almost all the moving: sleep and personal care up 39 minutes, other leisure up 29, chores up 18, TV down 34.
- So the question was never *where did the hour go*. It's *who was holding it*.

### 5 Suspects: work and the screen (Chloe)
- **Kicker** The suspects · **H2** Round up the usual
- If young people stopped seeing each other, the easy story is that they got busier. Two suspects: the job, and the screen.
- **Work: cleared.** 15–24-year-olds work 18 fewer minutes a day than in 2003–04.
- **TV: cleared.** TV fell 34 minutes. Both suspects *gave* young people time back — and they still spent less of it together.

### 6 ✚ Suspect: the kids (Chloe)
- **Kicker** The suspects · **H2** Then it has to be the kids
- A small child eats a day whole. If anyone lost a social life in twenty years, it should be parents.
- **Cleared, and then some.** Parents of a child under 18 lost 6 minutes a day. People with no kids at home lost 13.
- Weekends make it starker. Parents kept almost all of their weekend socializing — down 4 minutes. People with no kids lost 17.
- Whatever took the hour, it took most of it from the people with the fewest obligations.

### 7 ✚ The one that didn't walk (Chloe)
- **Kicker** The suspects · **H2** One suspect didn't walk
- Of the fourteen blocks in the day, one more than doubled: playing games and using a computer for fun. For 20–24-year-olds, 29 minutes a day in 2003–04. Sixty now.
- Here's where we stop. The survey records what you were doing, not what you would have done instead. Two lines moved in opposite directions over twenty years. That is the whole claim.

### 8 Clue 1: the weekdays (Mariah)
- **Kicker** Clue 1 · **H2** The weekdays emptied first
- Weekday socializing nearly halved, 50 minutes to 28. Weekends held up better, 80 to 54. Being with people stopped being a thing that happens on a Tuesday.

### 9 Clue 2: the day went quiet (Chloe)
- **Kicker** Clue 2 · **H2** The day went quiet
- Since 2010–11, 20–24-year-olds went from 4h13m a day alone to 5h37m. Time with other people fell by nearly two hours.
- The pandemic shows up exactly where you'd expect: alone time peaked in 2021, at 6h45m. Then it came down — and stopped well above where it started.

### 10 ✚ Clue 3: the empty chair (Mariah, Chloe)
- **Kicker** Clue 3 · **H2** The empty chair
- Across all ages, time with friends halved: 65 minutes a day in 2010, 32 now.
- And it was going before anything closed. By 2019 it was already down to 43 minutes. The pandemic didn't start this. It finished a slide that had been running for a decade.
- Not everyone left. Time with a spouse or partner didn't move — 158 minutes, then 157. Family held. Coworkers fell by 40 minutes. The people we lose are the ones we have to choose.

### 12 ✚ The lineup (Georgia)
- **Kicker** The lineup · **H2** Everyone's clock is melting
- Six age groups, one clock each, same year on all of them. Drag the slider and the whole lineup melts together.
- Young adults melt fastest — 23 minutes gone. 25–34 and 65+ lost 12. The middle of life lost 6. Nobody's clock holds its shape.

### 14 ✚ What the file says (Mariah)
- **Kicker** The closing · **H2** What the file says
- No suspect took the hour. Work gave time back. TV gave time back. Parents, who have the least room in a day, kept the most of their social lives. The hour wasn't stolen by one thief — it dissolved into a day that is easier and easier to spend alone.
- In July 2026, the Bureau of Labor Statistics proposed adding questions about AI use to this survey, with collection starting in 2027. It's a proposal, not a decision. But it means this chart will eventually be able to answer the question we actually care about: if AI hands back hours, do we spend them on each other?

### 15 ✚ Your case file (Chloe)
- **Kicker** Your turn · **H2** Open the file yourself
- Pick a group and a kind of day. The three panels move together: the hour then and now, what grew and what shrank, and how much of the day was spent alone.

### 1, 11, 13 — existing copy stands
The hero dek, the scale steps and the verdict steps stay as they are on `main`. Georgia will tighten the verdict's last step so it hands off to chapter 14 instead of ending on the AI question.

---

## Packages

### Chloe — the suspects and the case file

**1. Suspect: the kids** (`js/ch-parents.js`, `css/parents.css`) — a dumbbell chart, three rows: all days, weekdays, weekends. Two dots per row, 2003–04 and 2024–25, one line for parents and one for no kids at home. Data: `par['13']` and `par['01']`, activity `600024`, days `00`/`19`/`16`. Verified: parents 44 → 38, no kids 47 → 34; weekends 71 → 67 against 69 → 52.

**2. The one that didn't walk** (`js/ch-games.js`) — two lines, 2003–2025: socializing and games/computer use (`600058`) for ages 20–24, crossing. Annotate the crossing year. Note in the chart that `600058` isn't published for 15–24, which is why this one chapter uses 20–24.

**3. Suspects chapter** (`js/ch-moved.js`) — add a **CLEARED** stamp on work and TV as their steps fire, and a small "Ages 15–24" tag so the chart reads honestly when someone changes "I'm…".

**4. Clue 2** (`js/ch-alone.js`) — annotate the 2021 peak, and mark 2020 as "no survey" rather than letting the line jump the gap silently.

**5. Who-with slope** inside Clue 3 (`js/ch-who.js`) — five lines, 2010 → 2025: friends 65 → 32, coworkers 148 → 108, own kids 94 → 75, family elsewhere 61 → 43, spouse 158 → 157. Label the ends; don't use a legend.

**6. Your case file** (`js/ch-file.js`, `css/file.css`) — the explorable ending and our linked-views requirement. One group picker (15–24, 20–24, 25–34, 35–44, 45–54, 55–64, 65+, parents of a child under 18, no kids at home) and one day-type picker (all days, weekdays, weekends), driving three panels at once:
- **then vs. now** — socializing in 2003–04 and 2024–25;
- **what moved** — the diverging bars, reused;
- **alone vs. together** — only where BLS publishes it (by age, from 2010); for the parent groups, say so in the panel instead of drawing an empty chart.

Brushing a year range in any panel filters the other two. BLS doesn't publish age crossed with parent status, which is why it's one list and not two filters.

### Mariah — the opening, the clue, the close

**1. A day can't grow** (`js/ch-day.js`, `css/day.css`) — our second novel view. One stacked column, the full 24 hours for 15–24, that **morphs** from 2003–04 to 2024–25 as you scroll: blocks grow and shrink in place, socializing in pink. The 14 blocks in `story.DAY_PARTS` sum to exactly 24 hours — check that they do, and let the reader see the total hold still while the pieces move. That's the whole point of the chapter.

**2. The empty chair** (`js/ch-friends.js`, `css/friends.css`) — our third novel view. A pictogram: 65 small figures at a table in 2010, one per minute a day spent with friends, emptying to 32 as the year advances. Figures leave in the order they'd actually leave: the pre-2020 slide first, then the pandemic drop, then the flat years. Readable without the animation.

**3. What the file says** (`js/ch-close.js` or plain markup) — the close and the AI paragraph. Phrase the BLS proposal as a proposal.

**4. Methods and notes** — source, what counts as socializing, two-year averages, no 2020 estimates, who-with data starting in 2010, no age-by-parent crosstab, "moved together, not caused," and credits for the three of us.

**5. Her existing chapters** — the guess, the case and Clue 1, with the copy above, and a pass on phone layout.

### Georgia — the world, the lineup, the demo

**1. The lineup** (`js/lineup.js`) — our fourth novel view and the first set of linked views. Six small melting clocks, one per age group, all reading the same year, with one slider under them. The slider also drives the scale in chapter 11, so the two chapters stay in step: pull the shared year into `story` so both read it. Each clock melts by its own group's loss, which makes 15–24's slump obvious next to the others.

**2. The world and the verdict** — tighten the verdict's handoff into chapter 14, test the 3D on real laptops and phones, drop shadow resolution and walker count on weak GPUs, and confirm the 2D fallback is clean.

**3. Honest "I'm…"** (`js/main.js`) — a small note in any chapter that is locked to one group, e.g. "This chapter shows ages 15–24."

**4. The demo and the book** — the 5-minute run-of-show, a backup recording, our questions for the TF, an implementation cheat sheet, and the process book: what changed since the first check, the new question list, screenshots.

---

## Copy and style rules

These are what keep sixteen sections sounding like one writer.

**Voice**
- Short sentences. One idea each. The data is dramatic enough that the writing doesn't have to be.
- Concrete over abstract: "50 minutes to 28," never "a significant decline."
- Numbers in words the way a person would say them: "4h13m," "65 minutes a day," "down 39%."
- Keep the case language — suspects, cleared, clues, the file — and never wink at it. No "elementary," no "the plot thickens."
- Never claim cause. "Moved together," "at the same time," "we can't say what replaced what."
- Second person only when the reader is actually doing something: guessing, dragging, picking their group.

**Type and color** (all tokens are in `css/base.css`; the full guide is `STYLEGUIDE.md`)
- Headlines Fraunces, with the SOFT axis raised — it's the melting clock in the type.
- Body IBM Plex Sans. Numbers and labels IBM Plex Mono.
- `--c-social` (pink) means socializing and **nothing else**, anywhere on the site. `--sand` means "you."
- Everything else in the day is muted. One bright thing per chart.
- Charts sit in frosted evidence cards on the world. Don't put a white box on the world.
- Annotate directly on the chart. Label line ends instead of using a legend.

**Accessibility — each of us does our own charts, not Mariah for all of us**
- A one-sentence text summary of what each chart shows, read by screen readers.
- Keyboard focus you can see on every slider, button and picker.
- Respect `prefers-reduced-motion`: show the end state, skip the animation.
- Never color alone to carry a meaning — pair it with a label or a shape.

---

## Requirements this covers

| Requirement | Where |
| --- | --- |
| Interactive D3 views | 2, 3, 4, 5, 6, 7, 8, 9, 10, 15 |
| Novel views | 1 world, 4 day morph, 10 pictogram, 11 scale, 12 clock lineup |
| Linked / coordinated views | 12 lineup drives the scale; 15 brushing across three panels |
| A narrative with a resolution | 1 → 14, the case closed |
| A final explorable view | 15, Your case file |
| Honest methods | 7's limit, 9's 2020 gap, 16 |
| AI as a short closing thought | 14, two sentences |

---

## Rules that keep us out of each other's way

- Pull before you start. Small commits, pushed often.
- Only edit the files you own. `index.html`, `js/main.js` and `css/base.css` are shared: say so in the group chat, then make the change in its own small commit. A new chapter needs a `<section data-chapter="…">` in `index.html` and a `<script>` tag — add both in one commit.
- New chapters go in the order in the table above. Don't reorder anyone else's.
- Test locally: `python3 -m http.server 8000`, then http://localhost:8000.

## How a chapter plugs in

```js
story.chapter('file', {
  init(el, data) { /* once, after data loads. el is the chapter's chart box */ },
  step(n, dir)  { /* text step n scrolled into view */ },
  age(code)     { /* reader changed "I'm…"; code like '103' */ },
});
```

Helpers: `story.series(age, activity, day)` gives minutes per day for 2003–2025 (`null` = no estimate, 2020 included). `story.avg(arr, [2024, 2025])` averages years. `story.you`, `story.ageName('103')` → `'15–24'`, `story.color('600024')`.

## Data cheat sheet (`data/atus.json`, minutes per day)

- `act[age][day][activity]` — ages `000` all, `103` 15–24, `020` 20–24, `031` 25–34, `038` 35–44, `042` 45–54, `049` 55–64, `065` 65+. Days `00` all, `19` weekdays, `16` weekends.
- `par['13'|'01'][day][activity]` — parents of a child under 18 / no kids at home.
- `who["who|age|day"]` — waking minutes by companion, from 2010. `01` alone, `02` with others, `43` friends, `24` family at home, `42` family elsewhere, `03` spouse or partner, `35` coworkers, `36` own kids.
- Socializing is `600024`. TV is `600025`. Games and computer use for fun is `600058` (not published for 15–24). Other leisure is `600023 − 600024 − 600025`.
- The 14 activities in `story.DAY_PARTS` add up to 24 hours. They're meant to.
