/*
 * Chapter 5 · The suspects: what moved, then the police lineup
 * Owner: Chloe. Only this package edits this file.
 *
 * Opens on the diverging bar chart: change in minutes a day for every block of the day,
 * 2003–04 → 2024–25, ages 15–24. Scrolling on, every bar swings 90° around its zero point into
 * a column, the blocks that aren't suspects fade away, and the suspects' columns slide into a
 * police lineup: a figure beside each column, against a height wall measured in the same minutes.
 * Scrolling further walks the view sideways from suspect to suspect. The last spot is empty: the
 * phone, which the survey never measured.
 *
 * One driver: scroll. Everything is a function of the scroll position (state.pos), so scrolling
 * back up plays it in reverse. The suspect buttons and "Next suspect" only scroll the page.
 *
 * Steps (index.html). This chapter absorbed "A day can't grow" (the 24-hour column was a second
 * give-and-take chart right before this one):
 *   0: "A day can't grow": the diverging bars, with Play; scrolling from 0 to 1 does the flip
 *   1: "Round up the usual": the whole lineup
 *   2: Work, cleared        3: TV, cleared
 *   4: Sleep and chores grew (both lit)
 *   5: Games, the one that didn't walk: the bar switches from "other leisure" (15–24) to games (20–24)
 *   6: the empty spot: the phone isn't in the survey
 */
