/*
 * Clue 3, continued · Who we lost time with
 * Owner: Chloe (Package 2). Only this package edits this file.
 *
 * Five lines, 2010 → 2025, all ages: waking minutes a day spent with friends, coworkers, own kids,
 * family elsewhere, and a spouse or partner. Ends are labeled directly (no legend) with two-year
 * averages, 2010–11 and 2024–25. Companion categories overlap, so the lines must not be added up.
 * "Who with" data starts in 2010 and isn't published by age for these companions, so this chapter
 * covers everyone 15 and older and ignores the "I'm…" menu.
 * One step: the lines draw in, with friends, spouse and coworkers (the three the copy names) lit.
 */
(function () {
  const START = [2010, 2011], END = [2024, 2025];
  const LINES = [
    { who: '03', id: 'spouse', name: 'Spouse or partner' },
    { who: '35', id: 'work', name: 'Coworkers' },
    { who: '36', id: 'kids', name: 'Own kids' },
    { who: '42', id: 'family', name: 'Family elsewhere' },
    { who: '43', id: 'friends', name: 'Friends' },
  ];
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { drawn: false };
  let root, plot, svg, grid, xAxis, yAxis, paths, marks, summary;

  const series = d => story.data.who[`${d.who}|000|00`];
  const lit = d => ['friends', 'spouse', 'work'].includes(d.id);

  function render(animate = false) {
    if (!root) return;
    const width = Math.max(260, plot.clientWidth), height = Math.max(240, plot.clientHeight);
    const narrow = width < 450;
    const left = 40, right = narrow ? 96 : 176, top = 24, bottom = height - 26;
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    const years = story.data.years.filter(y => y >= 2010);
    const x = d3.scaleLinear().domain([2010, 2025]).range([left, width - right]);
    const y = d3.scaleLinear().domain([0, 180]).range([bottom, top]);

    grid.selectAll('line').data([0, 60, 120, 180]).join('line').attr('class', 'who-gridline')
      .attr('x1', left).attr('x2', x(2025)).attr('y1', y).attr('y2', y);
    xAxis.attr('transform', `translate(0,${bottom})`)
      .call(d3.axisBottom(x).tickValues(narrow ? [2010, 2015, 2020, 2025] : [2010, 2013, 2016, 2019, 2022, 2025]).tickFormat(d3.format('d')).tickSize(0).tickPadding(8))
      .call(g => g.select('.domain').remove());
    yAxis.attr('transform', `translate(${left},0)`)
      .call(d3.axisLeft(y).tickValues([0, 60, 120, 180]).tickSize(0).tickPadding(8))
      .call(g => g.select('.domain').remove());
    svg.select('.who-unit').attr('x', left).attr('y', top - 10).text('waking min/day with…, all ages');
    svg.select('.who-gap').attr('x', x(2020)).attr('y', bottom - 8).attr('text-anchor', 'middle').text('2020: no survey');

    const line = d3.line().defined(d => d[1] != null).x(d => x(d[0])).y(d => y(d[1]));
    const duration = animate && !state.drawn && !still() ? 1200 : 0;
    paths.selectAll('path').data(LINES, d => d.id).join('path')
      .attr('class', d => `who-line who-${d.id}`).classed('is-lit', lit)
      .attr('d', d => line(years.map(yr => [yr, series(d)[story.data.years.indexOf(yr)]])))
      .each(function () {
        if (!duration) return;
        const len = this.getTotalLength();
        d3.select(this).attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
          .transition().duration(duration).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0)
          .on('end', function () { d3.select(this).attr('stroke-dasharray', null); });
      });
    if (duration) state.drawn = true;

    // End labels, nudged apart so they never overlap
    const ends = LINES.map(d => ({ ...d, a: story.avg(series(d), START), b: story.avg(series(d), END) }));
    const placed = ends.map(d => ({ d, y: y(d.b) })).sort((p, q) => p.y - q.y);
    placed.forEach((p, i) => { if (i && p.y - placed[i - 1].y < 15) p.y = placed[i - 1].y + 15; });
    const label = marks.selectAll('g.who-end').data(placed, p => p.d.id).join(enter => {
      const g = enter.append('g').attr('class', 'who-end');
      g.append('circle').attr('class', 'a').attr('r', 3.5); g.append('circle').attr('class', 'b').attr('r', 3.5);
      g.append('text').attr('class', 'start'); g.append('text').attr('class', 'name');
      return g;
    });
    label.attr('data-line', p => p.d.id).classed('is-lit', p => lit(p.d))
      .style('opacity', 0).transition().delay(duration).duration(duration ? 400 : 0).style('opacity', 1);
    label.select('.a').attr('cx', x(2010.5)).attr('cy', p => y(p.d.a));
    label.select('.b').attr('cx', x(2024.5)).attr('cy', p => y(p.d.b));
    // Start labels: nudged apart the same way
    const starts = ends.map(d => ({ id: d.id, y: y(d.a) - 7 })).sort((p, q) => p.y - q.y);
    starts.forEach((p, i) => { if (i && p.y - starts[i - 1].y < 13) p.y = starts[i - 1].y + 13; });
    const startY = Object.fromEntries(starts.map(p => [p.id, p.y]));
    label.select('.start').attr('x', x(2010.5) + 7).attr('y', p => startY[p.d.id]).text(p => Math.round(p.d.a));
    label.select('.name').attr('x', x(2025) + 8).attr('y', p => p.y + 4)
      .text(p => `${narrow ? p.d.name.split(' ')[0] : p.d.name} ${Math.round(p.d.b)}`);

    const f = ends.find(d => d.id === 'friends'), s = ends.find(d => d.id === 'spouse'), w = ends.find(d => d.id === 'work');
    summary.textContent = `2010–11 → 2024–25: friends ${Math.round(f.a)} → ${Math.round(f.b)}, spouse ${Math.round(s.a)} → ${Math.round(s.b)}, coworkers ${Math.round(w.a)} → ${Math.round(w.b)} min/day.`;
    svg.attr('aria-label', `Waking minutes a day spent with each kind of company, all ages, 2010–11 to 2024–25. ${ends.map(d => `${d.name}: ${Math.round(d.a)} to ${Math.round(d.b)}`).join('. ')}.`);
  }

  story.chapter('who', {
    init(el) {
      root = document.createElement('div');
      root.className = 'who-panel';
      root.innerHTML = `<p class="who-heading">Who we spend waking time with <span class="chart-tag">All ages 15+</span></p>
        <p class="who-summary"></p>
        <div class="who-plot"></div>
        <p class="who-caption">American Time Use Survey, BLS. Waking minutes a day in the company of each group, from 2010 ("who with" data starts then). Groups overlap, so the lines don't add up. Numbers at the ends average two survey years. No estimates exist for 2020.</p>`;
      el.append(root);
      plot = root.querySelector('.who-plot');
      summary = root.querySelector('.who-summary');
      svg = d3.select(plot).append('svg').attr('role', 'img');
      grid = svg.append('g').attr('aria-hidden', 'true');
      xAxis = svg.append('g').attr('class', 'axis').attr('aria-hidden', 'true');
      yAxis = svg.append('g').attr('class', 'axis').attr('aria-hidden', 'true');
      svg.append('text').attr('class', 'who-unit').attr('aria-hidden', 'true');
      svg.append('text').attr('class', 'who-gap').attr('aria-hidden', 'true');
      paths = svg.append('g').attr('aria-hidden', 'true');
      marks = svg.append('g').attr('aria-hidden', 'true');
      new ResizeObserver(() => render()).observe(plot);
      render();
    },
    step() { render(true); },
  });
})();
