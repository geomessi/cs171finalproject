/*
 * Hero + Chapter 6 · The record (NOVEL VIEW)
 * Owner: Package 3. Only this package edits this file.
 *
 * The day as a vinyl record. Register BOTH 'hero' (static disc in the hero) and 'record' (scroll-driven version).
 * - Each groove is one year: 2003 outermost, 2025 innermost. Skip 2020 or draw it as an empty groove.
 * - Angle = time of day: each of the 14 story.DAY_PARTS gets an arc sized minutes/1440 * 360°.
 *   Use d3.arc() with innerRadius/outerRadius per groove and d3.pie().sort(null) per year.
 * - Socializing is the only bright arc (var(--c-social)); everything else stays dark.
 * - Steps: 0 full disc; 1 the needle moves inward 2003 → 2025 (socializing arc narrows);
 *   2 the closing question. Tiny figures walking the socializing groove are a stretch goal.
 * - age(code): rebuild the grooves for the reader's group.
 * - Hover a groove: tooltip with that year's minutes of socializing.
 * Inspired by the mood board's records and surreal clocks. Keep it our own image, not a copy of any artwork.
 *
 * Until story.chapter('record', ...) is called, the page shows a placeholder box.
 */

// story.chapter('record', {
//   init(el, data) {
//     const svg = d3.select(el).append('svg').attr('viewBox', '0 0 600 420');
//     // draw here
//   },
//   step(n, dir) { },
//   age(code) { },
// });
