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

## What the testing actually told us

Two sessions, Michael and Thara. Strip out taste and **two things both of them hit independently**:

1. **They didn't know what they were allowed to do.** Both had to scroll down and back to work out how to interact. Michael never noticed the age selector at all. On the scale: "So what am I doing here? What am I doing here?"
2. **The 2020 gap broke every line chart.** Thara lost track of which line connected across it. Michael asked "is this gap just COVID?" and we had to explain it out loud.

We checked all three of Michael's claims about the charts against the code:

| He said | What's actually true |
| --- | --- |
| "Is this cumulative, or per year?" on Round up the usual | Neither. Each bar is the change from 2003–04 to whatever end year the slider sits on. Correct encoding, never stated on screen. |
| Weekday socializing went "from 50 to four" | Misread. The row prints 50, 28, "22 min less", and "44%" — four numbers in one row, and he grabbed the wrong one. |
| The 2020 gap isn't explained | True, and worse than we thought. Only `ch-alone.js` draws the "2020: no survey" band. Five other time-series charts draw nothing. |

**His most damaging note isn't in his list of suggestions.** He decided in the first minute that phones and the internet were the culprit, and kept asking where they were — "Just Internet. And phones. Right?" We *do* have that chapter, but it arrives seventh, long after he formed the theory. A whodunit that ignores the reader's suspect feels rigged.

**His second: "the novelty is in the color scheme and background," the visualizations "aren't all that novel."** Worth noting which views he liked — the clock ("it's giving Dalí"), the drag-progression chart, the friends dots, the scale. Those are all the novel ones. What he called "just BLS charts" were the plain line and dumbbell charts. We didn't fail at novel views; the ordinary ones are carrying too much of the story.

---

## Four decisions already made

1. **Cut sections.** 16 is too long — "you told me this would take five minutes."
2. **Rework the guess**, don't just reword it. Both testers guessed nearly right (about an hour vs 59; 40 vs 36), so the reveal landed flat.
3. **Keep the mystery framing, but name his suspect early.** Phones move up beside work and TV.
4. **Everyone fixes their own charts.** The cross-cutting patterns are defined once, in shared code, so we don't invent three different gap treatments.

---

## The cuts: 16 sections → 13

| Cut | Why | Where the content goes |
| --- | --- | --- |
| **Clue 3b, the who-with slope** (`ch-who.js`) | Two consecutive Clue 3 chapters about who we spend time with, the second a standard line chart | Its one great line — spouse 158 → 157, "the people we lose are the ones we have to choose" — becomes the last step of the friends chapter |
| **Clue 1, weekdays** (`ch-weekdays.js`) | The chart Michael named as "just BLS charts," and the finding is already answerable in the case file, which has a day-type picker | The weekday/weekend finding moves into the case file and gets one sentence in Clue 2. The TF's question still gets answered — in an explorable view instead of a chapter |
| **The closing** (`close`) | A short text-only section right after the verdict | Folds into the verdict chapter as its final step |

**Mariah, these are both yours and that's the awkward part.** The weekday dumbbell works fine; it's the only chart a tester singled out as generic, and it's the cheapest section to lose. Say so if you disagree — this is the one call in the plan worth arguing about.

### And a redundancy to fix, not cut

Michael's sharpest structural note: *"This is the same thing as this, but you represent this in a completely different way… if you're showing basically the same point, shouldn't you represent them in analogous ways?"*

He's describing **the case** (socializing by age, lines over time) and **the lineup** (socializing by age, six clocks at one year). Same comparison, two encodings. The fix is to make them answer different questions:

- **The case** becomes about *your group's* line over time. Drop the "every age group lost some" step.
- **The lineup** becomes the only place we compare all six groups.

---

## Packages

### Mariah — the opening, the copy, the cuts

1. **Rework the guess** (`ch-guess.js`). The current prompt fails three ways: it's unclear a guess is wanted, unclear which year is being guessed, and the answer is guessable. New design, using Michael's own idea — he said "I wanna drag the clock in to reveal the real":
   - The clock shows the **2003–04 wedge already drawn and labeled**. So the time frame can't be ambiguous — the reference is on screen.
   - The reader **drags that wedge down** to where they think it is now. The handle is visible and labeled "drag me," with the instruction on screen the whole time, not in a step they scrolled past.
   - Reveal compares their wedge to the real one. Guessing a *shrinkage* against a visible reference is much harder to nail than guessing "about an hour."
