# Prototype V3 — the work plan

Branch: `prototype-3`, off `prototype-2`. Preview at **https://prototype-3.cs171finalproject.pages.dev**.
Pull requests go **into `prototype-3`**. `main` stays frozen as the graded V1.

```
git fetch && git checkout prototype-3 && git pull
git checkout -b yourname/what-youre-doing
# ...commit...
git push -u origin yourname/what-youre-doing
```

---

## 1. We found the ending

Thara couldn't name a single takeaway and listed six. Michael said the closing line made no sense. They're both describing the same hole: **we had findings, not a finding.**

There is one, and it was sitting in the who-with data the whole time. Sort every kind of company by **how much of a decision it takes to see that person**, then look at how much time we lost with each, 2010–11 to 2024–25, all ages:

| Who | How much choosing it takes | 2010–11 | 2024–25 | Change |
| --- | --- | --- | --- | --- |
| Spouse or partner | None. They're in the room. | 158 min | 157 min | **−1%** |
| Family in the household | None. Same house. | 262 min | 243 min | **−7%** |
| Coworkers | Assigned — but you have to go there | 148 min | 108 min | **−27%** |
| Family elsewhere | A choice, with obligation behind it | 61 min | 43 min | **−30%** |
| Friends | Pure choice. Nobody makes you. | 64 min | 32 min | **−51%** |

It's a ladder, and it only goes one way. **The more a relationship depends on somebody deciding, the more of it is gone.** Time with the people who are simply there is almost exactly where it was twenty years ago. Time with the people you have to choose has halved.

Grouped: hours with people you live with, 420 → 400, **−5%**. Hours with people you choose, 124 → 74, **−40%**.

**This is the aha, and it reorganizes everything else we found:**
- **It explains the parents finding.** Parents lost 6 minutes, people with no kids lost 13, and on weekends 4 against 17. Parents didn't hold onto their social lives through willpower — their company is structural. People without kids at home have to choose every social hour, and that's precisely the hour that evaporated.
- **It explains the weekdays.** Weekday socializing fell 44%, weekends 33%. The unplanned Tuesday evening is the most optional hour in the week.
- **It answers Michael's question about phones.** He kept asking where the internet was, and "the survey doesn't ask" is a dodge. This isn't. We can't convict phones — but we *can* say exactly which hours disappeared, and they are the ones that needed a decision. That's a real answer to the question he actually asked.
- **It gives the verdict something earned to say.** Not "the hour dissolved," which he found baffling. **Nobody stole the hour. We just stopped choosing it.**

Everything below exists to deliver that sentence.

---

## 1b. The story, in the order it's told

The ladder is the evidence. This is the story it belongs to — write every chapter toward it.

**In one line:** we got the hour back and didn't notice, because the time returned to us went into the parts of the day that run themselves — and so did the only company we kept.

1. In 2003 young Americans spent about an hour a day with other people. Now it's 36 minutes.
2. The obvious explanation is that they got busier. **They didn't.** Work fell 18 minutes a day, TV fell 34 — **52 minutes handed back** — and socializing fell anyway.
3. So we spent it on fun? **No.** Total leisure fell too, 333 to 305. The returned time went to sleep and personal care (+39) and chores (+18). *We got the better part of an hour back and spent it sleeping and tidying up.*
4. Then the ladder: the company that survived is the company that takes no arranging.
5. **The ending.** It isn't that we stopped liking each other. Seeing people used to take no arranging — somebody was around, you were bored, you walked past a door. Now every hour with a friend has to be proposed, agreed and scheduled, and the things that must be arranged are the first to go. That's what *we should get dinner sometime* means.
6. **The verdict: nobody stole the hour. It just stopped happening by itself.** Nothing had to take it. Nobody has to steal time that nobody is defending.
7. **The AI close**, now earned: AI is about to hand back a lot of hours, and the last twenty years are a clean record of where returned time goes — wherever no decision is required. *The next hour you get back won't go to anyone unless you decide it does.*

### Two rules that came out of this

**Give every number its human size.** "23 minutes a day" is nothing; "six full days a year" is something. Use these, they're verified:

