# Style guide: Where the Hours Went

One page, three builders. This guide keeps the chapters looking like one piece. Every value here is already a variable in `css/base.css`, so use the variable, never the hex. See it live at `/styleguide/` on any preview link.

## The idea

**Time going soft.** The day is a fixed 24 hours, but what fills it has quietly changed shape. Our look is a night stage where almost everything is dim, and one thing glows: time spent with other people. When it shrinks, you should feel it.

What we took from the mood board:

| From the mood board | What it becomes on the page |
| --- | --- |
| Surreal melting clocks | The novel view: a 24-hour clock that softens and drips as socializing drains away. Soft, rounded display type. Slow, viscous motion. |
| Tiny people walking on a disc | Tiny luminous figures walking the grid beneath the clock. Walking alone or together is data. Never cartoon characters. |
| Pearl, opal and iridescent surfaces | The sheen marks what's precious: a thin edge on socializing in the clock, and nowhere else. |
| Glowing data art, grid tunnels, scan lines | The world's glowing grid floor running to the horizon. Fine grids and hairlines in the charts. Monospace for every number and label. |
| Sand, smoke, ceramic | A warm sand accent for the reader: "you", your guess, your age line. |

The mood board images are reference only. Don't put them on the site, and don't redraw any of them, including the painting. The clock is our own image, driven by our data.

## Color

### Stage

| Variable | Hex | Use |
| --- | --- | --- |
| `--bg` | `#0B0C12` | Night. The page background. |
| `--surface` | `#15161F` | Dusk. Tooltips, cards, chart wells. |
| `--line` | `#272836` | Hairlines and dividers. |
| `--faint` | `#474657` | Gridlines and inactive marks. Never text. |
| `--muted` | `#A19DB0` | Secondary text, axis labels, captions. |
| `--ink` | `#EEEBF5` | Pearl. Main text. |

### Accents

| Variable | Hex | Use |
| --- | --- | --- |
| `--c-social` | `#FF8DB8` | Socializing, everywhere. The one luminous color. |
| `--sheen` | pearl gradient | A thin highlight edge on the socializing wedge. Nowhere else. |
| `--sand` (`--accent`) | `#D8C2A0` | The reader: the "I'm…" menu, your guess, your age group's line. |
| `--c-more` | `#8FD8CB` | Time gained, in the diverging chart. |
| `--c-less` | same as socializing | Time lost, in the diverging chart. |

### Activities

Dusk tones, so socializing stands out by contrast. Activities in the same family share a tone on purpose.

| Activity | Variable | Hex |
| --- | --- | --- |
| Sleep & personal care | `--c-personal` | `#34466A` |
| Working | `--c-work` | `#7C6B45` |
| Education | `--c-edu` | `#66603F` |
| Household chores | `--c-home` | `#594F47` |
| Caring (household and others) | `--c-care` | `#4F463F` |
| Shopping & services | `--c-shop` | `#4A453F` |
| Eating & drinking | `--c-eat` | `#40604A` |
| Watching TV | `--c-tv` | `#4F4588` |
| Other leisure & sports | `--c-leis` | `#6F63B8` |
| Civic, calls, other | `--c-other` | `#343741` |

In code, `story.color('600024')` returns the right variable for any activity code.

### Color rules

1. **Socializing is always pink, and nothing else is.** If a chart needs a second highlight, use sand for "you" or `--ink` for a callout.
2. **Never put text in an activity color or `--faint`.** Those are for shapes. Text is `--ink`, `--muted`, `--sand` or `--c-social`. All four pass accessibility contrast on the page background.
3. **Separate touching shapes with a 1px `--bg` stroke** (wedges, stacked bars) so the dim tones don't blur together.
4. **Don't rely on color alone.** Label socializing and "you" directly on the chart.

## Type

| Role | Font | Variable | Size |
| --- | --- | --- | --- |
| Hero headline | Fraunces 600, soft | `--display` | `clamp(40px, 6vw, 76px)` |
| Chapter title | Fraunces 600, soft | `--display` | `clamp(26px, 3.4vw, 38px)` |
| Story text (steps) | IBM Plex Sans 400 | `--body` | 18px |
| Body, captions | IBM Plex Sans 400 | `--body` | 16px / 13px |
| Numbers, axis labels, kickers | IBM Plex Mono 400–500 | `--mono` | 11–13px, kickers uppercase with 0.1em letter spacing |

Fraunces is set with `font-variation-settings: "SOFT" 100` (already in `base.css`). Its rounded, slightly melted letterforms echo the clock. Use the display face only for headlines and the big year on the clock, never for chart labels.

## Charts

