# Process book — the final project check

Copy-paste ready. Owner: Georgia.

## Our questions

Narrowed after the first check. Each one is now a chapter, so a question we can't answer with the data isn't on the list.

1. How much time a day do Americans spend socializing, and how has that changed since 2003?
2. Which age group lost the most, and did any group hold steady?
3. A day is always 24 hours — so when socializing shrank, what grew?
4. Did young people simply get busier? Did work or TV take the time?
5. Do parents, who have the least free time, show a bigger drop than people with no kids at home?
6. Did weekdays and weekends change differently?
7. Who are we losing time with — friends, family, partners, coworkers — and did that start before the pandemic?
8. How much of the day is now spent alone rather than with other people?
9. Can a reader see all of this for their own age group and their own kind of day?

Closing thought, not a question we can answer yet: in July 2026 the Bureau of Labor Statistics proposed adding questions about AI use to the survey, with collection starting in 2027. If it's approved, this dataset will eventually be able to show whether AI gives time back, and whether we spend it on each other.

**Dropped since the first check.** The constellation view: it was a look, not a question. Anything needing Kaggle's copy of the survey, which stops in 2015, when the BLS published series run to 2025.

## What changed since the first check

**We found a story instead of a set of charts.** The site is now a case file: every chapter either clears a suspect or adds a clue, and it ends in a verdict. If a chart does neither, it goes in the explorable ending rather than the story.

**Three findings the first version didn't have.**
- Parents of a child under 18 lost 6 minutes a day of socializing since 2003–04; people with no kids at home lost 13. On weekends, 4 minutes against 17. The people with the least free time kept the most of their social lives, which rules out "everyone just got busier."
- Time with friends was 65 minutes a day in 2010 and already down to 43 by 2019, before any lockdown. The pandemic finished a decade-long slide rather than starting it.
- One block of the day more than doubled: playing games and using a computer for fun, 29 minutes to 60 for 20–24-year-olds. We show it and say plainly that the survey records what people were doing, not what it replaced.

**A final explorable view.** "Your case file" lets the reader pick a group and a day type and see the hour then and now, what grew and shrank, and time alone — three panels that move together.

**Coordinated views, twice.** The lineup of six melting clocks shares its year with the balance scale and the verdict, so moving one moves all three. In the case file, brushing a year range in one panel filters the other two.

**Five novel views instead of one.** The 3D world, a 24-hour day that morphs from 2003 to 2025 while the total holds still, a pictogram of friends leaving a table, the balance scale, and the lineup.

**Honesty, on the page.** We mark the missing 2020 estimates instead of letting lines jump the gap, label chapters that only have data for one age group, name the 2021 peak in time alone, and say where the data stops short — BLS doesn't publish age crossed with parent status, and the who-with series starts in 2010.

## Design decisions worth recording

**Why a melting clock.** The mood board was Dalí. A clock is the obvious shape for a day, and a clock losing its shape is the obvious shape for a day losing something. We use his visual language — hard objects gone soft, raking light, empty space — rather than copying any painting.

**What is data and what is metaphor.** Every wedge angle is exact minutes out of 1,440. The melt — the sag, the drips, the pool — is proportional to minutes lost but sits outside the wedge, so the metaphor never changes a quantity the reader is reading. We say this on the page.

**One bright color.** Pink means socializing and nothing else, anywhere on the site. Sand means "you." Everything else in a day is muted, so the eye goes to the thing the story is about.

**Scroll position, not scroll events.** Each chapter's active step is the last one whose top has passed the middle of the screen, so scrolling fast lands on the right state instead of skipping it.

## How we worked

Three packages, one per person, each owning its own files so we could push to the same branch without stepping on each other. `index.html`, `js/main.js` and `css/base.css` are shared and change by small, announced commits. `main` holds the graded V1; this round lives on `prototype-2`, which Cloudflare previews at its own URL.

We directed an AI coding assistant through the implementation and reviewed what it produced: reading the code, checking the rendered result, and verifying every number in the copy against `data/atus.json` ourselves.