| Finding | In human time |
| --- | --- |
| 15–24 socializing, −23 min/day | **six full days a year** |
| 20–24 with other people, −117 min/day | **a month a year** |
| Friends, all ages, −32 min/day | **eight days a year**, leaving under one evening a week |

**Don't promise a culprit.** The honest answer is that there isn't one, so the hero and the suspects chapter now say so early. An ending that reveals "nobody did it" only works if we stopped selling a reveal.

**One caveat we keep on the page:** ordering company by "how much arranging it takes" is our framing, not a BLS category — and physical closeness would order it the same way. That's why step 3 above matters: the activity half of the finding (sleep and chores grew, leisure fell) is independent evidence that proximity can't explain.

---

## 2. One visual system, three motifs

Michael's sharpest note: *"This is the same thing as this, but you represent this in a completely different way… shouldn't you represent them in analogous ways?"* And: the novelty is in "the color scheme and background," the charts themselves "aren't all that novel."

He's right on both, and they have one fix. Everything on this site is built from three motifs, recombined:

- **The circle** — a day. Every clock on the site means the same thing: 1,440 minutes, with socializing as the pink wedge. The angle is always exact.
- **The figure** — a person, or one unit of time with a person. Always the same little walker from the 3D world.
- **The melt** — what's gone. Always proportional to minutes lost, always drawn *outside* the quantity it describes, so the metaphor can never distort a number you're reading.

Two charts comparing the same thing use the same motif. Two charts comparing different things don't. That's the principle, and it's what turns a pile of charts into a visual language.

**There are no generic line charts left in the story.** Every one has been replaced by a view built from these motifs. The only conventional charts that survive are inside the case file at the end, where the reader is exploring rather than being told something — and that's the right place for a familiar form.

---

## 3. The spine: 16 sections → 12

| # | Chapter | The view | Status | Owner |
| --- | --- | --- | --- | --- |
| 1 | Hero | The 3D melting clock world | Built | Georgia |
| 2 | Make a guess | Drag the 2003 wedge to where you think it is now | **Rework** | Mariah |
| 3 | The case | One clock, the wedge retreating, a tide mark left for every year | **Redesign** | Mariah |
| 4 | A day can't grow | The 24-hour column morphing 2003 → 2025 | Built | Mariah |
| 5 | The suspects | A police lineup: each block of the day stands with its alibi | **Redesign** | Chloe |
| 6 | Then it has to be the kids | Two clocks side by side, melting at different speeds | **Redesign** | Chloe |
| 7 | The day went quiet | The balance scale | Built, absorbs Clue 2 | Georgia |
| 8 | **The hours you have to choose** | **The ladder — the aha** | **New** | Mariah |
| 9 | Everyone's clock is melting | Six clocks, one per age group, on one year | Built, needs fixing | Georgia |
| 10 | The verdict | The 3D clock melts into the lake | Built, new ending | Georgia |
| 11 | Your case file | The explorable tool | Built | Chloe |
| 12 | Methods and notes | Sources, limits, credits | Built | Chloe |

### What happened to the cut sections

Nothing is thrown away. Five chapters became parts of other chapters:

| Was | Now |
| --- | --- |
| Clue 1, the weekday dumbbell | Lives in the case file, which already has a day-type picker, plus one sentence in the scale chapter. The chart Michael called "just BLS charts" is gone; the TF's question is still answered. |
| Clue 2, alone vs. together lines | Absorbed by the balance scale, which shows the same thing physically. A line chart and a scale were telling one story twice. |
| Clue 3b, the who-with slope | Becomes the ladder. It was always this finding — just drawn as a slope chart that didn't say what it meant. |
| The friends pictogram | Becomes the bottom rung of the ladder. Both testers liked it; now it lands at the moment it proves something. |
| The closing | Folds into the verdict as its last step. |

**Mariah and Chloe:** your charts aren't being deleted, they're being re-encoded, and you each keep the ones you built. Say so if you disagree with any of it — especially the weekday dumbbell, which is the only outright cut.

---

## 4. The new and redesigned views

### 2 · Make a guess (Mariah)

Both testers guessed nearly right — "about an hour" against 59, and 40 against 36 — so the reveal landed flat. Michael also couldn't tell whether a guess was wanted, and said outright: *"I wanna drag the clock in to reveal the real."*