2. **Fix the case chart** (`ch-drop.js`): drop the all-ages step per above, cut the grey-line clutter Thara got lost in, and add the 2020 gap treatment.
3. **Rewrite the two lines that failed.** "So the question was never where did the hour go. It's who was holding it" — Michael: "This makes no sense." And the closing "dissolved into a day that is easier and easier to spend alone" — "Like, what the heck?" Both are doing a poetic turn the reader hasn't been set up for. Plainer, same meaning.
4. **Tone pass on all copy.** "These writings are a little dramatic… make it a little bit more straight to the point." He's partly right. Keep the case language, lose the flourishes.
5. **One takeaway, not six.** Thara couldn't name a single message because our leading insights are styled like conclusions. One sentence gets promoted; the setup lines get demoted visually.
6. **Define socializing early.** Thara: younger readers may count social media. One line, up front, plus the detail in methods.
7. **Do the two cuts** and fold the closing into the verdict.

### Chloe — the suspects, the data, the case file

1. **Move phones up and name them.** `ch-games.js` moves to sit directly beside work and TV, as the third suspect — and the one that doesn't walk. Add the honest line: **ATUS has no "phone" category at all.** Phone time is scattered across every block in the day, which is exactly why we can't convict it. That's a real finding and it answers the question Michael kept asking.
2. **2020 gap on your charts** (`ch-alone.js` is already right — it's the model; `ch-games.js` needs it).
3. **Say what the bars mean, on the chart** (`ch-moved.js`): "change since 2003–04, as of [year]". That's the sentence we couldn't produce when he asked.
4. **Absorb the weekday finding into the case file** (`ch-file.js`) so cutting Clue 1 costs us nothing, and make the day-type picker prominent enough that a reader finds it.
5. **Verify the pipeline is complete** for V3 — `scripts/fetch_atus.py` reruns clean and reproduces `data/atus.json`, covering every series we now use (ages incl. 020, parent status, who-with, 600058). Note anything hand-edited.
6. **Instructions and one driver per chapter** on your charts, to the shared pattern below.

### Georgia — the shared patterns, the world, the submission

1. **Build the three shared patterns once**, in `js/main.js` and `css/base.css`, so we don't ship three different versions:
   - `story.gapMark(svg, x, …)` — the "2020: no survey" band plus a dashed bridge across it. Ported from Chloe's `ch-alone.js`, which already does it well.
   - A `.chart-howto` line that sits with the chart and says what to do.
   - A standard year readout — big enough to read, which Thara said ours often isn't — and a slower autoplay.
2. **Make the age selector impossible to miss.** Neither tester saw it. It moves out of the top bar into the story itself, at the first chapter where it changes anything.
3. **One driver per chapter.** Michael on the scale: two ways to do one thing. Scroll *or* slider, never both, across the scale, lineup and verdict.
4. **Fix the lineup.** He called it glitchy and didn't understand it — reproduce the glitch, add the instruction, and reframe it as the all-ages comparison now that the case chart no longer is.
5. **Reorder `index.html`** for the phones move and the cuts. Shared file, one commit, announced.
6. **Process book:** all three names, the testing sessions, what we changed because of them, and the innovative-visualization section the brief asks for.
7. **Submission:** the zip, and the single upload.

---

## The pattern everyone follows

**Every interactive chart, no exceptions:**
- An instruction visible at the same time as the chart, in plain words. Not in a step you scroll past.
- One way to drive it. If scroll advances it, there's no slider. If there's a slider, scroll doesn't fight it.
- The year readout is large and always visible.
- Any gap in the data is marked on the chart, not explained in prose elsewhere.
- The chart says what it encodes: "change since 2003–04," "each figure ≈ one minute of an average day."
- Anything that looks clickable is clickable. Thara tried to select things we hadn't made selectable.

---

## Open: who checks it

The whole point of the testing was that we can't see our own interface any more. Before we submit, one of us finds somebody who hasn't seen it, hands them a laptop, and says nothing for five minutes.
