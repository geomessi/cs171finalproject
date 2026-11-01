/*
 * The lineup · Six melting clocks, one per age group (NOVEL VIEW, LINKED)
 * Owner: Georgia (Package 3). Only this package edits this file.
 *
 * Six small clocks side by side, all reading the same year. One slider moves all of them, and it
 * is the same year the balance scale and the verdict are on: whoever the reader touches calls
 * story.setYear(), and the others follow (see js/main.js).
 *
 * What is data and what is metaphor:
 * - DATA: the pink wedge's angle is exact — minutes of socializing / 1,440 × 360°. The number under
 *   each clock is the minutes for that group in that year, straight from data/atus.json.
 * - METAPHOR: the rim sags and drips under the wedge, in proportion to the minutes that group has
 *   lost since 2003–04 (smoothed over three years so one noisy year doesn't jerk it). The melt sits
 *   outside the wedge, so it never changes the quantity the reader is reading.
 * - The reader's own group from the "I'm…" menu is marked in sand, the site's "you" color.
 */
(function () {
  const SOCIAL = '600024';
  const GROUPS = ['103', '031', '038', '042', '049', '065'];
  const CW = 300, CH = 318, PAD_T = 92;
  const CLOCK_Y = 120, POOL_Y = 150, NAME_Y = 178, CHANGE_Y = 196;   // from the top of a cell / the clock center
  const colsNow = () => (innerWidth < 760 ? 2 : 3);
  const R = 70, R0 = 24, RIM = R + 9;
  const SAG_PER_MIN = 2.1, SAG_MAX = 52;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = ms => (reduceMotion ? 0 : ms);

  let svg, cells = [], yearText, headText, slider, out, playBtn, timer = null, year = 2003, built = false, cols = 0;

  const minutes = (age, y) => story.series(age, SOCIAL)?.[story.data.years.indexOf(y)];
  const baseline = age => story.avg(story.series(age, SOCIAL), [2003, 2004]);
  const valid = y => GROUPS.every(a => minutes(a, y) != null);
  const years = () => story.data.years.filter(valid);

  function lostBy(age, y) {    // smoothed minutes lost since 2003–04, never negative
    const s = story.series(age, SOCIAL), ys = story.data.years;
    const near = [y - 1, y, y + 1].map(t => s[ys.indexOf(t)]).filter(v => v != null);
    return Math.max(0, baseline(age) - d3.mean(near));
  }

  // A circle pulled down under the socializing wedge, which sits at the bottom of the face.
  function rimPath(sag) {
    const pts = d3.range(0, 2 * Math.PI, Math.PI / 60).map(t => {
      const pull = sag * Math.exp(-(((t - Math.PI) / 0.4) ** 2));
      return [RIM * Math.sin(t), -RIM * Math.cos(t) + pull];
    });
    return d3.line().curve(d3.curveCatmullRomClosed)(pts);
  }
  const DRIPS = [[-17, 4, 0.5], [0, 6.5, 1], [16, 3.5, 0.42]];
  function dripPath(x, y0, w, L) {
    const r = w / 2, b = w * 0.8, Ls = Math.max(0, L);
    if (Ls < 1) return `M${x - r},${y0} L${x + r},${y0} Z`;
    return `M${x - r},${y0} C${x - r},${y0 + Ls * 0.5} ${x - b},${y0 + Ls - b} ${x - b},${y0 + Ls} `
      + `A${b},${b} 0 1 0 ${x + b},${y0 + Ls} C${x + b},${y0 + Ls - b} ${x + r},${y0 + Ls * 0.5} ${x + r},${y0} Z`;
  }

  // Three across on a laptop, two on a phone. Called on build and on resize.
  function relayout() {
    const c = colsNow();
    if (c === cols || !cells.length) return;
    cols = c;
    const rows = Math.ceil(GROUPS.length / cols);
    const W = cols * CW, H = PAD_T + rows * CH + 18;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    yearText.attr('x', W / 2);
    headText.attr('x', W / 2);
    cells.forEach((cell, i) => {
      const cx = (i % cols) * CW + CW / 2, cy = PAD_T + Math.floor(i / cols) * CH + CLOCK_Y;
      cell.g.attr('transform', `translate(${cx},${cy})`);
    });
  }

  function build(el) {
    el.classList.add('lineup-viz');
    svg = d3.select(el).append('svg').attr('role', 'img');   // viewBox is set by relayout()

    const defs = svg.append('defs');
    const glow = defs.append('filter').attr('id', 'lu-glow').attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%');
    glow.append('feGaussianBlur').attr('stdDeviation', 3.4).attr('result', 'b');
    const merge = glow.append('feMerge'); merge.append('feMergeNode').attr('in', 'b'); merge.append('feMergeNode').attr('in', 'SourceGraphic');

    yearText = svg.append('text').attr('class', 'lu-year').attr('y', 54).attr('text-anchor', 'middle');
    headText = svg.append('text').attr('class', 'lu-head').attr('y', 78).attr('text-anchor', 'middle')
      .text('MINUTES A DAY SPENT SOCIALIZING · EACH CLOCK IS ONE AVERAGE DAY');

    const arc = d3.arc().innerRadius(R0).outerRadius(R);
    cells = GROUPS.map((age) => {
      const g = svg.append('g').attr('class', 'lu-cell');
      g.append('circle').attr('class', 'lu-halo').attr('r', R + 26);   // only shows on the reader's own clock
      const pool = g.append('ellipse').attr('class', 'lu-pool').attr('cy', POOL_Y).attr('rx', 0).attr('ry', 0);
      const rim = g.append('path').attr('class', 'lu-rim');
      const drips = g.append('g').attr('filter', 'url(#lu-glow)');
      g.append('g').attr('class', 'lu-ticks').selectAll('line').data(d3.range(24)).join('line')
        .attr('x1', d => (R + 2) * Math.sin(d * Math.PI / 12)).attr('y1', d => -(R + 2) * Math.cos(d * Math.PI / 12))
        .attr('x2', d => (R + (d % 6 ? 4 : 7)) * Math.sin(d * Math.PI / 12)).attr('y2', d => -(R + (d % 6 ? 4 : 7)) * Math.cos(d * Math.PI / 12))
        .attr('stroke-width', d => (d % 6 ? 0.9 : 1.5));
      g.append('circle').attr('class', 'lu-day').attr('r', (R + R0) / 2).attr('stroke-width', R - R0);
      const wedge = g.append('path').attr('class', 'lu-social').attr('filter', 'url(#lu-glow)');
      const value = g.append('text').attr('class', 'lu-value').attr('y', 6).attr('text-anchor', 'middle');
      const name = g.append('text').attr('class', 'lu-name').attr('y', NAME_Y).attr('text-anchor', 'middle');
      const change = g.append('text').attr('class', 'lu-change').attr('y', CHANGE_Y).attr('text-anchor', 'middle');
      return { age, g, pool, rim, drips, wedge, value, name, change, arc };
    });
    relayout();
    addEventListener('resize', relayout);

    const c = d3.select(el).append('div').attr('class', 'lineup-controls');
    playBtn = c.append('button').attr('type', 'button').attr('id', 'lineup-play').text('Play 2003 → 2025')
      .on('click', () => (timer ? stop() : play()));
    slider = c.append('input').attr('type', 'range').attr('id', 'lineup-year')
      .attr('min', 2003).attr('max', 2025).attr('step', 1).attr('aria-label', 'Year, all six clocks')
      .on('input', function () {
        stop();
        let y = +this.value;
        if (y === 2020) y = year < 2020 ? 2021 : 2019;
        render(y);
        story.setYear(y, 'lineup');
      });
    out = c.append('output').attr('for', 'lineup-year').attr('class', 'lineup-out');
    d3.select(el).append('p').attr('class', 'lineup-note')
      .text('Each wedge is exact: minutes of socializing out of 1,440 in a day. The sag and the drips are proportional to the minutes that group has lost since 2003–04. This slider is shared with the scale above and the verdict below. BLS American Time Use Survey; no 2020 estimates.');
    built = true;
  }

  function render(y, { t = 420 } = {}) {
    if (!built || !valid(y)) return;
    year = y;
    yearText.text(y);
    cells.forEach(c => {
      const min = minutes(c.age, y), lost = lostBy(c.age, y);
      const half = (min / 1440) * Math.PI;              // half the wedge, in radians
      const sag = Math.min(SAG_MAX, lost * SAG_PER_MIN);
      const mine = c.age === story.you;

      c.g.classed('is-you', mine);
      c.name.text(mine ? `${story.ageName(c.age)} · you` : story.ageName(c.age));
      c.wedge.transition().duration(dur(t)).ease(d3.easeCubicInOut)
        .attrTween('d', () => k => {
          const h = (c._half == null ? half : c._half + (half - c._half) * k);
          return c.arc({ startAngle: Math.PI - h, endAngle: Math.PI + h });
        })
        .on('end', () => { c._half = half; });
      c.rim.transition().duration(dur(t)).ease(d3.easeCubicInOut).attr('d', rimPath(sag * 0.32));
      const rimY = RIM + sag * 0.32;
      c.drips.selectAll('path').data(DRIPS).join('path').attr('class', 'lu-drip')
        .transition().duration(dur(t)).ease(d3.easeCubicInOut)
        .attr('d', d => dripPath(d[0], rimY - 2 - Math.abs(d[0]) * 0.12, d[1], sag * d[2]));
      c.pool.transition().duration(dur(t)).attr('rx', lost > 0.5 ? 5 + lost * 0.9 : 0).attr('ry', lost > 0.5 ? 1.6 + lost * 0.1 : 0);
      c.value.text(`${Math.round(min)} min`);
      c.change.text(y <= 2004 ? '' : lost > 0.5 ? `−${Math.round(lost)} since 2003–04` : 'about the same');
    });
    if (slider) { slider.property('value', y); out.text(y); }
  }

  function summary(el) {
    const last = years().at(-1);
    const parts = GROUPS.map(a => `${story.ageName(a)}: ${Math.round(story.avg(story.series(a, SOCIAL), [2003, 2004]))} to ${Math.round(story.avg(story.series(a, SOCIAL), [last - 1, last]))} minutes a day`);
    svg.attr('aria-label', `Six clocks, one per age group, showing minutes a day spent socializing from 2003 to ${last}. ${parts.join('. ')}.`);
    d3.select(el).append('p').attr('class', 'sr-only').text(`Socializing, 2003–04 compared with ${last - 1}–${String(last).slice(2)}. ${parts.join('. ')}.`);
  }

  function stop() { if (timer) { timer.stop(); timer = null; } if (playBtn) playBtn.text('Play 2003 → 2025'); }
  function play() {
    stop();
    const ys = years();
    if (reduceMotion) { render(ys.at(-1), { t: 0 }); story.setYear(ys.at(-1), 'lineup'); return; }
    let i = 0;
    render(ys[0], { t: 0 });
    playBtn.text('Pause');
    timer = d3.interval(() => {
      i += 1;
      if (i >= ys.length) { stop(); story.setYear(ys.at(-1), 'lineup'); return; }
      render(ys[i], { t: 240 });
    }, 300);
  }

  story.chapter('lineup', {
    init(el) {
      build(el);
      summary(el);
      render(story.year && valid(story.year) ? story.year : 2003, { t: 0 });
    },
    step(n, dir) {
      if (!built) return;
      if (n === 0) { stop(); render(2003); }   // scroll states stay local; only the slider links the chapters
      if (n === 1 && dir === 'down') play();
      if (n === 1 && dir === 'up' && !timer) render(year);
    },
    age() { render(year, { t: 200 }); },     // re-marks the reader's own clock
    year(y) { if (!timer && valid(y)) render(y); },
  });
})();
