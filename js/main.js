/*
 * Shared story runtime. Team-owned: change by pull request only.
 *
 * Each chapter file registers itself:
 *
 *   story.chapter('drop', {
 *     init(el, data) { ... },   // once, after data loads. el = the chapter's .viz div
 *     step(n, dir)  { ... },    // a text step scrolled into view (n = data-step, dir = 'down'|'up')
 *     age(code)     { ... },    // the reader changed "I'm…" (code like '103')
 *   });
 *
 * All three hooks are optional. A chapter that never registers shows its placeholder box.
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
    AGES, ACTIVITIES, DAY_PARTS,

    chapter(id, hooks) { chapters[id] = hooks; },

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
        if (hooks?.init) { el.classList.add('live'); hooks.init(el, story.data); }
      });
      // The hero shares the clock script.
      if (chapters.hero?.init) { const el = document.getElementById('hero-viz'); el.classList.add('live'); chapters.hero.init(el, story.data); }
      watchSteps();
      setAge(story.you);
    },
  };

  function setAge(code) {
    story.you = code;
    const name = AGES[code];
    document.querySelectorAll('[data-you-label]').forEach(n => { n.textContent = `${name}-year-olds`.replace('65+-year-olds', 'people 65 and older'); });
    Object.values(chapters).forEach(h => h.age && h.age(code));
  }
  document.getElementById('you-age').addEventListener('change', e => setAge(e.target.value));

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
        if (n !== current[id]) { current[id] = n; chapters[id]?.step?.(n, dir); }
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  window.story = story;
})();
