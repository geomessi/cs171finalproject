/*
 * Chapter 2 · The drop (FUNCTIONAL D3 #1)
 * Owner: Mariah (Package 1). Only this package edits this file.
 *
 * Socializing minutes per day, 2003–2025, one line per age group. Reuse prototype-a/index.html (the trend chart).
 * Steps (see the text in index.html):
 *   0: draw only the 15–24 line up to 2003–04, label "59 min"
 *   1: animate the line to 2025, label "36 min"
 *   2: fade in the other age groups in grey
 *   3: highlight the reader's group (story.you) in var(--accent)
 * - Leave a gap at 2020 (null). Use d3.line().defined(d => d[1] != null).
 * - age(code): re-highlight the reader's line.
 *
 * Until story.chapter('drop', ...) is called, the page shows a placeholder box.
 */

// story.chapter('drop', {
//   init(el, data) {
//     const svg = d3.select(el).append('svg').attr('viewBox', '0 0 600 420');
//     // draw here
//   },
//   step(n, dir) { },
//   age(code) { },
// });
