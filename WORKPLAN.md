# Prototype V1 work plan

**Story:** Young adults aren't just socializing less; they're spending their time differently.

**Branch:** everything goes on `Prototype1`. Preview: https://prototype1.cs171finalproject.pages.dev (Cloudflare builds every push).

The page skeleton is already in place: `index.html` has every chapter with its text, the "I'm…" age menu, and a dashed placeholder box where each chart goes. Each package owns its own files, so three people can push to the same branch without merge conflicts.

| Package | Owner | Chapters | Files you own | Covers requirement |
| --- | --- | --- | --- | --- |
| 1. The opening | _____ | 1 Guess · 2 The drop · 3 Weekdays | `js/ch-guess.js`, `js/ch-drop.js`, `js/ch-weekdays.js`, `css/opening.css` | Functional D3 #1, one draft |
| 2. Where the time went | _____ | 4 Where it went · 5 Alone or together | `js/ch-moved.js`, `js/ch-alone.js`, `css/moved.css`, `scripts/`, `data/` | Functional D3 #2, data pipeline, one draft |
| 3. The melting clock | _____ | Hero · 6 The clock | `js/clock.js`, `css/clock.css` | Novel view, process book assembly |

## Package 1 · The opening

1. **Guess, then reveal** (`ch-guess.js`): a slider where readers guess daily socializing minutes for their age group, then a reveal of the real 2024–25 number.
2. **The drop, FUNCTIONAL D3 #1** (`ch-drop.js`): socializing by age, 2003–2025, stepped with scroll. 15–24 draws first (59 → 36 min), other ages fade in, then the reader's own group is highlighted. Start from the trend chart in `prototype-a/index.html`.
3. **It's the weekdays, DRAFT**: a dumbbell chart of weekday vs. weekend socializing, 2003–04 vs. 2024–25. Design it in the process book; build it if there's time.

Done when the guess works, the trend chart animates through all four steps, and the weekday design is in the process book.

## Package 2 · Where the time went

1. **Data pipeline (do this first, it's short):** run `scripts/fetch_atus.py` and confirm it reproduces `data/atus.json`. Then add ages 20–24 (`020`) to the activity series and the games/computer series (`600058`) where BLS publishes them, so the chapter 4 and 5 numbers have a source. Commit the script change and the new JSON together.
2. **Where the time went, FUNCTIONAL D3 #2** (`ch-moved.js`): diverging bars of change since 2003–04, stepped with scroll (work −18, TV −34, sleep +39, other leisure +29), plus a Play control that animates the end year from 2005 to 2025. Start from the "What moved" chart in `prototype-a/index.html`.
3. **Alone or together, DRAFT**: alone vs. with others for ages 20–24, 2010–2025. Prototype B's line chart is a working starting point.

Done when the pipeline reruns cleanly, the diverging chart steps and plays, and the alone design is in the process book.

## Package 3 · The melting clock (novel view)

1. **The melting clock** (`clock.js`): one average day as a 24-hour clock face, with exact wedges per activity and socializing as the one bright wedge. As scroll moves the year from 2003 to 2025, the socializing wedge shrinks (59 → 36 min for 15–24), its lost minutes drip off the rim into the wedges that grew (sleep +39, other leisure +29), and the rim sags under it. A still 2003 clock sits in the hero; the scroll-driven version is chapter 6. Hover a wedge for its minutes. For V1 this can be functional or a strong draft; functional is better.
2. **Process book:** team member list, the V1 screenshots, drafts from all three packages, and the novel-view rationale (mood board → melting clock, and how the melt encodes data).
3. **Final pass:** check the whole page at phone width and fix anything broken in shared files with the team's OK.

Done when the clock renders from real data in the hero, chapter 6 melts on scroll, and the process book is complete.

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
