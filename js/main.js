/*
 * Shared story runtime. Team-owned: change by pull request only.
 *
 * Each chapter file registers itself:
 *
 *   story.chapter('drop', {
 *     init(el, data) { ... },   // once, after data loads. el = the chapter's .viz div
 *     step(n, dir)  { ... },    // a text step scrolled into view (n = data-step, dir = 'down'|'up')
 *     age(code)     { ... },    // the reader changed "I'm…" (code like '103')
 *     year(y)       { ... },    // another chapter moved the shared year (see story.setYear)
 *   });
 *
 * All four hooks are optional. A chapter that never registers shows its placeholder box.
 *
 * Linked views: the chapters that have a year control (the lineup, the scale, the verdict) share one
 * year. Whichever one the reader touches calls story.setYear(y, 'its-own-id'); every other chapter
 * gets year(y) and follows. Pass your own id so you don't hear your own change back.
 *
 * A chapter that is locked to one age group should say so: put data-scope="103" on its
 * <section> and this file adds the note under its text.
 *
 * Helpers on window.story:
 *   story.data            the parsed data/atus.json (see WORKPLAN.md for its shape)
 *   story.you             current age code from the "I'm…" menu
 *   story.ageName(code)   '103' -> '15–24'
 *   story.series(age, activity, day='00')   array of minutes per day, one per year (null = no estimate)
 *   story.avg(arr, [years])                 mean of arr over the given years, skipping nulls
 *   story.color(activity) CSS color var for an activity code, e.g. 'var(--c-social)'
 */
