/*
 * Chapter 5 · Alone or together (DRAFT)
 * Owner: Chloe (Package 2). Only this package edits this file.
 *
 * Waking time alone vs. with others, ages 20–24, 2010–2025 (BLS "who with" data starts in 2010).
 * Steps:
 *   0: the "alone" line draws in, endpoints 2010–11 → 2024–25
 *   1: the "with others" line joins, with its drop labeled
 * Hover, tap or arrow keys inspect one year. Always ages 20–24: the age bands differ
 * from the activity data, so it ignores the "I'm…" menu.
 */
(function () {
  const YEARS = d3.range(2010, 2026);
  const START = [2010, 2011], END = [2024, 2025];
  const LINES = [
    { key: '01|020|00', id: 'alone', name: 'Alone' },
    { key: '02|020|00', id: 'others', name: 'With others' },
  ];
  const hm = v => `${Math.floor(Math.round(v) / 60)}h${String(Math.round(v) % 60).padStart(2, '0')}m`;
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { step: -1, year: null };   // -1 until the chapter first scrolls into view
  let root, plot, svg, grid, xAxis, yAxis, clip, paths, ends, cursor, input, summary, inspection, x, y, bottom;

  const value = (line, year) => story.data.who[line.key][story.data.years.indexOf(year)];
  const avg = (line, years) => story.avg(story.data.who[line.key], years);
  const visible = () => LINES.slice(0, state.step + 1);

  function render(animate = false) {
    if (!root) return;
    const width = Math.max(260, plot.clientWidth), height = Math.max(220, plot.clientHeight);
    const left = 44, right = width < 450 ? 78 : 96, top = 30;
    bottom = height - 26;
    x = d3.scaleLinear().domain([2010, 2025]).range([left, width - right]);
    y = d3.scaleLinear().domain([0, 720]).range([bottom, top]);
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const hours = [0, 120, 240, 360, 480, 600, 720];
    grid.selectAll('line').data(hours).join('line').attr('class', 'alone-gridline')
      .attr('x1', left).attr('x2', x(2025)).attr('y1', y).attr('y2', y);
    xAxis.attr('transform', `translate(0,${bottom})`)
      .call(d3.axisBottom(x).tickValues(width < 450 ? [2010, 2015, 2020, 2025] : [2010, 2013, 2016, 2019, 2022, 2025])
        .tickFormat(d3.format('d')).tickSize(0).tickPadding(8))
      .call(g => g.select('.domain').remove());
    yAxis.attr('transform', `translate(${left},0)`)
      .call(d3.axisLeft(y).tickValues(hours).tickFormat(d => `${d / 60}h`).tickSize(0).tickPadding(8))
      .call(g => g.select('.domain').remove());
    svg.select('.alone-unit').attr('x', left).attr('y', top - 14).text('waking hours/day');
    svg.select('.alone-gap').attr('x', x(2020)).attr('y', bottom - 8).attr('text-anchor', 'middle').text('no 2020 data');

    const duration = animate && !still() ? 1100 : 0;
    const line = d3.line().defined(d => d[1] != null).x(d => x(d[0])).y(d => y(d[1]));
    clip.attr('x', left - 6).attr('y', 0).attr('height', height).attr('width', x(2025) - left + 12);
    paths.selectAll('path').data(LINES, d => d.id).join('path')
      .attr('class', d => `alone-line alone-${d.id}`)
      .attr('d', d => line(YEARS.map(year => [year, value(d, year)])))
      .each(function (d) {
        const path = d3.select(this), on = visible().includes(d), len = this.getTotalLength();
        path.interrupt();
        if (on && duration && path.style('opacity') !== '1') {
          path.style('opacity', 1).attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
            .transition().duration(duration).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0)
            .on('end', () => path.attr('stroke-dasharray', null));
        } else {
          path.attr('stroke-dasharray', null).attr('stroke-dashoffset', null).style('opacity', on ? 1 : 0);
        }
      });

    // Endpoints are two-year averages, placed at the midpoint of each pair.
    const points = visible().flatMap(d => [
      { id: `${d.id}-a`, line: d, year: 2010.5, v: avg(d, START), first: true },
      { id: `${d.id}-b`, line: d, year: 2024.5, v: avg(d, END), first: false },
    ]);
    const point = ends.selectAll('g').data(points, d => d.id).join(enter => {
      const g = enter.append('g').style('opacity', 0);
      g.append('circle').attr('r', 4.5);
      g.append('text').attr('class', 'alone-end-value');
      return g;
    });
    point.attr('class', d => `alone-end alone-${d.line.id}`)
      .attr('transform', d => `translate(${x(d.year)},${y(d.v)})`)
      .transition().delay(d => (d.first ? 0 : duration)).duration(duration ? 450 : 0).style('opacity', 1);
    point.select('text').attr('text-anchor', d => (d.first ? 'start' : 'end'))
      .attr('x', d => (d.first ? 8 : -8)).attr('y', -10).text(d => hm(d.v));

    // Direct labels at the right edge instead of a legend.
    const i = story.data.years.indexOf(2025);
    svg.select('.alone-labels').selectAll('text').data(visible(), d => d.id).join('text')
      .attr('class', d => `alone-label alone-${d.id}`)
      .attr('x', x(2025) + 10).attr('y', d => y(story.data.who[d.key][i]) + 4).text(d => d.name);

    const [alone, others] = LINES;
    const a0 = avg(alone, START), a1 = avg(alone, END), o0 = avg(others, START), o1 = avg(others, END);
    summary.textContent = state.step < 1
      ? `Ages 20–24, alone: ${hm(a0)} → ${hm(a1)} a day (+${hm(a1 - a0)}).`
      : `Ages 20–24, with others: ${hm(o0)} → ${hm(o1)} a day (−${hm(o0 - o1)}). All ages, with friends: ${hm(story.avg(story.data.who['43|000|00'], START))} → ${hm(story.avg(story.data.who['43|000|00'], END))}.`;
    input.attr('x', left).attr('y', top).attr('width', x(2025) - left).attr('height', bottom - top);
    drawInspection();
  }

  function inspect(year) { state.year = year; drawInspection(); }
  function drawInspection() {
    const { year } = state;
    cursor.attr('display', year == null ? 'none' : null);
    if (year != null) {
      cursor.select('line').attr('x1', x(year)).attr('x2', x(year)).attr('y1', y(720)).attr('y2', bottom);
      cursor.selectAll('circle').data(visible(), d => d.id).join('circle').attr('r', 4.5)
        .attr('class', d => `alone-${d.id}`)
        .attr('display', d => (value(d, year) == null ? 'none' : null))
        .attr('cx', x(year)).attr('cy', d => y(value(d, year) ?? 0));
    }
    const parts = year == null ? [] : visible().map(d => value(d, year) == null ? null : `${d.name.toLowerCase()} ${hm(value(d, year))}`);
    const text = year == null ? 'Hover or tap the chart, or focus it and use ← / → to read one year.'
      : parts.includes(null) ? `${year}: no ATUS estimate was published.`
      : `${year} · Ages 20–24 · ${parts.join(', ')}`;
    inspection.textContent = text;
    input.attr('aria-valuenow', year ?? 2025).attr('aria-valuetext', text);
  }

  story.chapter('alone', {
    init(el) {
      root = document.createElement('div');
      root.className = 'alone-panel';
      root.innerHTML = `<p class="alone-heading">Waking time alone vs. with others</p><p class="alone-summary"></p>
        <div class="alone-plot"></div><p class="alone-inspection"></p>
        <p class="alone-caption">American Time Use Survey, BLS. Waking hours by who you're with; "who with" data starts in 2010 and categories can overlap. Endpoint dots average two survey years. No estimates exist for 2020.</p>`;
      el.append(root);
      plot = root.querySelector('.alone-plot');
      summary = root.querySelector('.alone-summary');
      inspection = root.querySelector('.alone-inspection');
      svg = d3.select(plot).append('svg').attr('role', 'group').attr('aria-label', 'Waking hours alone vs. with others, ages 20–24, 2010–2025');
      grid = svg.append('g').attr('aria-hidden', 'true');
      xAxis = svg.append('g').attr('class', 'axis').attr('aria-hidden', 'true');
      yAxis = svg.append('g').attr('class', 'axis').attr('aria-hidden', 'true');
      svg.append('text').attr('class', 'alone-unit').attr('aria-hidden', 'true');
      svg.append('text').attr('class', 'alone-gap').attr('aria-hidden', 'true');
      clip = svg.append('defs').append('clipPath').attr('id', 'alone-clip').append('rect');
      paths = svg.append('g').attr('clip-path', 'url(#alone-clip)').attr('aria-hidden', 'true');
      svg.append('g').attr('class', 'alone-labels').attr('aria-hidden', 'true');
      ends = svg.append('g').attr('aria-hidden', 'true');
      cursor = svg.append('g').attr('class', 'alone-cursor').attr('aria-hidden', 'true');
      cursor.append('line');
      input = svg.append('rect').attr('class', 'alone-input').attr('fill', 'transparent').attr('tabindex', 0)
        .attr('role', 'slider').attr('aria-label', 'Inspect one year').attr('aria-valuemin', 2010).attr('aria-valuemax', 2025)
        .on('pointermove click', event => {
          if (event.type === 'pointermove' && event.pointerType === 'touch') return;
          const [px] = d3.pointer(event, svg.node());
          inspect(Math.max(2010, Math.min(2025, Math.round(x.invert(px)))));
        })
        .on('pointerleave', function () { if (document.activeElement !== this) inspect(null); })
        .on('focus', () => inspect(2025))
        .on('blur', () => inspect(null))
        .on('keydown', event => {
          const now = state.year ?? 2025;
          const next = { ArrowLeft: now - 1, ArrowDown: now - 1, ArrowRight: now + 1, ArrowUp: now + 1, Home: 2010, End: 2025 }[event.key];
          if (event.key === 'Escape') { inspect(null); return; }
          if (next == null) return;
          event.preventDefault();
          inspect(Math.max(2010, Math.min(2025, next)));
        });
      new ResizeObserver(() => render()).observe(plot);
      render();
    },
    step(n) { state.step = Math.max(0, Math.min(1, n)); state.year = null; render(true); },
  });
})();
