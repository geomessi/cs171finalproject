# Prototype 3 — considerations and next steps

Notes only. Nothing here is decided and no code has been written for any of it. Raised while
building Prototype 2, parked here so we don't lose it.

---

## 1. A bigger opening promise

**Where this came from.** A viral chart doing the rounds: work falling and entertainment rising
across 1900–1940, 1940–1980, 1980–2025, with a question mark over "the AI era." Alongside it, a
"laziness curve" — calculator, phone, maps, search, AI — where each tool takes a skill with it.
The pitch underneath both: *technology saves time, humans find new ways to spend it.*

**We can't rebuild either chart.** ATUS starts in 2003, so three of that chart's four eras don't
exist in our data, and its numbers aren't real ones — "74% of waking time working" would be about
twelve hours a day averaged across everyone, children and retirees included. The laziness curve
isn't time-use data at all; it's a claim about what people can still do, and ATUS only records what
they did.

**But our data partly contradicts the premise, which is worth more than agreeing with it.**
Verified in `data/atus.json`:

| Claim in the slide | What the survey says |
| --- | --- |
| Technology freed up time | True. Work fell 18 minutes a day, all ages, 2003–04 to 2024–25. |
| Entertainment ate it | No. Total leisure is flat: 309 minutes a day then, 307 now. For 15–24-year-olds it *fell*, 333 to 305. |
| Appliances shrink housework | Not for young adults. Chores rose 18 minutes a day for 15–24. We can show it; we can't say why. |
| More entertainment | Same budget, different shape. Games and computer use for fun doubled for 20–24-year-olds, 29 minutes to 60, while TV fell 32. |

**The line this gives us:** leisure didn't grow — it got lonelier.

**What the reframe would change.** The spine stays: suspects, clues, verdict, case file. What
changes is the promise at the top, from "an hour is missing" to something like:

> Every technology promises to hand you time back. Over the last twenty years, Americans actually
> got some: less work, less TV. This is the story of where it went — and who it didn't go to.

That makes "A day can't grow" the thesis chapter instead of a setup chapter, and the suspects
chapter becomes the reallocation argument. The verdict doesn't change.

**The risk.** The TF asked for AI as a *short closing thought*, not the frame. Leading with "where
does freed time go" is not the same as leading with AI, but it's adjacent. Keep AI out of the hero
entirely. Our version of that question-mark bar should be honestly empty — the data doesn't exist
yet, and saying so is stronger than guessing at it.

---

## 2. Other data worth looking at

None of this has been checked for what's actually in it. Verify before anyone commits.

### Would make the reframe real

**IPUMS American Heritage Time Use Study.** Harmonized US time-use surveys from the 1960s on —
roughly 1965, 1975, 1985, the early 90s, 1998, then ATUS from 2003. This is the honest version of
the fake chart: sixty years instead of twenty-two. Highest payoff, highest cost — it's an extract
you build and weight yourself, not a table you download.

**General Social Survey.** Has asked how often Americans spend a social evening with friends, with
relatives, with neighbors, since 1972. Frequency, not minutes, so it can't merge with ours — but as
a second line from an independent survey asking a different question over fifty years, it stops our
finding from being an artifact of one dataset. Cheap.

### Would give the story an ending it doesn't have

**ATUS Well-Being Module.** Ran in several years; asks how people *felt* during each activity —
happiness, meaning, stress, tiredness. If socializing rates near the top and solo screen time near
the bottom, we're not just saying an activity shrank, we're saying one of the best hours of the day
did. Same source family as what we already use.

### Smaller, cheap, useful

- **ATUS location codes.** We use who you were with; ATUS also records where. "Socializing didn't
  shrink so much as move home" would be a clean chapter from a source we already pull.
- **Census household data.** The share of Americans living alone has climbed for decades — a
  structural fact sitting underneath our whole story.
- **OECD time use.** Is this American or is it everywhere? One chart, and it changes the ending.
- **IPUMS ATUS microdata.** Would let us cross age with parent status, which BLS doesn't publish
  and which we currently have to apologize for in the explore view.

### For the AI close

No time-use data on AI exists, and won't until 2027 at the earliest. But there are studies measuring
hours saved by generative AI at work — the St. Louis Fed published one from a national survey. One
sourced number beats a question-mark bar: *AI is already handing some workers hours back; here's
what happened the last three times that occurred.*

---

## 3. If we only do two

**GSS** for the fifty-year corroboration, because it's cheap and it hardens the central claim, and
the **Well-Being Module** for the ending. AHTUS is the most exciting and the most expensive — a
stretch, and only if the pipeline work lands early.

**Scope caution.** A visualization course usually rewards one dataset understood deeply over five
used shallowly. Every source we add is another methods paragraph and another way to be wrong in the
Q&A.

---

## 4. Carried over from Prototype 2

Raised and deliberately not done:

- **A build order for `index.html`.** Three people adding sections to one shared file is the merge
  conflict waiting to happen. One commit, by one person, adding every section with its copy and an
  empty chart box, before anyone starts.
- **A cut list,** agreed before crunch rather than during it.
- **A numbers-of-record table** — every figure used in copy, in one place with its data key, so the
  same number can't drift between someone's prose and someone else's chart.
- **The nav doesn't survive sixteen chapters.** It already hides on phones. A thin progress rail
  grouped into acts would also make the arc legible while scrolling.
- **A performance budget.** Charts should initialize when they're near the viewport, not all on
  load, now that there are sixteen of them behind a live 3D canvas.
