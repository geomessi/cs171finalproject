# Prototype V1 work plan

**Story: The Case of the Shrinking Hour.** In 2003, young Americans spent about an hour a day just being with other people. Something has been eating into it. Readers guess how much is left (36 minutes, down 39%). The usual suspects are cleared: work and TV both fell, so young people got time *back* and still spent less of it together. The clues point somewhere quieter: the weekdays emptied out, and more of the day is spent alone. Then the reader puts a day on the scale and watches it tip. The verdict: nobody stole the hour; bit by bit, more of the day was spent alone.

**Chapter order:** Hero → Make a guess → The case (the drop) → The suspects (where the time went) → Clue 1 (weekdays) → Clue 2 (alone) → Weigh it (the scale) → The verdict (the clock). Chapter IDs didn't change, so your scripts still attach the same way.

**Branch:** we collect everything on `main` (the live site). Work on your own branch and open a pull request; Cloudflare comments a preview link on it.

The page skeleton is already in place: `index.html` has every chapter with its text, the "I'm…" age menu, and a dashed placeholder box where each chart goes. Each package owns its own files, so three people can push to the same branch without merge conflicts.

| Package | Owner | Chapters | Files you own | Covers requirement |
| --- | --- | --- | --- | --- |
| 1. The opening | Mariah | Make a guess · The case · Clue 1 (weekdays) | `js/ch-guess.js`, `js/ch-drop.js`, `js/ch-weekdays.js`, `css/opening.css` | Functional D3 #1, one draft |
| 2. Where the time went | Chloe | The suspects · Clue 2 (alone) | `js/ch-moved.js`, `js/ch-alone.js`, `css/moved.css`, `scripts/`, `data/` | Functional D3 #2, data pipeline, one draft |
| 3. The world, the scale, the melting clock | Georgia | Hero · Weigh it · The verdict | `js/world.js`, `js/clock.js`, `js/balance.js`, `css/clock.css`, `css/balance.css` | Novel view, process book assembly |

## Package 1 · The opening (Mariah)

1. **Guess, then reveal** (`ch-guess.js`): a slider where readers guess daily socializing minutes for their age group, then a reveal of the real 2024–25 number.
2. **The drop, FUNCTIONAL D3 #1** (`ch-drop.js`): socializing by age, 2003–2025, stepped with scroll. 15–24 draws first (59 → 36 min), other ages fade in, then the reader's own group is highlighted. Start from the trend chart in `prototype-a/index.html`.
3. **It's the weekdays, DRAFT**: a dumbbell chart of weekday vs. weekend socializing, 2003–04 vs. 2024–25. Design it in the process book; build it if there's time.

Done when the guess works, the trend chart animates through all four steps, and the weekday design is in the process book.

## Package 2 · Where the time went (Chloe)

1. **Data pipeline (do this first, it's short):** run `scripts/fetch_atus.py` and confirm it reproduces `data/atus.json`. Then add ages 20–24 (`020`) to the activity series and the games/computer series (`600058`) where BLS publishes them, so the chapter 4 and 5 numbers have a source. Commit the script change and the new JSON together.
2. **Where the time went, FUNCTIONAL D3 #2** (`ch-moved.js`): diverging bars of change since 2003–04, stepped with scroll (work −18, TV −34, sleep +39, other leisure +29), plus a Play control that animates the end year from 2005 to 2025. Start from the "What moved" chart in `prototype-a/index.html`.
3. **Alone or together, DRAFT**: alone vs. with others for ages 20–24, 2010–2025. Prototype B's line chart is a working starting point.

Done when the pipeline reruns cleanly, the diverging chart steps and plays, and the alone design is in the process book.

**Chloe, heads-up:**
- The suspects chapter's steps are now: step 1 work cleared (−18), step 2 TV cleared (−34, "so young people got time back"), step 3 the trail (sleep +39, other leisure +29, chores +18). Chores is new, so show it in the chart.
- Clue 2 is your line chart again in a normal evidence card: alone vs. with others, ages 20–24, 2010–2025. The balance scale now has its own chapter right after yours ("Weigh it"), so your chart sets up the trend and the scale makes it felt.

## Package 3 · The world and the melting clock, novel view (Georgia)

1. **The world** (`world.js`, done): a sunlit, painterly three.js scene behind the whole page. An ultramarine sky with pink clouds, soft dunes, a mirror lake, and a giant clock floating over a dune at the water's edge. The camera moves with the story: low and wide in the hero, pulled back and dimmed behind the evidence chapters, high over the clock for the verdict.
2. **The melting clock** (`world.js` + `clock.js`, done): a real clock face (cream, grooves, bezel, hour numerals, hands) showing one average day with exact regions. Socializing is the pink region at the front; the hands bracket it; the front slumps toward the water and drips pink into the lake as minutes are lost; tiny dark walkers with long shadows encode time alone. The verdict chapter has Play, a year slider and live numbers. Without WebGL, `clock.js` draws the 2D clock instead.
3. **The balance scale** (`balance.js`, done): its own chapter, "Weigh it," between Clue 2 and the verdict. A painted panel in the world's style: one pan holds waking hours with other people, the other hours alone; tilt and the 24 tiny figures follow the minutes. Steps go 2010–11 → 2024–25, a slider covers single years, and the "I'm…" menu switches age band.
4. **Distant clocks** (`world.js`, done): the background is only clocks. Smaller clocks floating over the far dunes show every other age group's day for the same year.
5. **Process book:** team member list, the V1 screenshots, drafts from all three packages, and the novel-view rationale (mood board → a world you scroll through).

## Rules that keep us out of each other's way

- Pull before you start, push small commits often: `git pull` then `git push`.
- Only edit the files you own. `index.html`, `js/main.js` and `css/base.css` are shared. If you need a change there (new step text, a new color), tell the team first, then make the edit in its own small commit.
- Use the colors and fonts in `css/base.css` (`var(--c-social)`, `var(--accent)`, `var(--display)` and so on) so the chapters look like one piece.
- Test with a local server: `python3 -m http.server 8000`, then open http://localhost:8000.

## How a chapter plugs in

Each chapter file registers itself. `main.js` calls the hooks:

```js
story.chapter('drop', {
  init(el, data) { /* once, after data loads. el is the chapter's chart box */ },
  step(n, dir)  { /* text step n scrolled into view; dir is 'down' or 'up' */ },
  age(code)     { /* reader changed "I'm…"; code like '103' */ },
});
```

Helpers: `story.series(age, activity, day)` returns minutes per day for 2003–2025 (`null` = no estimate, including 2020). `story.avg(arr, [2024, 2025])` averages years. `story.you` is the reader's age code, `story.ageName('103')` is `'15–24'`, `story.color('600024')` is the socializing color.

## Data cheat sheet (`data/atus.json`, minutes per day)

- `act[age][day][activity]`: ages `000` all, `103` 15–24, `031` 25–34, `038` 35–44, `042` 45–54, `049` 55–64, `065` 65+. Days `00` all, `19` weekdays, `16` weekends.
- `par[13|01][day][activity]`: parents of a child under 18 / no kids at home.
- `who["who|age|day"]`: waking time by companion, from 2010. `01` alone, `02` with others, `43` friends.
- Activity codes and names are in `story.ACTIVITIES`. The 14 in `story.DAY_PARTS` add up to 24 hours.
