/*
 * Chapter 3 · It's the weekdays (DRAFT)
 * Owner: Package 1. Only this package edits this file.
 *
 * Draft only for V1: design it in the process book. Implement if time allows.
 * Idea: a dumbbell chart, weekdays vs. weekends, 2003–04 vs. 2024–25, per age group.
 * - Weekdays: story.series(age, '600024', '19'); weekends: story.series(age, '600024', '16')
 * - For 15–24: weekdays 52 → 27 min, weekends 80 → 53 min.
 *
 * Until story.chapter('weekdays', ...) is called, the page shows a placeholder box.
 */

// story.chapter('weekdays', {
//   init(el, data) {
//     const svg = d3.select(el).append('svg').attr('viewBox', '0 0 600 420');
//     // draw here
//   },
//   step(n, dir) { },
//   age(code) { },
// });