- The clock opens with the **2003–04 wedge already drawn and labeled**, so there is no ambiguity about which year is being guessed. The reference is on screen.
- The reader **drags the edge of that wedge inward** to where they think it is today. Visible handle, "drag me," instruction on screen the whole time.
- Reveal animates their wedge to the real one and names the gap.

Guessing a shrinkage against a visible reference is much harder to nail than guessing "about an hour," so the reveal has somewhere to go.

### 3 · The case (Mariah)

Replaces the line chart of socializing by age. One clock face, the reader's own age group, scrubbing 2003 → 2025. As each year passes the pink wedge narrows and **leaves a faint tide mark where its edge used to be**. By 2025 there are twenty-two of them, stacked like a receding shoreline.

Keep: the big number, 59 → 36. Drop: the all-ages comparison, which chapter 9 now owns. Mark 2020 as an empty frame, not a skipped year.

### 5 · The suspects (Chloe)

Replaces the diverging bar chart, and absorbs the phones chapter. A literal police lineup, which is what the chapter has been claiming to be all along. Each block of the day stands as a figure against a height chart, holding its alibi:

- **Work — cleared.** 18 fewer minutes a day.
- **TV — cleared.** 34 fewer.
- **Sleep, chores, other leisure — all grew.** They gained the time work and TV gave up.
- **Games and computer use — the one that didn't walk.** 29 minutes a day to 60 for 20–24-year-olds. The only block that more than doubled.

Then the twist the whole chapter exists for: **the phone isn't in the lineup, because the survey never asked.** ATUS has no phone category. Phone time is scattered through every figure standing there. We can't convict it, and we say so on the page — then promise the reader that we *can* tell them which hours went missing, which is chapter 8.

Keep the scrub-through-the-years control Michael liked ("Oh, this is cool. So you see the progression?") and put the semantics on the chart: **change since 2003–04, as of [year]** — the sentence we couldn't produce when he asked.

### 6 · Then it has to be the kids (Chloe)

Replaces the dumbbell. Two clocks side by side — parents of a child under 18, and people with no kids at home — both melting as the years run, the childless one melting twice as fast. Weekends as the headline, where it's starkest: **−4 minutes against −17**. Toggle for weekdays and all days.

Same grammar as chapters 3 and 9, which is the point: same comparison, same motif.

### 8 · The hours you have to choose (Mariah) — the aha

The new chapter, and the one everything else is built toward. Five rungs, ordered by how much of a decision it takes to see that person. Each rung is a row of figures, one per ten minutes a day. Run the years and watch them leave.

1. **Spouse or partner** — 158 → 157. Essentially nobody leaves.
2. **Family in your household** — 262 → 243.
3. **Coworkers** — 148 → 108. Say plainly that this is where the office went.
4. **Family elsewhere** — 61 → 43.
5. **Friends** — 64 → 32. Half the row walks off. This is the existing pictogram, now in the place where it proves something.

The payoff is that the ladder is monotonic — it only goes one way — and the reader sees it without being told. Then the line: *time with the people who are simply there is where it was. Time with the people you have to choose has halved.*

**Honesty, on the page:** the who-with series is published for all ages 15+, not by age group, and it starts in 2010. Both go in the caption, not just in methods.

### 7, 9, 10 · The scale, the lineup, the verdict (Georgia)

- **The scale** absorbs Clue 2 and becomes the whole of "the day went quiet." Alone 4h13m → 5h37m for 20–24s is shown by the pans, not by a line chart next to it.
- **The lineup** is now the only cross-age comparison on the site, which resolves the redundancy with chapter 3. It also needs the glitch Michael saw fixed, and an instruction, because he didn't understand what he was looking at.
- **The verdict** gets the ending the aha earned. The clock melts, and then: **nobody stole the hour. We just stopped choosing it.** The old closing section folds in here as the final step.

---

## 5. The patterns everybody follows

Both testers' biggest shared problem: **they didn't know what they were allowed to do.** Neither noticed the age selector. Both had to scroll back and forth to work out how to interact. On the scale, Michael said "So what am I doing here? What am I doing here?"

Georgia builds these once in `js/main.js` and `css/base.css` so we ship one version, not three:

