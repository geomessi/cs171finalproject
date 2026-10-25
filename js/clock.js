/*
 * Hero + Chapter 6 · The melting clock (NOVEL VIEW)
 * Owner: Package 3. Only this package edits this file.
 *
 * One average day as a 24-hour clock face that melts as the years pass.
 * Register BOTH 'hero' (the 2003 clock, still) and 'clock' (the scroll-driven version).
 *
 * The data must stay readable; the melt is the metaphor around it.
 * - Face: 1,440 minutes around the dial, midnight at the top. Each of the 14 story.DAY_PARTS
 *   is a wedge sized minutes/1440 * 360°. Use d3.pie().sort(null) and d3.arc().
 *   Keep wedge angles exact. Socializing is the only bright wedge (var(--c-social)).
 * - Year: scroll drives the year from 2003 to 2025 (skip 2020, no estimate).
 *   Show the year big on the face. For 15–24, socializing goes 59 → 36 min (about 15° → 9°).
 * - Drips: the minutes socializing lost fall off the rim as drops (one drop per ~2 min is plenty)
 *   and land in the wedges that grew (compare each wedge to 2003; sleep +39, other leisure +29).
 * - Sag: the rim under the socializing wedge droops in proportion to minutes lost.
 *   Build the outline as points around the circle and push y down near that wedge;
 *   a d3.line().curve(d3.curveCatmullRomClosed) through the points keeps it soft.
 *   Keep the sag outside the wedge area so it doesn't change what people read.
 * - Steps: 0 the 2003 clock, crisp; 1 run 2003 → 2025, wedge shrinks, drops fall, rim sags;
 *   2 hold the melted 2025 clock for the closing question.
 * - age(code): rebuild for the reader's group.
 * - Hover a wedge: activity name and minutes in that year.
 * Our own image driven by the data, not a copy of any painting.
 *
 * Until story.chapter('clock', ...) is called, the page shows a placeholder box.
 */

// story.chapter('clock', {
//   init(el, data) {
//     const svg = d3.select(el).append('svg').attr('viewBox', '0 0 600 600');
//     // draw here
//   },
//   step(n, dir) { },
//   age(code) { },
// });