(function () {
  const AGES = { '000': 'All ages', '103': '15–24', '031': '25–34', '038': '35–44', '042': '45–54', '049': '55–64', '065': '65+' };
  const ACTIVITIES = {
    '600001': { name: 'Sleep & personal care', color: '--c-personal' },
    '600013': { name: 'Working', color: '--c-work' },
    '600016': { name: 'Education', color: '--c-edu' },
    '600003': { name: 'Household chores', color: '--c-home' },
    '600007': { name: 'Caring for household', color: '--c-care' },
    '600010': { name: 'Caring for others', color: '--c-care' },
    '600018': { name: 'Shopping & services', color: '--c-shop' },
    '600022': { name: 'Eating & drinking', color: '--c-eat' },
    '600024': { name: 'Socializing', color: '--c-social' },
    '600025': { name: 'Watching TV', color: '--c-tv' },
    'leis':   { name: 'Other leisure & sports', color: '--c-leis' },
    '600030': { name: 'Civic & religious', color: '--c-other' },
    '600033': { name: 'Calls, mail & email', color: '--c-other' },
    '600034': { name: 'Other', color: '--c-other' },
  };
  // These 14 add up to the full 24-hour day.
  const DAY_PARTS = Object.keys(ACTIVITIES);

  const chapters = {};
  const story = {
    data: null,
    you: '103',
    year: null,            // the shared year, once a chapter with a year control sets one
    AGES, ACTIVITIES, DAY_PARTS,

    chapter(id, hooks) { chapters[id] = hooks; },

    // Move the shared year. `from` is the id of the chapter the reader touched; it is the one
    // chapter that does not get told, because it already knows.
    setYear(y, from) {
      if (y == null || y === story.year) return;
      story.year = y;
      Object.entries(chapters).forEach(([id, h]) => { if (id !== from && h.year) h.year(y); });
    },

    ageName(code) { return AGES[code] || code; },

    series(age, activity, day = '00') {
      const s = story.data.act[age]?.[day];
      if (!s) return null;
      if (activity === 'leis') {  // leisure & sports, minus socializing and TV
        return s['600023'].map((v, i) => (v == null ? null : v - s['600024'][i] - s['600025'][i]));
      }
      return s[activity] || null;
    },

    avg(arr, years) {
      const vals = years.map(y => arr[story.data.years.indexOf(y)]).filter(v => v != null);
      return vals.length ? d3.mean(vals) : null;
    },

    color(activity) { return `var(${ACTIVITIES[activity]?.color || '--c-other'})`; },

    /* ---- shared chart patterns -------------------------------------------------
     * Testing (Nov 2026) turned up two problems that hit every chart, so the fixes
     * live here rather than being reinvented per chapter:
     *   1. BLS published no 2020 estimates. One chart marked the gap; the rest let
     *      their lines jump it, and both testers misread the result.
     *   2. Neither tester knew what they were allowed to do with any chart.
     */

    // The missing year, drawn where it would have been.
    gapMark(g, x, top, bottom, label = '2020: no survey') {
      const w = Math.max(3, x(2020.5) - x(2019.5));
      const sel = g.selectAll('.gap-mark').data([null]).join('g').attr('class', 'gap-mark');
      sel.selectAll('rect').data([null]).join('rect')
        .attr('x', x(2019.5)).attr('width', w).attr('y', top).attr('height', Math.max(0, bottom - top));
      sel.selectAll('text').data([null]).join('text')
        .attr('x', x(2020)).attr('y', bottom - 6).attr('text-anchor', 'middle').text(label);
      return sel;
    },

    // A dashed bridge over the gap, one per line, so the eye keeps hold of which line is which.
    // rows: [{ y2019, y2021, color }] in pixel space.
    gapBridge(g, x, rows) {
      g.selectAll('.gap-bridge')
        .data(rows.filter(r => r.y2019 != null && r.y2021 != null))
        .join('line').attr('class', 'gap-bridge')
        .attr('x1', x(2019)).attr('x2', x(2021))
        .attr('y1', r => r.y2019).attr('y2', r => r.y2021)
        .attr('stroke', r => r.color || 'currentColor');
    },

    // One instruction, visible whenever its chart is. Never in a step you scrolled past.
    howto(el, text) {
      const root = el.node ? el.node() : el;
      let p = root.querySelector(':scope > .chart-howto');
      if (!p) { p = document.createElement('p'); p.className = 'chart-howto'; root.appendChild(p); }
      p.textContent = text;
      return p;
    },

    PLAY_MS: 520,          // autoplay step: slower than it was, because the years ran away
    reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,

    async start() {
      try {
        story.data = await (await fetch('data/atus.json')).json();
      } catch (e) {
        document.querySelectorAll('.viz').forEach(el => { el.dataset.placeholder = 'Data failed to load. Open this page through a local server (see README).'; });
        console.error(e);
        return;
      }
      document.querySelectorAll('[data-chapter]').forEach(section => {
        const id = section.dataset.chapter;
        const hooks = chapters[id];
        if (id === 'hero') return;
        const el = section.querySelector('.viz');
        // One chapter throwing used to abort this loop and leave every later chapter as an
        // empty placeholder — three people are pushing to one page, so a single bad line
        // should cost us one chart, not nine.
        if (hooks?.init) {
          el.classList.add('live');
          try { hooks.init(el, story.data); }
          catch (err) { el.classList.remove('live'); console.error(`chapter "${id}" failed to start:`, err); }
        }
      });
      // The hero shares the clock script.
      if (chapters.hero?.init) {
        const el = document.getElementById('hero-viz'); el.classList.add('live');
        try { chapters.hero.init(el, story.data); }
        catch (err) { el.classList.remove('live'); console.error('chapter "hero" failed to start:', err); }
      }
      scopeNotes();
      watchSteps();
      setAge(story.you);
    },
  };

  // Neither tester in the Nov 2026 sessions noticed the age menu in the top bar
  // ("probably not very clear that you can do that"), so there is now a second one inside
  // the story, at the first chapter where it changes anything. Any number of
  // [data-age-picker] selects stay in sync; they all drive the same value.
  function setAge(code) {
    story.you = code;
    const name = AGES[code];
    document.querySelectorAll('[data-you-label]').forEach(n => { n.textContent = `${name}-year-olds`.replace('65+-year-olds', 'people 65 and older'); });
    document.querySelectorAll('[data-age-picker]').forEach(s => { if (s.value !== code) s.value = code; });
    Object.values(chapters).forEach(h => h.age && h.age(code));
  }
  document.querySelectorAll('[data-age-picker]').forEach(s => {
    s.addEventListener('change', e => setAge(e.target.value));
  });

  // Some chapters only have data for one age group, so the "I'm…" menu can't move them. Say so
  // under the text instead of letting the chart look broken.
  function scopeNotes() {
    document.querySelectorAll('[data-chapter][data-scope]').forEach(section => {
      const name = AGES[section.dataset.scope] || section.dataset.scope;
      // Inside the first step, not the steps column: the column is a grid with huge scroll gaps.
      const first = section.querySelector('.step');
      if (!first || first.querySelector('.scope-note')) return;
      const p = document.createElement('p');
      p.className = 'scope-note';
      p.textContent = `These numbers are for ages ${name}, whichever group you pick above.`;
      first.appendChild(p);
    });
  }

  // In each chapter, the active step is the last one whose top has passed the middle of the screen.
  // Position-based (not edge-based), so fast scrolling never skips a step: when you jump from
  // step 0 to step 3, the chapter receives step 3 and should draw that state directly.
  const current = {};
  let lastY = window.scrollY;
  function watchSteps() {
    let ticking = false;
    const update = () => {
      ticking = false;
      const dir = window.scrollY >= lastY ? 'down' : 'up';
      lastY = window.scrollY;
      const mid = innerHeight / 2;
      document.querySelectorAll('[data-chapter]').forEach(section => {
        const steps = [...section.querySelectorAll('.step')];
        if (!steps.length) return;
        const box = section.getBoundingClientRect();
        if (box.bottom < 0 || box.top > innerHeight) return;   // off screen: keep its last state
        let active = steps[0];                                  // before the first step, show step 0
        steps.forEach(s => { if (s.getBoundingClientRect().top < mid) active = s; });
        steps.forEach(s => s.classList.toggle('is-active', s === active));
        const id = section.dataset.chapter;
        const n = +active.dataset.step;
        if (n !== current[id]) {
          current[id] = n;
          // Same reason as init: a throw here runs on every scroll frame and would take the
          // whole page's scrolling with it.
          try { chapters[id]?.step?.(n, dir); }
          catch (err) { console.error(`chapter "${id}" step ${n} failed:`, err); }
        }
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  window.story = story;
})();
