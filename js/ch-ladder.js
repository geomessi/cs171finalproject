/*
 * The answer · "The hours you have to choose" (NOVEL VIEW)
 * Owner: Mariah. The chapter the whole story is built toward.
 *
 * Five kinds of company, ordered by how much of a decision it takes to see that person.
 * Every row starts at ITS OWN 2010–11 level, drawn as 20 figures, so the rows are directly
 * comparable: what you are reading across a row is the SHARE of that company's time that is
 * gone, not its absolute size. The absolute minutes are printed on every row so nothing is
 * hidden by the normalisation — the honest version of "make it comparable".
 *
 * The payoff is that the staircase only goes one way: 0 figures leave the spouse row,
 * 10 leave the friends row, and the rows in between fall in order of how optional they are.
 *
 * Data: the ATUS companion series, all ages 15+, published from 2010 only. See methods.
 */
(function () {
  const RUNGS = [
    { code: '03', name: 'Spouse or partner', why: 'No deciding at all. They’re in the room.' },
    { code: '24', name: 'Family in your household', why: 'No deciding. Same house.' },
    { code: '35', name: 'Coworkers', why: 'Assigned — but you have to go there.' },
    { code: '42', name: 'Family elsewhere', why: 'A choice, with obligation behind it.' },
    { code: '43', name: 'Friends', why: 'Pure choice. Nobody makes you.' },
  ];
  const N = 20;                      // figures per row: each row starts at its own 2010 level
  const BASE = [2010, 2011], NOW = [2024, 2025];
  const W = 940, ROW_H = 96, PAD_T = 66, LABEL_W = 268, FIG_W = 25;
  const H = PAD_T + RUNGS.length * ROW_H + 34;

  let svg, rows = [], yearText, slider, playBtn, out, timer = null, year = 2010, built = false, focus = -1;

  const series = code => story.data.who[`${code}|000|00`];
  const at = (code, y) => series(code)?.[story.data.years.indexOf(y)];
  const base = code => story.avg(series(code), BASE);

  // Smoothed over three years so one noisy estimate doesn't make figures flicker in and out.
  function level(code, y) {
    const s = series(code), ys = story.data.years;
    const near = [y - 1, y, y + 1].map(t => s[ys.indexOf(t)]).filter(v => v != null);
    return near.length ? d3.mean(near) : null;
  }
  const share = (code, y) => {        // share of the 2010–11 level still there
    const l = level(code, y), b = base(code);
    return l == null || !b ? 1 : Math.min(1.08, l / b);
  };

  // One walker, the same figure used everywhere else on the site.
  function figure(g) {
    g.append('circle').attr('class', 'ld-head').attr('cx', 0).attr('cy', -17).attr('r', 4.1);
    g.append('path').attr('class', 'ld-body').attr('d', 'M0,-12.4 L0,2 M0,-8 L-5.4,-1.4 M0,-8 L5.4,-1.4 M0,2 L-4.6,13 M0,2 L4.6,13');
  }

  function build(el) {
    el.classList.add('ladder-viz');
    svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img');

    yearText = svg.append('text').attr('class', 'ld-year year-big').attr('x', W - 6).attr('y', 38).attr('text-anchor', 'end');
    svg.append('text').attr('class', 'ld-head-left').attr('x', 0).attr('y', 24)
      .text('HOW MUCH OF A DECISION IT TAKES TO SEE THEM');
    svg.append('text').attr('class', 'ld-head-left').attr('x', 0).attr('y', 42).attr('opacity', .72)
      .text('Each row starts at its own 2010–11 level · one figure ≈ 5% of that row');

    // the arrow down the left edge: less choosing at the top, more at the bottom
    svg.append('path').attr('class', 'ld-axis')
      .attr('d', `M6,${PAD_T + 14} L6,${PAD_T + RUNGS.length * ROW_H - 18}`);
    svg.append('path').attr('class', 'ld-axis-head')
      .attr('d', `M6,${PAD_T + RUNGS.length * ROW_H - 10} l-4,-9 l8,0 Z`);

    rows = RUNGS.map((r, i) => {
      const y0 = PAD_T + i * ROW_H;
      const g = svg.append('g').attr('class', 'ld-row').attr('transform', `translate(0,${y0})`);
      g.append('rect').attr('class', 'ld-rowbg').attr('x', 18).attr('y', -6).attr('width', W - 18).attr('height', ROW_H - 16).attr('rx', 8);
      g.append('text').attr('class', 'ld-name').attr('x', 30).attr('y', 24).text(r.name);
      g.append('text').attr('class', 'ld-why').attr('x', 30).attr('y', 44).text(r.why);
      const figs = g.append('g').attr('class', 'ld-figs').attr('transform', `translate(${LABEL_W + 30},34)`);
      figs.selectAll('g').data(d3.range(N)).join('g')
        .attr('transform', d => `translate(${d * FIG_W},0)`)
        .attr('class', 'ld-fig').call(figure);
      const mins = g.append('text').attr('class', 'ld-mins').attr('x', LABEL_W + 30 + N * FIG_W + 18).attr('y', 28);
      const pct = g.append('text').attr('class', 'ld-pct').attr('x', LABEL_W + 30 + N * FIG_W + 18).attr('y', 48);
      return { ...r, g, figs, mins, pct };
    });

    const c = d3.select(el).append('div').attr('class', 'ladder-controls');
    playBtn = c.append('button').attr('type', 'button').text('Play 2010 → 2025')
      .on('click', () => (timer ? stop() : play()));
    slider = c.append('input').attr('type', 'range').attr('id', 'ladder-year')
      .attr('min', 2010).attr('max', 2025).attr('step', 1).attr('value', 2010)
      .attr('aria-label', 'Year')
      .on('input', function () { stop(); let y = +this.value; if (y === 2020) y = year < 2020 ? 2021 : 2019; render(y); });
    out = c.append('output').attr('class', 'ladder-out').text('2010');

    story.howto(el, 'Drag the slider, or press play. Watch how many figures leave each row.');
    d3.select(el).append('p').attr('class', 'ladder-note')
      .text('Rows are normalised: each starts at its own 2010–11 level so the share lost can be compared across them. Actual minutes a day are printed on the right. ATUS companion series, all ages 15 and over; no 2020 estimate. Categories can overlap and should not be added together.');
    built = true;
  }

  function render(y, { t = 480 } = {}) {
    if (!built) return;
    year = y;
    yearText.text(y);
    if (slider) { slider.property('value', y); out.text(y); }
    rows.forEach((r, i) => {
      const sh = share(r.code, y);
      const staying = Math.round(N * sh);
      const now = level(r.code, y), b = base(r.code);
      r.figs.selectAll('.ld-fig')
        .transition().duration(story.reduceMotion ? 0 : t).delay((d) => (story.reduceMotion ? 0 : d * 14))
        .attr('opacity', 1)
        .on('start', function (d) { d3.select(this).classed('is-gone', d >= staying); });
      r.mins.text(now == null ? '—' : `${Math.round(b)} → ${Math.round(now)} min/day`);
      const lost = b ? (now - b) / b : 0;
      r.pct.text(now == null ? '' : Math.abs(lost) < 0.015 ? 'unchanged' : `${lost > 0 ? '+' : '−'}${Math.abs(Math.round(lost * 100))}%`)
        .classed('is-flat', Math.abs(lost) < 0.015);
      r.g.classed('is-focus', focus === i).classed('is-dim', focus >= 0 && focus !== i);
    });
  }

  function summary(el) {
    const parts = RUNGS.map(r => `${r.name}: ${Math.round(base(r.code))} to ${Math.round(story.avg(series(r.code), NOW))} minutes a day`);
    svg.attr('aria-label', `Five kinds of company, ordered by how much of a decision it takes to see that person, from 2010–11 to 2024–25. ${parts.join('. ')}. The more a relationship depends on a decision, the more of its time is gone.`);
    d3.select(el).append('p').attr('class', 'sr-only')
      .text(`Minutes a day with each kind of company, 2010–11 compared with 2024–25. ${parts.join('. ')}.`);
  }

  function stop() { if (timer) { timer.stop(); timer = null; } if (playBtn) playBtn.text('Play 2010 → 2025'); }
  function play() {
    stop();
    const ys = story.data.years.filter(y => y >= 2010 && y !== 2020);
    if (story.reduceMotion) { render(ys.at(-1), { t: 0 }); return; }
    let i = 0;
    render(ys[0], { t: 0 });
    playBtn.text('Pause');
    timer = d3.interval(() => {
      i += 1;
      if (i >= ys.length) { stop(); return; }
      render(ys[i], { t: story.PLAY_MS * 0.6 });
    }, story.PLAY_MS);
  }

  story.chapter('ladder', {
    init(el) { build(el); summary(el); render(2010, { t: 0 }); },
    step(n, dir) {
      if (!built) return;
      if (n === 0) { stop(); focus = -1; render(2010); }
      else if (n >= 1 && n <= 5) { stop(); focus = n - 1; render(2024); }   // one rung at a time, at the end state
      else if (n === 6) { focus = -1; if (dir === 'down') play(); else render(year); }
    },
  });
})();
