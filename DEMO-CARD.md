# Demo card — keep this open

One page for the room. Run of show is in `DEMO.md`; this is the part you'll want mid-sentence.

---

## If something breaks

| What you see | What to do |
| --- | --- |
| The 3D world never appears | It falls back to a flat clock on its own. Say "no WebGL on this machine, here's the 2D version" and keep going. |
| Everything is stuttering | It's already lowering its own quality. Don't touch anything, keep talking, scroll slower. |
| A chart is blank | Scroll up past it and back down — chapters draw on scroll position. |
| The slider doesn't move the other two | Reload the page. Don't debug it live. |
| Page won't load at all | Switch to the backup recording. |

**Never debug in front of them.** "That's a bug — here's what it does when it works."

---

## Every number, verified

All from `data/atus.json`. "2003–04" and "2024–25" are two-year averages. Minutes per day.

**Ages 15–24, what moved**

| | 2003–04 | 2024–25 | Change |
| --- | --- | --- | --- |
| Socializing | 59 | 36 | **−23 (−39%)** |
| Watching TV | 143 | 109 | −34 |
| Working | 158 | 140 | −18 |
| Sleep & personal care | 598 | 637 | +39 |
| Other leisure | 131 | 161 | +29 |
| Chores | 51 | 68 | +18 |
| Eating & drinking | 59 | 71 | +11 |
| *Total leisure* | *333* | *305* | *−27* |

**Socializing by age** — 15–24 −23 · 25–34 −12 · 35–44 −6 · 45–54 −6 · 55–64 −5 · 65+ −12 · all ages 46 → 35

**Weekdays vs. weekends, 15–24** — weekdays 50 → 28 · weekends 80 → 54

**Parents vs. no kids at home**

| | 2003–04 | 2024–25 | Change |
| --- | --- | --- | --- |
| Parents, all days | 44 | 38 | −6 |
| No kids, all days | 47 | 34 | −13 |
| Parents, weekends | 71 | 67 | −4 |
| No kids, weekends | 69 | 52 | −17 |

**Who we spend time with** (all ages, 2010–11 → 2024–25) — friends 65 → 32 · coworkers 148 → 108 · own kids 94 → 75 · family elsewhere 61 → 43 · **spouse or partner 158 → 157**

**Friends, year by year** — 2010: 65 · **2019: 43** · 2021: 34 · 2025: 33. The 2019 number is the one that matters: the slide started before the pandemic.

**Alone vs. with others, ages 20–24** — alone 4h13m → 5h37m · with others 9h53m → 7h56m · peak alone 2021, 6h44m

**Games and computer use for fun** — ages 20–24: 29 → 60 · all ages: 19 → 36 · all-ages total leisure: 309 → 307 (flat)

---

## Questions they will ask

**"Why weigh alone against together, rather than work against leisure?"**
Because for young adults both work *and* leisure fell. Neither is the story. The split that actually moved is who you're with.

**"Isn't this just the pandemic?"**
No. Time with friends was already down from 65 minutes to 43 by 2019, before anything closed. The pandemic finished a decade-long slide. Alone time did spike in 2021 and has come down since — and it stopped well above 2010.

**"Why is there no 2020?"**
BLS suspended in-person collection and didn't publish annual estimates for that year. We mark the gap rather than drawing a line across it.

**"Why 20–24 in some chapters and 15–24 in others?"**
BLS doesn't publish the who-with series or the games series for 15–24, but does for 20–24. Every chapter that switches says so on the page.

**"Can you say screens caused this?"**
No, and we say so on the page. The survey records what you were doing, not what you would have done instead. Two lines moved in opposite directions over twenty years. That's the whole claim.

**"Why two-year averages?"**
Single-year estimates get noisy for narrow subgroups. Pooling two years is standard practice with this survey.

**"Why can't the explore view cross age with parent status?"**
BLS doesn't publish that crosstab. It would need the IPUMS microdata, which is on our list for next time.

**"What makes the clock a visualization rather than decoration?"**
Every wedge angle is exact — minutes out of 1,440. The melt is proportional to minutes lost but drawn strictly *outside* the wedge, so the metaphor can never change a quantity you're reading. Same rule on the scale: tilt and figure count are both proportional to the real minutes.

**"How did you use AI?"**
We directed it through the implementation, read the code it produced, and checked every number in the copy against the data ourselves. The story, the design and the numbers are ours.

**"What would you do with more time?"**
Check the trend against the General Social Survey, which has asked about social evenings since 1972, and bring in the ATUS well-being module so we can say what the lost hour was worth, not just that it's gone.

---

## Two things to fix when you get a minute

- Clue 2 copy says the 2021 peak was **6h45m**; the data says **6h44m** (404 minutes). One-word fix in Chloe's chapter.
- The verdict now hands off to Mariah's closing chapter. Until that chapter exists, the story ends on a promise. If it hasn't landed the day before, say so and I'll restore the old ending.
