/*
 * Chapter 6 · Suspect: the kids
 * Owner: Chloe (Package 2). Only this package edits this file.
 *
 * Dumbbells: socializing in 2003–04 (hollow dot) and 2024–25 (pink dot) for parents of a child
 * under 18 and people with no kids at home, on all days, weekdays and weekends.
 * BLS doesn't cross parent status with age, so this chapter covers everyone 15 and older and
 * ignores the "I'm…" menu.
 * Steps:
 *   0: only the 2003–04 dots
 *   1: all days moves to 2024–25; parents get a CLEARED stamp
 *   2: weekdays and weekends move too
 *   3: the losses are labeled and "no kids at home" is lit
 */
(function () {
  const SOCIAL = '600024', START = [2003, 2004], END = [2024, 2025];
  const DAYS = [
    { day: '00', name: 'All days', step: 1 },
    { day: '19', name: 'Weekdays', step: 2 },
    { day: '16', name: 'Weekends', step: 2 },
  ];
  const GROUPS = [
    { par: '13', name: 'Parents of a child under 18', short: 'Parents' },
    { par: '01', name: 'No kids at home', short: 'No kids' },
  ];
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { step: 0 };
  let root, plot, svg, grid, xAxis, rows, heads, summary, data;

  const avg = (par, day, years) => story.avg(story.data.par[par][day][SOCIAL], years);
  const moved = d => state.step >= d.step;

  function render(animate = false) {
    if (!root) return;
    const width = Math.max(260, plot.clientWidth), height = Math.max(260, plot.clientHeight);
    const narrow = width < 450;
    const left = narrow ? 112 : 214, right = 64, top = 20, bottom = height - 26;
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    const x = d3.scaleLinear().domain([0, 80]).range([left, width - right]);
    // Three day blocks, each a heading plus two rows
    const block = (bottom - top) / DAYS.length, rowH = block / 3.2;
    const yRow = d => top + DAYS.indexOf(DAYS.find(v => v.day === d.day)) * block + rowH * (1.2 + GROUPS.findIndex(g => g.par === d.par));
    const duration = animate && !still() ? 700 : 0;

    grid.selectAll('line').data(x.ticks(4)).join('line').attr('class', 'parents-gridline')
      .attr('x1', x).attr('x2', x).attr('y1', top).attr('y2', bottom);
    xAxis.attr('transform', `translate(0,${bottom})`)
      .call(d3.axisBottom(x).ticks(4).tickSize(0).tickPadding(8))
      .call(g => g.select('.domain').remove());
    svg.select('.parents-unit').attr('x', width - right).attr('y', top - 6).attr('text-anchor', 'end').text('socializing, min/day');

    heads.selectAll('text').data(DAYS).join('text').attr('class', 'parents-day')
      .attr('x', 0).attr('y', (d, i) => top + i * block + rowH * 0.55).text(d => d.name);

    const row = rows.selectAll('g.parents-row').data(data, d => d.id).join(enter => {
      const g = enter.append('g').attr('class', 'parents-row');
      g.append('text').attr('class', 'parents-name').attr('text-anchor', 'end');
      g.append('line').attr('class', 'parents-link');
      g.append('circle').attr('class', 'parents-then').attr('r', 5);
      g.append('circle').attr('class', 'parents-now').attr('r', 6);
      g.append('text').attr('class', 'parents-value then');
      g.append('text').attr('class', 'parents-value now');
      g.append('text').attr('class', 'parents-loss');
      const stamp = g.append('g').attr('class', 'stamp');
      stamp.append('rect'); stamp.append('text').text('CLEARED');
      return g;
    });
    row.attr('transform', d => `translate(0,${yRow(d)})`)
      .attr('data-em', d => (state.step >= 3 ? (d.par === '01' ? 'focus' : 'dim') : null));
    row.select('.parents-name').attr('x', left - 12).attr('y', 4).text(d => (narrow ? d.short : d.name));
    row.select('.parents-then').attr('cx', d => x(d.a));
    row.select('.parents-value.then').attr('x', d => x(d.a) + 10).attr('y', 4).text(d => Math.round(d.a));
    const now = d => (moved(d) ? d.b : d.a);
    row.select('.parents-link').attr('x1', d => x(d.a)).attr('y1', 0).attr('y2', 0)
      .interrupt().transition().duration(duration).ease(d3.easeCubicInOut).attr('x2', d => x(now(d)));
    row.select('.parents-now').interrupt().transition().duration(duration).ease(d3.easeCubicInOut)
      .attr('cx', d => x(now(d))).style('opacity', d => (moved(d) ? 1 : 0));
    row.select('.parents-value.now').attr('text-anchor', 'end').attr('y', 4)
      .interrupt().transition().duration(duration).ease(d3.easeCubicInOut)
      .attr('x', d => x(now(d)) - 11).style('opacity', d => (moved(d) ? 1 : 0)).text(d => Math.round(d.b));
    row.select('.parents-loss').attr('x', width - right + 8).attr('y', 4)
      .style('opacity', d => (moved(d) && state.step >= 3 ? 1 : 0)).text(d => `−${Math.round(d.a - d.b)}`);
    // The suspect walks: a stamp on parents, all days, once their dots have moved
    row.select('.stamp').attr('transform', d => `translate(${x(d.a) + 34},0) rotate(-5)`)
      .style('opacity', d => (!narrow && d.par === '13' && d.day === '00' && moved(d) ? 1 : 0));   // no room on a phone
    row.select('.stamp rect').attr('x', -4).attr('y', -10).attr('width', 70).attr('height', 19).attr('rx', 3);
    row.select('.stamp text').attr('x', 31).attr('y', 4).attr('text-anchor', 'middle');

    const all = data.filter(d => d.day === '00'), wk = data.filter(d => d.day === '16');
    const loss = d => Math.round(d.a - d.b);
    summary.textContent = state.step < 1
      ? 'Socializing in 2003–04, all ages 15 and older, minutes per day.'
      : state.step < 2
        ? `All days: parents lost ${loss(all[0])} min/day; no kids at home lost ${loss(all[1])}.`
        : `Weekends: parents lost ${loss(wk[0])} min/day; no kids at home lost ${loss(wk[1])}.`;
    svg.attr('aria-label', `Socializing, 2003–04 to 2024–25. ${data.map(d => `${d.dayName}, ${d.name.toLowerCase()}: ${Math.round(d.a)} to ${Math.round(d.b)} minutes`).join('. ')}.`);
  }

  story.chapter('kids', {
    init(el) {
      data = DAYS.flatMap(d => GROUPS.map(g => ({
        id: `${d.day}-${g.par}`, day: d.day, dayName: d.name, step: d.step, par: g.par, name: g.name, short: g.short,
        a: avg(g.par, d.day, START), b: avg(g.par, d.day, END),
      })));
      root = document.createElement('div');
      root.className = 'parents-panel';
      root.innerHTML = `<p class="parents-heading">Socializing: parents vs. no kids at home <span class="chart-tag">All ages 15+</span></p>
        <p class="parents-summary"></p>
        <div class="parents-plot"></div>
        <p class="parents-key"><span class="key-then">2003–04</span><span class="key-now">2024–25</span></p>
        <p class="parents-caption">American Time Use Survey, BLS. Parents means an own child under 18 at home. BLS doesn't publish parent status by age, so this covers everyone 15 and older. Weekdays exclude holidays; weekends include them. Two-year averages.</p>`;
      el.append(root);
      plot = root.querySelector('.parents-plot');
      summary = root.querySelector('.parents-summary');
      svg = d3.select(plot).append('svg').attr('role', 'img');
      grid = svg.append('g').attr('aria-hidden', 'true');
      xAxis = svg.append('g').attr('class', 'axis').attr('aria-hidden', 'true');
      svg.append('text').attr('class', 'parents-unit').attr('aria-hidden', 'true');
      heads = svg.append('g').attr('aria-hidden', 'true');
      rows = svg.append('g').attr('aria-hidden', 'true');
      new ResizeObserver(() => render()).observe(plot);
      render();
    },
    step(n) { state.step = Math.max(0, Math.min(3, n)); render(true); },
  });
})();