(function () {
  const START = [2003, 2004], END = [2024, 2025];
  const AGE = '103';
  const SUSPECTS = [
    { id: 'work',   code: '600013', name: 'Work',   long: 'Working',               step: 2, verdict: 'CLEARED' },
    { id: 'tv',     code: '600025', name: 'TV',     long: 'Watching TV',           step: 3, verdict: 'CLEARED' },
    { id: 'sleep',  code: '600001', name: 'Sleep',  long: 'Sleep & personal care', step: 4, verdict: 'GREW' },
    { id: 'chores', code: '600003', name: 'Chores', long: 'Household chores',      step: 4, verdict: 'GREW' },
    { id: 'games',  code: 'leis',   name: 'Games',  long: 'Games & computer for fun', pre: 'Other leisure & games', step: 5, verdict: "DIDN'T WALK", tag: 'ages 20–24' },
    { id: 'phone',  code: null,     name: 'Phone',  long: 'Your phone',            step: 6, verdict: 'NOT MEASURED' },
  ];
  const LAST_STEP = 6;
  const LINEUP = 1;   // the step where the flip lands: the whole lineup
  const SHORT = {
    '600001': 'Sleep & care', '600003': 'Chores', '600007': 'Care: home', '600010': 'Care: others',
    '600018': 'Shopping', '600022': 'Eating', 'leis': 'Leisure', '600030': 'Civic', '600033': 'Calls & mail',
  };
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = v => { const r = Math.round(v); return (r > 0 ? '+' : r < 0 ? '−' : '±') + Math.abs(r); };
  const clamp = v => Math.max(0, Math.min(1, v));
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const span = (pos, a, b) => smooth((pos - a) / (b - a));

  const FIRST = 2004, LAST = 2025;   // end years the opening chart plays through; 2004 = the 2003–04 baseline, every bar at zero
  const period = end => `${end - 1}–${String(end).slice(2)}`;
  const state = { step: 0, pos: 0, end: FIRST, at: FIRST, f0: null };   // bars start at zero
  let timer = null, playBtn, slider, sliderOut, timeBox, howto;
  let section, root, plot, svg, wall, hAxis, hNames, bars, labels, strip, axis, chips, alibi, nextBtn, clipRect;
  let BARS = [];      // all 14 blocks of the day
  let games = null;   // games 20–24, which replaces "other leisure" at step 4

  const change = (age, code, end = LAST) => {
    const s = story.series(age, code);
    const a = story.avg(s, START), b = story.avg(s, [end - 1, end]);
    return { a, b, d: b - a };
  };

  /* ---- scroll → continuous position --------------------------------------- */
  const steps = () => [...section.querySelectorAll('.step')];
  // The flip (pos 0 → 1) plays while the "Round up the usual" card is pinned: its wrapper (.sx-hold-lineup)
  // is taller than the card, and the card is sticky inside it. After the card lets go, the usual
  // step-to-step position takes over, with a dwell at each suspect.
  function readScroll() {
    const list = steps(), mid = innerHeight / 2;
    readYear(list);
    const hold = section.querySelector('.sx-hold-lineup');
    const card = list[LINEUP];
    let pos = 0;
    if (hold && card) {
      const r = hold.getBoundingClientRect();
      const pin = parseFloat(getComputedStyle(card).top) || mid;
      const f = clamp((pin - r.top) / Math.max(1, r.height - card.offsetHeight));
      if (f < 1) { state.pos = f; return; }
      pos = LINEUP;
    }
    const tops = list.map(s => s.getBoundingClientRect().top);
    for (let i = LINEUP; i < tops.length; i++) {
      if (i > LINEUP && tops[i] >= mid) break;
      const next = tops[i + 1];
      const frac = next == null ? 0 : clamp((mid - tops[i]) / (next - tops[i]));
      pos = i + smooth((frac - 0.15) / 0.7);
    }
    state.pos = Math.min(LAST_STEP, pos);
  }
  // "A day can't grow" pins the same way (.sx-hold-day). While it's pinned, scroll drives the
  // years: 2003–04 (every bar at zero) at the top of the stretch, 2024–25 at the bottom, and
  // scrolling back up rewinds. Play runs the same years on its own; when it finishes, the pin
  // is cut short right there so the reader doesn't have to scroll out the rest of it.
  function dayHold(list) {
    const hold = section.querySelector('.sx-hold-day'), card = (list || steps())[0];
    if (!hold || !card) return null;
    const r = hold.getBoundingClientRect();
    const pin = parseFloat(getComputedStyle(card).top) || innerHeight / 2;
    const room = Math.max(1, r.height - card.offsetHeight);
    return { hold, card, r, pin, f: clamp((pin - r.top) / room) };
  }
  function readYear(list) {
    const h = dayHold(list);
    if (!h || h.f === state.f0) return;
    state.f0 = h.f;
    if (timer) stop();
    state.at = FIRST + h.f * (LAST - FIRST);
    state.end = Math.round(state.at);
  }
  function releaseDay() {
    const h = dayHold();
    if (!h || h.f <= 0 || h.f >= 1) return;
    // Shrink the stretch so it ends where the reader is now; nothing above moves
    h.hold.style.minHeight = `${Math.ceil(h.pin - h.r.top + h.card.offsetHeight)}px`;
    state.f0 = 1;
  }
  function goTo(n) {
    const step = steps()[Math.max(0, Math.min(LAST_STEP, n))];
    if (!step) return;
    const hold = section.querySelector('.sx-hold-lineup');
    let y = scrollY + step.getBoundingClientRect().top - innerHeight / 2 + 24;
    if (n === LINEUP && hold) {   // land where the pinned card lets go: lineup fully formed
      const pin = parseFloat(getComputedStyle(step).top) || innerHeight / 2;
      y = scrollY + hold.getBoundingClientRect().bottom - step.offsetHeight - pin + 2;
    }
    scrollTo({ top: y, behavior: still() ? 'auto' : 'smooth' });
  }

  /* ---- layout ------------------------------------------------------------- */
  function figure(g) {
    g.append('circle').attr('class', 'sx-head').attr('cx', 0).attr('cy', -17).attr('r', 4.1);
    g.append('path').attr('class', 'sx-body').attr('d', 'M0,-12.4 L0,2 M0,-8 L-5.4,-1.4 M0,-8 L5.4,-1.4 M0,2 L-4.6,13 M0,2 L4.6,13');
  }

  let geo = null;
  function layout() {
    const width = Math.max(280, plot.clientWidth), height = Math.max(260, plot.clientHeight);
    const narrow = width < 450;
    const axisW = narrow ? 34 : 42, top = 22, floor = height - 62;
    const y = d3.scaleLinear().domain([-40, 45]).range([floor - 6, top]);
    const inner = width - axisW;
    const spO = inner / SUSPECTS.length;
    const spF = Math.max(spO, Math.min(220, inner * 0.56));
    // The diverging chart: names on the left, change along x
    const left = narrow ? 120 : 168, right = 40;
    const x = d3.scaleLinear().domain([-40, 45]).range([left, width - right]);
    const desc = [...BARS].sort((p, q) => q.d - p.d);
    const rows = d3.scaleBand().domain(desc.map(d => d.code)).range([top, floor + 18]).padding(0.28);
    // The flipped chart: 14 columns, smallest change on the left
    const asc = [...BARS].sort((p, q) => p.d - q.d).map(d => d.code);
    const colStep = (inner - 16) / BARS.length;
    const colX = code => axisW + 8 + colStep * (asc.indexOf(code) + 0.5);
    geo = { width, height, narrow, axisW, top, floor, y, inner, spO, spF, x, rows, colX, colW: Math.min(26, colStep * 0.62), left };
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    clipRect.attr('x', 0).attr('y', 0).attr('width', width).attr('height', height);

    // Lineup wall (fades in with the flip)
    wall.select('.sx-wall').attr('x', axisW).attr('y', top - 8).attr('width', inner).attr('height', floor - top + 8);
    wall.selectAll('line.sx-tick').data([-40, -20, 20, 40]).join('line').attr('class', 'sx-tick')
      .attr('x1', axisW).attr('x2', width).attr('y1', y).attr('y2', y);
    wall.select('.sx-zero').attr('x1', axisW).attr('x2', width).attr('y1', y(0)).attr('y2', y(0));
    wall.select('.sx-floor').attr('x1', axisW).attr('x2', width).attr('y1', floor).attr('y2', floor);
    axis.selectAll('text').data([-40, -20, 0, 20, 40]).join('text')
      .attr('x', axisW - 6).attr('y', d => y(d) + 4).attr('text-anchor', 'end').text(d => (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d));
    wall.select('.sx-unit').attr('x', axisW + 6).attr('y', top - 12)
      .text(narrow ? 'min/day vs. 2003–04 (bold line)' : 'change in minutes a day since 2003–04 · bold line = 2003–04 level');

    // Diverging chart axis (fades out with the flip)
    const bottom = floor + 18;
    hAxis.selectAll('line.sx-hgrid').data([-40, -20, 20, 40]).join('line').attr('class', 'sx-hgrid')
      .attr('x1', x).attr('x2', x).attr('y1', top - 6).attr('y2', bottom);
    hAxis.select('.sx-hzero').attr('x1', x(0)).attr('x2', x(0)).attr('y1', top - 6).attr('y2', bottom);
    hAxis.selectAll('text.sx-htick').data([-40, -20, 0, 20, 40]).join('text').attr('class', 'sx-htick')
      .attr('x', x).attr('y', bottom + 16).attr('text-anchor', 'middle').text(d => (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d));
    hAxis.select('.sx-hunit').attr('x', width - right).attr('y', top - 12).attr('text-anchor', 'end');
    hNames.selectAll('text').data(desc, d => d.code).join('text')
      .attr('class', d => `sx-hname${d.code === '600024' ? ' is-social' : ''}`)
      .attr('x', left - 10).attr('y', d => rows(d.code) + rows.bandwidth() / 2 + 4).attr('text-anchor', 'end')
      .text(d => (narrow && SHORT[d.code]) || d.name);
  }

  /* ---- render: everything follows state.pos ------------------------------- */
  function render() {
    if (!root || !geo) return;
    const { width, axisW, floor, y, spO, spF, narrow, x, rows, colX, colW } = geo;
    const pos = state.pos;
    const flip = span(pos, 0.08, 0.5);      // bars rotate into columns
    const fade = span(pos, 0.5, 0.6);       // non-suspects fade where they stand
    const filter = span(pos, 0.6, 0.76);    // then the suspects slide into lineup slots
    const enter = span(pos, 0.72, 0.88);    // figures, names and the phone arrive
    const swap = span(pos, 4.35, 4.9);      // "other leisure" (15–24) becomes games (20–24)
    const hold = smooth(flip * 4);          // the year control only drives the bar chart
    if (flip > 0 && timer) { stop(); state.at = state.end; }
    const timed = flip <= 0.02;
    timeBox.classed('is-off', !timed);
    chips.classed('is-off', timed);
    if (howto && howto.dataset.phase !== String(timed)) {
      howto.dataset.phase = String(timed);
      howto.textContent = timed ? 'Press play to run the years, then keep scrolling to line up the suspects.' : 'Keep scrolling to walk the lineup, or pick a suspect.';
    }
    hAxis.select('.sx-hunit').text(`change since 2003–04, as of ${period(state.end)}`);
    slider.property('value', state.end); sliderOut.text(period(state.end));

    // While the diverging chart is up, nothing is clipped; once it's a wall, the axis column masks the pan
    clipRect.attr('x', axisW * smooth(flip * 2));

    // Lineup pan
    const sp = lerp(spO, spF, clamp(pos - LINEUP));   // overview at the lineup step, then close up
    const centerAt = n => (n <= LINEUP ? (SUSPECTS.length - 1) / 2 : d3.mean(SUSPECTS.map((s, i) => (s.step === n ? i : null)).filter(i => i != null)));
    const lo = Math.floor(Math.max(LINEUP, pos)), hi = Math.min(LAST_STEP, lo + 1);
    const c = lerp(centerAt(lo), centerAt(hi), clamp(pos - lo));
    const cx = axisW + (width - axisW) / 2;
    const slotX = i => cx + (i - c) * sp;
    const tight = sp < 120, short = sp < 200;
    const figX = tight ? -14 : -24, barX = tight ? 4 : 10, barW = tight ? 14 : 22;

    hAxis.style('opacity', 1 - smooth(flip * 2.5));
    hNames.style('opacity', 1 - smooth(flip * 3));
    wall.style('opacity', smooth(flip * 1.4 - 0.2));
    axis.style('opacity', smooth(flip * 1.4 - 0.2));

    // Bars: each drawn along +x in its own frame, then placed at a pivot and rotated
    const kH = x(1) - x(0), kV = y(0) - y(1), k = lerp(kH, kV, flip);
    const angle = -90 * flip, rad = angle * Math.PI / 180, ux = Math.cos(rad), uy = Math.sin(rad);
    const geom = d => {
      const slot = SUSPECTS.findIndex(s => s.code === d.code);
      const ph = [x(0), rows(d.code) + rows.bandwidth() / 2];
      const pv = [colX(d.code), y(0)];
      const pl = slot >= 0 ? [slotX(slot) + barX + barW / 2, y(0)] : pv;
      const p = [lerp(lerp(ph[0], pv[0], flip), pl[0], filter), lerp(lerp(ph[1], pv[1], flip), pl[1], filter)];
      const th = lerp(lerp(rows.bandwidth(), colW, flip), slot >= 0 ? barW : colW, filter);
      const now = lerp(valueAt(d, state.at), d.d, hold);   // the played year, back to 2024–25 as it flips
      const v = d.code === 'leis' ? lerp(now, games.d, swap) : now;
      return { p, th, v, len: v * k, slot };
    };
    const shown = BARS.map(d => ({ d, ...geom(d) }));
    const emOf = g => {
      if (g.slot < 0) return g.d.code === '600024' ? 'social' : 'other';
      if (state.step <= LINEUP) return 'idle';
      const s = SUSPECTS[g.slot];
      return state.step === s.step ? 'focus' : state.step > s.step ? 'done' : 'wait';
    };
    bars.selectAll('rect.sx-bar').data(shown, g => g.d.code).join('rect')
      .attr('class', g => `sx-bar ${g.v < 0 ? 'less' : 'more'}`)
      .attr('data-em', emOf)
      .attr('transform', g => `translate(${g.p[0]},${g.p[1]}) rotate(${angle})`)
      .attr('x', g => Math.min(0, g.len)).attr('width', g => Math.max(1, Math.abs(g.len)))
      .attr('y', g => -g.th / 2).attr('height', g => g.th)
      .style('opacity', g => (g.slot < 0 ? 1 - fade : null));

    // Value labels at each bar's tip, upright the whole way
    const vertical = flip > 0.5;
    labels.selectAll('text.sx-value').data(shown, g => g.d.code).join('text')
      .attr('class', 'sx-value').attr('data-em', emOf)
      .style('fill', g => (g.v < 0 ? 'var(--c-less)' : 'var(--c-more)'))
      .attr('text-anchor', g => (vertical ? 'middle' : g.v < 0 ? 'end' : 'start'))
      .attr('x', g => g.p[0] + ux * g.len + (vertical ? 0 : g.v < 0 ? -6 : 6))
      .attr('y', g => g.p[1] + uy * g.len + (vertical ? (g.v < 0 ? 16 : -7) : 4))
      .style('font-size', `${lerp(11, 15, flip)}px`)
      .style('opacity', g => (g.slot < 0
        ? (1 - smooth(flip * 3)) * (1 - fade)
        : Math.max(1 - smooth(flip * 3), fade)))
      .text(g => fmt(g.v));

    // Lineup slots: figures, names, stamps (and the phone's empty bar)
    const slot = strip.selectAll('g.sx-slot').data(SUSPECTS, d => d.id).join(e => {
      const g = e.append('g').attr('class', d => `sx-slot sx-${d.id}`).on('click', (ev, d) => goTo(d.step));
      g.append('rect').attr('class', 'sx-hit');
      g.append('rect').attr('class', 'sx-unknown');
      g.append('text').attr('class', 'sx-qmark').text('?');
      g.append('g').attr('class', 'sx-fig').call(figure);
      g.append('text').attr('class', 'sx-num');
      g.append('text').attr('class', 'sx-name');
      g.append('text').attr('class', 'sx-tag');
      const stamp = g.append('g').attr('class', 'stamp');
      stamp.append('rect'); stamp.append('text');
      return g;
    });
    const reached = d => state.step >= d.step;
    slot.attr('transform', (d, i) => `translate(${slotX(i)},0)`)
      .attr('data-em', d => (state.step <= LINEUP ? 'idle' : state.step === d.step ? 'focus' : reached(d) ? 'done' : 'wait'))
      .style('opacity', enter).style('pointer-events', enter > 0.5 ? null : 'none');
    const figScale = Math.max(1.4, Math.min(narrow ? 2.2 : 3.2, (floor - y(0)) / 30));
    slot.select('.sx-hit').attr('x', -sp / 2).attr('width', sp).attr('y', geo.top - 8).attr('height', geo.height - geo.top + 8);
    slot.select('.sx-fig').attr('transform', `translate(${figX},${floor - 13 * figScale}) scale(${figScale})`);
    slot.select('.sx-num').attr('x', figX).attr('y', floor + 18).attr('text-anchor', 'middle').text((d, i) => i + 1);
    slot.select('.sx-unknown').style('display', d => (d.code ? 'none' : null))
      .attr('x', barX).attr('width', barW).attr('y', y(40)).attr('height', y(-40) - y(40));
    slot.select('.sx-qmark').style('display', d => (d.code ? 'none' : null))
      .attr('x', barX + barW / 2).attr('y', y(0) - 10).attr('text-anchor', 'middle');
    const nameOf = d => (d.pre && swap < 0.5 ? (short ? 'Leisure' : d.pre) : short ? d.name : d.long);
    slot.select('.sx-name').style('display', sp < 70 ? 'none' : null)
      .attr('x', tight ? 0 : figX + 14).attr('y', floor + (tight ? 34 : 19))
      .attr('text-anchor', tight ? 'middle' : 'start').text(nameOf);
    slot.select('.sx-tag').style('display', sp < 70 ? 'none' : null)
      .attr('x', tight ? 0 : figX + 14).attr('y', floor + (tight ? 47 : 34))
      .attr('text-anchor', tight ? 'middle' : 'start').text(d => (d.tag && swap >= 0.5 ? d.tag : ''));

    const headTop = floor - 34 * figScale;
    slot.select('.stamp').style('opacity', d => (pos >= 0.9 && reached(d) && !tight ? 1 : 0)).attr('data-kind', d => d.id);
    slot.select('.stamp text').attr('x', 0).attr('y', 4).attr('text-anchor', 'middle').text(d => d.verdict)
      .each(function () {
        const w = this.getComputedTextLength() + 12;
        d3.select(this.parentNode).attr('transform', `translate(${barX - 8 - w / 2},${headTop - 20}) rotate(-6)`)
          .select('rect').attr('x', -w / 2).attr('y', -10).attr('width', w).attr('height', 19).attr('rx', 3);
      });

    chips.selectAll('button').attr('aria-current', d => (state.step === d.step && pos >= 0.9 ? 'true' : null))
      .classed('is-done', d => state.step > d.step);
    nextBtn.property('disabled', state.step >= LAST_STEP).text(state.step === 0 ? 'Line them up →' : state.step === LINEUP ? 'First suspect →' : 'Next suspect →');
    alibi.html(alibiText());
  }

  function alibiText() {
    if (state.step === 0) {
      const social = BARS.find(d => d.code === '600024');
      return `Every block of the day, ages 15–24, 2003–04 → ${period(state.end)}. Socializing: <strong>${fmt(valueAt(social, state.at))} min/day</strong>.`;
    }
    if (state.step === LINEUP) return 'Five blocks of the day that could have taken the time, and one that the survey never measured. Each bar is change since 2003–04.';
    return SUSPECTS.filter(s => s.step === state.step).map(s => {
      if (!s.code) return `<strong>${s.long}</strong> · the survey has no phone category, so there's nothing to measure`;
      if (s.id === 'games') {
        const leis = BARS.find(d => d.code === 'leis');
        return `<strong>${s.long}</strong> · ${Math.round(games.a)} → ${Math.round(games.b)} min/day (${fmt(games.d)}), ages 20–24. All other leisure, 15–24: ${fmt(leis.d)}`;
      }
      const v = BARS.find(d => d.code === s.code);
      return `<strong>${s.long}</strong> · ${Math.round(v.a)} → ${Math.round(v.b)} min/day (${fmt(v.d)})`;
    }).join('<br>');
  }

  // The played year is a float (state.at), so bars glide between survey years instead of jumping.
  const valueAt = (d, at) => {
    const lo = Math.floor(at), hi = Math.min(LAST, lo + 1), f = at - lo;
    return lerp(d.byEnd[lo].d, d.byEnd[hi].d, f);
  };
  function tweenTo(target, ms, ease, track = false) {   // track: the readout follows the glide (play)
    if (timer) timer.stop();
    const from = state.at;
    if (still() || from === target) { state.at = target; timer = null; render(); return; }
    timer = d3.timer(t => {
      const k = Math.min(1, t / ms);
      state.at = from + (target - from) * ease(k);
      if (track) state.end = Math.round(state.at);
      render();
      if (k >= 1) { stop(); if (track) releaseDay(); }
    });
  }
  function stop() {
    if (timer) { timer.stop(); timer = null; }
    state.end = Math.round(state.at);
    if (playBtn) playBtn.text('▶ Play 2003–2025');
  }
  function play() {
    if (timer) { stop(); render(); return; }
    if (state.at >= LAST) state.at = FIRST;   // start over from zero
    state.end = Math.round(state.at);
    playBtn.text('❚❚ Pause');
    tweenTo(LAST, (LAST - state.at) * (story.PLAY_MS || 520), d3.easeLinear, true);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; const p = state.pos, a = state.at; readScroll(); if (p !== state.pos || a !== state.at) render(); });
  }

  story.chapter('moved', {
    init(el) {
      section = el.closest('[data-chapter]');
      BARS = story.DAY_PARTS.map(code => {
        const byEnd = {};
        for (let e = FIRST; e <= LAST; e++) byEnd[e] = change(AGE, code, e);
        return { code, name: story.ACTIVITIES[code].name, byEnd, ...byEnd[LAST] };
      });
      games = change('020', '600058');

      root = document.createElement('div');
      root.className = 'moved-panel';
      root.innerHTML = `<p class="moved-heading">What moved since 2003–04 <span class="chart-tag">Ages 15–24</span></p>
        <div class="sx-row"><div class="sx-chips" role="group" aria-label="Jump to a suspect"></div>
        <div class="sx-time"><button type="button" class="sx-play"></button><input type="range" min="${FIRST}" max="${LAST}" step="1" aria-label="End period"><output class="year-big"></output></div></div>
        <div class="moved-plot"></div>
        <div class="sx-foot"><p class="sx-alibi" aria-live="polite"></p><button type="button" class="sx-next"></button></div>
        <p class="moved-caption">American Time Use Survey, BLS. Change in minutes a day, 2003–04 → 2024–25, each end an average of two survey years. Ages 15–24, except games: BLS doesn't publish it for 15–24, so that bar is 20–24. ATUS has no phone category.</p>`;
      el.append(root);
      howto = story.howto(root, 'Press play to run the years, then keep scrolling to line up the suspects.');
      root.prepend(root.querySelector('.chart-howto'));
      root.prepend(root.querySelector('.moved-heading'));
      plot = root.querySelector('.moved-plot');
      timeBox = d3.select(root.querySelector('.sx-time'));
      playBtn = d3.select(root.querySelector('.sx-play')).on('click', play);
      slider = d3.select(root.querySelector('.sx-time input'))
        .on('input', function () { state.end = +this.value; tweenTo(state.end, 320, d3.easeCubicOut); });
      sliderOut = d3.select(root.querySelector('.sx-time output'));
      stop();
      alibi = d3.select(root.querySelector('.sx-alibi'));
      nextBtn = d3.select(root.querySelector('.sx-next')).on('click', () => goTo(state.step + 1));
      chips = d3.select(root.querySelector('.sx-chips'));
      chips.selectAll('button').data(SUSPECTS).join('button').attr('type', 'button')
        .text(d => d.name).on('click', (e, d) => goTo(d.step));

      svg = d3.select(plot).append('svg').attr('role', 'img');
      const clip = `sx-clip-${Math.random().toString(36).slice(2, 7)}`;
      clipRect = svg.append('clipPath').attr('id', clip).append('rect');
      wall = svg.append('g').attr('aria-hidden', 'true');
      wall.append('rect').attr('class', 'sx-wall');
      wall.append('line').attr('class', 'sx-floor');
      wall.append('line').attr('class', 'sx-zero');
      wall.append('text').attr('class', 'sx-unit');
      hAxis = svg.append('g').attr('aria-hidden', 'true');
      hAxis.append('line').attr('class', 'sx-hzero');
      hAxis.append('text').attr('class', 'sx-hunit');
      hNames = svg.append('g').attr('aria-hidden', 'true');
      const clipped = svg.append('g').attr('clip-path', `url(#${clip})`).attr('aria-hidden', 'true');
      strip = clipped.append('g');
      bars = clipped.append('g');
      labels = clipped.append('g');
      axis = svg.append('g').attr('class', 'sx-axis').attr('aria-hidden', 'true');
      const list = BARS.map(d => `${d.name} ${fmt(d.d)}`).join(', ');
      svg.attr('aria-label', `Change in minutes per day, 2003–04 to 2024–25, ages 15–24: ${list}. The suspects then stand in a lineup: work, TV, sleep, chores, games (ages 20–24, ${fmt(games.d)}), and an empty spot for the phone, which the survey doesn't measure.`);

      const resize = () => { layout(); readScroll(); render(); };
      new ResizeObserver(resize).observe(plot);
      addEventListener('scroll', onScroll, { passive: true });
      resize();
    },
    step(n) {
      state.step = Math.max(0, Math.min(LAST_STEP, n));
      readScroll();
      render();
    },
  });
})();
