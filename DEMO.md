# The final project check — run of show

Five minutes of demo, then questions. Owner: Georgia. Everyone reads this before the meeting.

**Before we walk in**
- The preview is open and already scrolled to the top: https://prototype-2.cs171finalproject.pages.dev
- A second tab has the backup screen recording, in case the 3D doesn't start on the room's machine.
- Laptop plugged in. Low power mode off — the world drops its own quality when frames get slow, but it looks better if it doesn't have to.
- Close other tabs. The world is a live 3D scene behind the page.

## Five minutes

**Do not scroll the whole story.** Sixteen scroll-driven chapters take far longer than five minutes
to get through, and rushing them makes the site look broken. Jump between these eight beats with the
nav links at the top, and scroll only *inside* a beat. Say once, early: "I'm skipping ahead — the
full read is about fifteen minutes."

| Time | Beat | Who | How you get there |
| --- | --- | --- | --- |
| 0:00–0:20 | **The premise** | Georgia | Top of the page. "In 2003, young Americans spent about an hour a day just being with other people. This is that hour, as a clock." |
| 0:20–0:40 | **The guess** | Mariah | Nav → Guess. Ask, wait, reveal 36 minutes, down 39%. They'll answer in about three seconds. |
| 0:40–1:05 | **The case** | Mariah | Nav → The case. One scroll. 59 to 36, every group lost some, young people most. |
| 1:05–1:50 | **The suspects** | Chloe | Nav → Suspects. Work cleared, TV cleared, then the kids: parents lost 6, people with no kids lost 13. "The people with the least free time kept the most of their social lives." |
| 1:50–2:20 | **The empty chair** | Mariah | Nav → Clue 3. Friends 65 to 32, and already 43 by 2019. "The pandemic didn't start this." |
| 2:20–3:00 | **The lineup** | Georgia | Nav → Lineup. Drag the slider, then say the scale above and the verdict below are on that same year. That's the linked-views beat — it's worth the time. |
| 3:00–3:30 | **The verdict** | Georgia | Nav → Verdict. Hit Play and talk over it; the melt runs about nine seconds on its own. |
| 3:30–4:20 | **Your case file** | Chloe | Nav → the last chapter. Pick a group, pick a day type, brush a range. "This is where the reader takes over." |
| 4:20–4:40 | **What's missing** | Georgia | No clicking. Name the gaps before they do (below). |

That leaves about twenty seconds of slack, which is the right amount. If you're behind, cut the
case (0:40) — the guess already delivers the number.

**Timings worth knowing**
- The verdict's Play runs the clock 2003 → 2025 in roughly nine seconds. Start it, then talk.
- The lineup's Play takes about seven. Prefer dragging the slider: it's faster and it shows the link.

**Rules for the demo**
- One person drives the laptop the whole time. The others talk.
- Inside a beat, scroll slowly. Chapters respond to scroll position, and racing through makes the
  story unreadable even though it doesn't break.
- Don't narrate the interface ("now I'll click here"). Say what the data says.
- If something breaks, say "that's a bug, here's what it does when it works" and move on. Never
  debug live.

## What we say is still missing

Better that we name these than that the TF finds them.
- Accessibility pass isn't finished on every chart.
- The explorable ending has no alone-vs-together data for the parent groups, because BLS doesn't publish it.
- We haven't tested the 3D world on every device yet; there's a 2D fallback when WebGL is missing.

## Questions for the TF

1. Is the parents finding strong enough to carry its own chapter, or does it read as a tangent?
2. Does the games chapter read as honest caution, or as implying cause and then hedging?
3. Sixteen sections — too long? Where does it sag?
4. Do five novel views read as ambitious, or unfocused?
5. For the writeup, how much methods detail do you want on the page itself rather than in the process book?

## Implementation cheat sheet

Be ready to answer these without opening the code.

**The stack.** Static site, no build step. HTML, CSS, D3 v7 and three.js r149 from a CDN. Cloudflare Pages deploys every branch; `main` is the graded V1, `prototype-2` is this.

**The data.** `scripts/fetch_atus.py` pulls the BLS American Time Use Survey published time series and writes `data/atus.json` — minutes per day, 2003–2025, by age, by day type, by parent status, and waking time by who you were with (from 2010). No 2020 estimates: BLS didn't publish them, so the gap is real and we mark it. "2003–04" and "2024–25" are two-year averages, which is also what BLS recommends for single-year noise.

**How a chapter works.** `js/main.js` is a small runtime. Each chapter registers `init`, `step`, `age` and `year` hooks. A scroll listener finds the last text step whose top has passed the middle of the screen and calls `step(n)`. It's position-based, not edge-based, so scrolling fast skips to the right state instead of missing steps.

**The linked views.** The lineup, the scale and the verdict share one year through `story.setYear(y, 'who-moved-it')`. Whoever the reader touches broadcasts; the others get `year(y)` and follow. The scale holds at 2010 for earlier years because its data starts there.

**The novel views.** The world is a three.js scene: a sunlit plain, a lake, and a clock whose face is a canvas texture redrawn per year. The wedge angles are exact minutes. The melt is a vertex deformation that folds the front of the face over the plinth edge, scaled by minutes lost since 2003–04 and smoothed over three years. The walkers are one instanced mesh; the share of them walking alone is the real share of waking time spent alone. The lineup is SVG, six faces on one slider.

**Performance.** The world picks a quality tier from the device (cores, memory, screen) and sets pixel ratio, shadow map size and walker count. A watchdog measures frame rate and steps quality down twice if frames are slow. Without WebGL the whole thing falls back to a 2D SVG clock.

**What the AI wrote.** We directed an AI assistant through the build, reviewed the output, and checked every number in the copy against `data/atus.json` ourselves. The design decisions, the story and the numbers are ours.

## Still to do before the meeting

- [ ] Test the world on a real laptop and a real phone (the only check that can't be done in a headless browser)
- [ ] Record the backup walkthrough (screen recording, scroll the whole story once, 3 minutes, no audio needed).
- [ ] One full rehearsal with all three of us on the preview link.