- **One idea per chart, written as the title.** The chapter heading is the claim, for example "The weekdays emptied out," not "Weekday vs. weekend socializing."
- **Units are minutes per day,** written `36 min/day` on first use and `36 min` after. Ranges use an en dash: `2003–04`, `15–24-year-olds`.
- **Label directly** at the end of lines and bars. Skip legends where a direct label fits.
- **Grids:** a few horizontal hairlines in `--faint`, dashed `2 3`. No chart borders or background boxes.
- **2020 is a gap.** BLS published no estimates, so lines break there (`d3.line().defined(...)`) and a note says why.
- **Two-year endpoints.** "2003–04" and "2024–25" are averages of two survey years. Say so once in a caption.
- **Correlation language.** Write "fell while sleep rose", never "was replaced by" or "because of".
- **Tooltips:** `--surface` background, `--ink` text, a mono number line, 6px radius.

## Motion

| Variable | Value | Use |
| --- | --- | --- |
| `--slow` | 1100ms | The melt, chart builds, the year running 2003 → 2025 |
| `--med` | 450ms | Step changes, highlights |
| `--fast` | 150ms | Hover |
| `--ease-melt` | `cubic-bezier(.55, 0, .25, 1)` | Slow start, slow settle, like something viscous |

In D3, use `d3.easeCubicInOut` for builds and `d3.easeQuadIn` for falling drops (gravity). Motion follows scroll; nothing loops or plays on its own except a Play button the reader presses. Everything must work with `prefers-reduced-motion`: jump to the end state instead of animating.

## The world

The page is a place, sunlit and painterly rather than digital. A 3D scene (`js/world.js`) sits behind everything: a deep ultramarine sky with a warm golden band at the horizon and drifting pink clouds, soft sand dunes, a mirror-still lake that reflects the sky, the clouds and the clock, and a giant clock floating over a dune at the water's edge.

- **The world has its own palette** (in `world.js`): zenith `#22348F`, sky `#3A52B6`, horizon `#F3D3A2`, sand `#D8B489`, water `#24388C`, clouds `#F4A9C8`, clock face `#EFE6D5`, ink `#2A2320`. Activity regions on the face are painted in warm, earthy versions of the activity colors. Socializing stays the site pink `#FF8DB8` everywhere, so it ties the world to the charts.
- **The clock must read as a clock.** A cream face with record-like grooves, a pearl bezel, hour marks with numerals every 3 hours, and two hands. The numerals count hours of the day (3h, 6h…), because the dial shows how long each activity takes, not when.
- **Light is warm and low,** from the left, so the tiny walkers cast long shadows across the face.
- **Charts are evidence cards.** In the evidence chapters a veil dims the world, and every chart and story step sits on frosted glass (`--surface` at 80%, 14px blur, `--line` border, 14px radius). Don't put charts directly on the world.
- **The camera tells the story.** Low and wide in the hero, so the clock floats over its reflection. Pulled back and dimmed for the evidence. High above the face for the verdict.
- **The background is only clocks.** The main clock is the reader's age group. Smaller clocks floating over the far dunes are the other age groups' days, each tagged with its socializing minutes.
- **The balance scale has its own chapter** ("Weigh it"), drawn as a painted panel in the world palette: ultramarine sky, pink clouds, dunes, a pearl column and beam, shallow pans, tiny dark figures with long shadows. "With others" figures huddle in threes; "alone" figures stand apart. Tilt and figure counts are proportional to the minutes. Labels sit on small dark tags (mono title, Fraunces value, sand share).
- **The sky is mood, the rest is data.** Golden hour drifting toward dusk across 2003–2025 is atmosphere. The face regions, hands, melt, drips and walkers all encode real numbers.
- We take the feeling of surrealist soft clocks, not any painting itself: no copied compositions or objects.
- Without WebGL, the page falls back to the flat 2D clock and a plain background.

## The melting clock

- One average day for the reader's age group, 1,440 minutes around the dial. Each region's angle is exact, painted on the face.
- **Socializing is the pink region at the front, nearest the water.** The two hands bracket it, so they close in as it shrinks.
- **The front of the clock slumps toward the water** in proportion to socializing minutes lost since 2003–04 (smoothed over three years). The melt bends the face; it doesn't change the shares painted on it.
- **Pink drips** hang from the slumped edge and fall into the lake, sending out ripples into a pink pool.
- **Walkers are data:** the share of figures walking alone equals the share of waking time spent alone for the reader's age band (from 2010; earlier years hold 2010).
- The verdict card carries the exact numbers: year, socializing minutes, minutes lost, time alone. Controls stay neutral (`--ink` text, `--faint` borders).
- Without WebGL, the 2D clock follows the same rules: dimmed regions, glowing pink socializing, hanging drips.

## Voice

- Short and human. Write for a 20-year-old reading on a phone.
- Second person for the reader ("Find your own line"), plain statements for findings.
- Every number comes from `data/atus.json`. No numbers from AI mockups or memory.
- Name the source once per chapter in a caption: American Time Use Survey, BLS.

## Don'ts

- No cartoon or AI-illustrated people, and no stock photos.
- No second bright color competing with socializing.
- No drop shadows, gradients on bars, or rounded chart boxes. The only gradient on the page is the pearl sheen.
- No light-mode version for V1. The night stage is the design.
