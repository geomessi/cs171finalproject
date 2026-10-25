/*
 * Chapter 1 · Guess, then reveal (functional)
 * Owner: Package 1. Only this package edits this file.
 *
 * Build a slider (0–120 min) where the reader guesses daily socializing for their age group,
 * then a "Reveal" button that shows the real 2024–25 average next to their guess.
 * - Real value: story.avg(story.series(story.you, '600024'), [2024, 2025])
 * - age(code): reset the guess and update the question for the new group.
 * - Keep the guess in a variable; Chapter 2 can read it later if you want to show "your guess" on the line.
 *
 * Until story.chapter('guess', ...) is called, the page shows a placeholder box.
 */

// story.chapter('guess', {
//   init(el, data) {
//     const svg = d3.select(el).append('svg').attr('viewBox', '0 0 600 420');
//     // draw here
//   },
//   step(n, dir) { },
//   age(code) { },
// });
