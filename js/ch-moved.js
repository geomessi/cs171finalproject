/*
 * Chapter 4 · Where the time went (FUNCTIONAL D3 #2)
 * Owner: Package 2. Only this package edits this file.
 *
 * Diverging bar chart: change in minutes/day per activity vs. 2003–04. Reuse prototype-a/index.html (the "What moved" chart).
 * Steps:
 *   0: show all bars at zero
 *   1: grow the bars, then highlight Working (−18)
 *   2: highlight Watching TV (−34)
 *   3: highlight Sleep (+39) and Other leisure (+29)
 * - Team request: a Play control that animates the end year from 2005 to 2025 so bars grow over time.
 * - Activities: story.DAY_PARTS, names in story.ACTIVITIES, colors via story.color(code) or var(--c-less)/var(--c-more).
 * - age(code): recompute for the reader's group.
 *
 * Until story.chapter('moved', ...) is called, the page shows a placeholder box.
 */

// story.chapter('moved', {
//   init(el, data) {
//     const svg = d3.select(el).append('svg').attr('viewBox', '0 0 600 420');
//     // draw here
//   },
//   step(n, dir) { },
//   age(code) { },
// });
