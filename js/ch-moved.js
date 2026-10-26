/*
 * Chapter 4 · Where the time went (FUNCTIONAL D3 #2)
 * Owner: Chloe (Package 2). Only this package edits this file.
 *
 * Diverging bars: change in minutes/day per activity, 2003–04 → a later two-year period.
 * Steps:
 *   0: all bars at zero
 *   1: bars grow, Working highlighted (−18)
 *   2: Watching TV highlighted (−34); Working stays as "cleared"
 *   3: Sleep (+39), Other leisure (+29) and Chores (+18) highlighted
 * Play animates the end period from 2004–05 to 2024–25; the slider picks one period.
 * Rows keep the order of the 2024–25 change so they don't jump around while playing.
 * Always ages 15–24, to match the step text. TODO (WORKPLAN.md): check the story for other ages.
 */
(function () {
  const START = [2003, 2004];
  const FIRST = 2005, LAST = 2025;
  const SOCIAL = '600024';
  const AGE = '103';   // 15–24; ignores the "I'm…" menu for now
  // Rows lit up in each step. Earlier suspects stay half-lit once they're "cleared".
  const FOCUS = { 0: [], 1: ['600013'], 2: ['600025'], 3: ['600001', 'leis', '600003'] };
  const SHORT = {
    '600001': 'Sleep & care', '600007': 'Care: household', '600010': 'Care: others', '600018': 'Shopping',
    'leis': 'Other leisure', '600030': 'Civic & religious', '600033': 'Calls & mail',
  };
  const fmt = v => { const r = Math.round(v); return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r); };
  const period = end => `${end - 1}–${String(end).slice(2)}`;
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { step: 0, end: LAST, shown: false, hover: null };
  let root, plot, svg, grid, xAxis, zero, rows, summary, readout, playBtn, slider, sliderOut, timer = null;

  function change(code, end) {
    const s = story.series(AGE, code);
    const a = story.avg(s, START), b = story.avg(s, [end - 1, end]);
    return a == null || b == null ? null : { a, b, d: b - a };
  }

  function emphasis(code) {
    if (code === SOCIAL) return 'social';
    if (FOCUS[state.step].includes(code)) return 'focus';
    for (let n = 1; n < state.step; n++) if (FOCUS[n].includes(code)) return 'cleared';
    return state.step === 0 ? 'cleared' : 'dim';
  }

  function render(animate = false) {
    if (!root) return;
    const width = Math.max(260, plot.clientWidth), height = Math.max(240, plot.clientHeight);
    const narrow = width < 450;
    const left = narrow ? 112 : 168, right = 44, top = 18, bottom = height - 26;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Fix the order and the scale for this age group, so playing through years only changes bar lengths.
    const order = story.DAY_PARTS.map(code => ({ code, final: change(code, LAST)?.d ?? 0 }))
      .sort((p, q) => q.final - p.final).map(r => r.code);
    let lim = 20;
    for (let end = FIRST; end <= LAST; end++) story.DAY_PARTS.forEach(code => { lim = Math.max(lim, Math.abs(change(code, end)?.d ?? 0)); });
    const x = d3.scaleLinear().domain([-lim, lim]).nice().range([left, width - right]);
    const y = d3.scaleBand().domain(order).range([top, bottom]).padding(0.28);

    const data = order.map(code => ({ code, name: story.ACTIVITIES[code].name, ...change(code, state.end) }));
    const duration = animate && !still() ? (timer ? 380 : 450) : 0;
    const ease = timer ? d3.easeLinear : d3.easeCubicInOut;

    grid.selectAll('line').data(x.ticks(6)).join('line').attr('class', 'moved-gridline')
      .attr('x1', x).attr('x2', x).attr('y1', top - 6).attr('y2', bottom);
    xAxis.attr('transform', `translate(0,${bottom})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => (d > 0 ? '+' : '') + d).tickSize(0).tickPadding(8))
      .call(g => g.select('.domain').remove());
    zero.attr('x1', x(0)).attr('x2', x(0)).attr('y1', top - 6).attr('y2', bottom);
    svg.select('.moved-unit').attr('x', width - right).attr('y', 8).attr('text-anchor', 'end').text('change, min/day');

    const row = rows.selectAll('g.moved-row').data(data, d => d.code).join(enter => {
      const g = enter.append('g').attr('class', 'moved-row').attr('tabindex', 0)
        .on('pointerenter focus', (e, d) => { state.hover = d.code; showReadout(); })
        .on('pointerleave blur', () => { state.hover = null; showReadout(); });
      g.append('rect').attr('class', 'moved-hit').attr('fill', 'transparent');
      g.append('rect').attr('class', 'moved-bar');
      g.append('text').attr('class', 'moved-name').attr('text-anchor', 'end');
      g.append('text').attr('class', 'moved-value');
      return g;
    });
    row.attr('data-em', d => emphasis(d.code)).attr('aria-label', d => `${d.name}: ${fmt(d.d)} min/day`)
      .interrupt().transition().duration(duration ? 450 : 0).ease(d3.easeCubicInOut)
      .attr('transform', d => `translate(0,${y(d.code)})`);
    row.select('.moved-hit').attr('x', 0).attr('y', -y.step() * y.padding() / 2).attr('width', width).attr('height', y.step());
    row.select('.moved-name').attr('x', left - 10).attr('y', y.bandwidth() / 2 + 4)
      .text(d => (narrow && SHORT[d.code]) || d.name);

    const grow = d => (state.shown ? d.d : 0);
    row.select('.moved-bar').attr('height', y.bandwidth())
      .classed('less', d => d.d < 0).classed('more', d => d.d >= 0)
      .interrupt().transition().duration(duration).ease(ease)
      .attr('x', d => x(Math.min(0, grow(d)))).attr('width', d => Math.abs(x(grow(d)) - x(0)));
    row.select('.moved-value').attr('y', y.bandwidth() / 2 + 4)
      .attr('text-anchor', d => (d.d < 0 ? 'end' : 'start'))
      .interrupt().transition().duration(duration).ease(ease)
      .attr('x', d => x(grow(d)) + (d.d < 0 ? -6 : 6))
      .style('opacity', state.shown ? null : 0)
      .text(d => fmt(d.d));

    const social = data.find(d => d.code === SOCIAL);
    summary.textContent = state.shown
      ? `Ages ${story.ageName(AGE)}, 2003–04 → ${period(state.end)}. Socializing ${fmt(social.d)} min/day.`
      : `Change in minutes per day since 2003–04, ages ${story.ageName(AGE)}.`;
    slider.property('value', state.end);
    sliderOut.text(period(state.end));
    showReadout(data);
  }

  function showReadout(data) {
    const d = state.hover && (data?.find(r => r.code === state.hover) || { name: story.ACTIVITIES[state.hover].name, ...change(state.hover, state.end) });
    readout.textContent = d
      ? `${d.name} · ${Math.round(d.a)} → ${Math.round(d.b)} min/day (${fmt(d.d)})`
      : 'Hover or tab to a bar for the exact minutes.';
    rows.selectAll('g.moved-row').classed('is-hover', r => r.code === state.hover);
  }

  function stop() {
    if (timer) { timer.stop(); timer = null; }
    playBtn.text('▶ Play 2005–2025');
  }

  function play() {
    if (timer) { stop(); return; }
    state.shown = true;
    if (still()) { state.end = LAST; render(); return; }
    playBtn.text('❚❚ Pause');
    timer = d3.interval(() => {
      state.end += 1;
      render(true);
      if (state.end >= LAST) stop();
    }, 400);
    state.end = FIRST;
    render(true);
  }

  story.chapter('moved', {
    init(el) {
      root = document.createElement('div');
      root.className = 'moved-panel';
      root.innerHTML = `<p class="moved-heading">What moved since 2003–04</p><p class="moved-summary"></p>
        <div class="moved-plot"></div>
        <div class="moved-controls">
          <button type="button" class="moved-play"></button>
          <label>2003–04 →<input type="range" min="${FIRST}" max="${LAST}" step="1"><output></output></label>
        </div>
        <p class="moved-readout"></p>
        <p class="moved-caption">American Time Use Survey, BLS. Each period averages two survey years; 2020 has no estimate, so periods that touch it use the other year. "Other leisure" includes games, computers and reading. Bars show what moved together, not what caused what.</p>`;
      el.append(root);
      plot = root.querySelector('.moved-plot');
      summary = root.querySelector('.moved-summary');
      readout = root.querySelector('.moved-readout');
      svg = d3.select(plot).append('svg').attr('role', 'group').attr('aria-label', 'Change in minutes per day by activity');
      grid = svg.append('g').attr('aria-hidden', 'true');
      xAxis = svg.append('g').attr('class', 'axis').attr('aria-hidden', 'true');
      svg.append('text').attr('class', 'moved-unit').attr('aria-hidden', 'true');
      rows = svg.append('g');
      zero = svg.append('line').attr('class', 'moved-zero');
      playBtn = d3.select(root.querySelector('.moved-play')).on('click', play);
      slider = d3.select(root.querySelector('input')).attr('aria-label', 'End period')
        .on('input', function () { stop(); state.shown = true; state.end = +this.value; render(); });
      sliderOut = d3.select(root.querySelector('output'));
      stop();
      new ResizeObserver(() => render()).observe(plot);
      render();
    },
    step(n) {
      stop();
      state.step = Math.max(0, Math.min(3, n));
      state.shown = state.step > 0;
      state.end = LAST;   // the step text quotes 2024–25
      render(true);
    },
  });
})();