- **`story.gapMark()`** — the "2020: no survey" band plus a dashed bridge, so the eye crosses the gap without losing the line. Chloe's `ch-alone.js` already does this well and is the model; **five other charts draw nothing at all**, which is why both testers tripped.
- **`.chart-howto`** — an instruction that is on screen whenever the chart is. Not in a step you scrolled past.
- **A standard year readout** — large, always visible. Thara said ours is often too small to find.
- **Slower autoplay**, with the option to scrub instead.

And the rules, for every chart without exception:

- One way to drive it. If scroll advances it, there's no slider; if there's a slider, scroll doesn't fight it. Michael hit two drivers on one animation and it confused him.
- The chart says what it encodes, on the chart: "change since 2003–04," "each figure ≈ ten minutes a day."
- Anything that looks clickable is clickable. Thara kept trying to select things we hadn't made selectable.
- Any gap in the data is marked where it happens.

---

## 6. Copy

- **One takeaway, not six.** Thara listed six because our setup lines are styled like conclusions. Each chapter gets one promoted sentence; the rest is demoted.
- **Less drama.** "These writings are a little dramatic… make it a little bit more straight to the point." Keep the case language — it's the spine — lose the flourishes.
- **Kill the two lines that failed.** "The question was never where did the hour go. It's who was holding it" (he said: "This makes no sense") and "dissolved into a day that is easier and easier to spend alone" ("Like, what the heck?"). Both do a poetic turn the reader hasn't been set up for. The aha replaces the work they were trying to do.
- **Define socializing early.** Thara raised that younger readers may count social media. One line up front, the detail in methods.

---

## 7. Packages

**Mariah — the opening and the aha**
1. Rework the guess (`ch-guess.js`)
2. Redesign the case as the tide-mark clock (`ch-drop.js`)
3. Keep "a day can't grow"; add the gap mark and an instruction
4. **Build the ladder** (`ch-ladder.js`), absorbing the friends pictogram
5. The copy pass across the whole site: one takeaway per chapter, tone, the two failed lines, the socializing definition

**Chloe — the suspects and the tools**
1. Redesign the suspects as the police lineup, absorbing phones (`ch-moved.js`, retire `ch-games.js`)
2. Redesign the kids as twin melting clocks (`ch-parents.js`)
3. Fold the weekday finding into the case file and make the day-type picker findable (`ch-file.js`)
4. Retire `ch-who.js` and `ch-weekdays.js`, handing their data to the ladder and the case file
5. **Confirm the pipeline is complete** — `scripts/fetch_atus.py` reruns clean and reproduces `data/atus.json` for every series we now use, including the who-with codes the ladder needs. Note anything hand-edited. This is a V3 requirement in its own right.
6. Methods section updated for the new structure

**Georgia — the system, the world, the submission**
1. Build the four shared patterns above
2. Make the age selector impossible to miss — out of the top bar, into the story at the first chapter where it changes anything
3. The scale absorbs Clue 2
4. Fix the lineup: the glitch, the instruction, the reframe as the only cross-age view
5. The verdict's new ending, with the closing folded in
6. Reorder `index.html` — shared file, one commit, announced to both of you first
7. Process book: all three names, the two testing sessions, what we changed because of them, and the innovative-visualization section the brief asks for
8. The zip and the single submission

---

## 8. If we run short

Build in this order. Everything in Tier A has to be in; Tier B is what we drop without the story breaking.

**Tier A — the story doesn't work without these**
The ladder (ch. 8). The verdict's new ending. The four shared patterns. The age selector. The guess rework. The cuts and the reorder. The copy pass.

**Tier B — real improvements, droppable**
The tide-mark clock (ch. 3) — if it slips, the current line chart stays with a gap mark and the all-ages step removed. The police lineup (ch. 5) — if it slips, the diverging bars stay with the phones twist written into the copy. The twin clocks (ch. 6) — if it slips, the dumbbell stays.

Note what that means: **if everything in Tier B slips, we still ship the aha, and the story still lands.** That's deliberate.

---

## 9. Before we submit

The whole lesson of the testing is that we can't see our own interface any more. One of us finds somebody who has never seen it, hands them a laptop, and **says nothing for five minutes**. If they can't say what the story was, we're not done.
