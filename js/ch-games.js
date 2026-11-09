/*
 * Chapter 7 · The one that didn't walk
 * Owner: Chloe (Package 2). Only this package edits this file.
 *
 * Two lines, 2003–2025, ages 20–24: socializing (pink) and playing games / using a computer for
 * fun (600058). BLS doesn't publish 600058 for 15–24, so this one chapter uses 20–24 and ignores
 * the "I'm…" menu. The crossing year is found from the data: the first year after which games
 * stay at or above socializing.
 * Steps:
 *   0: both lines draw in, endpoints and the crossing labeled
 *   1: the limit of the claim is written on the chart
 */
(function () {
  const AGE = '020', GAMES = '600058', SOCIAL = '600024';
  const START = [2003, 2004], END = [2024, 2025];
  const LINES = [
    { code: SOCIAL, id: 'social', name: 'Socializing' },
    { code: GAMES, id: 'games', name: 'Games & computer for fun' },
  ];
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { step: 0, drawn: false };
  let root, plot, svg, grid, xAxis, yAxis, paths, marks, summary, note;

  const series = code => story.series(AGE, code);
  function crossing() {
    const years = story.data.years, g = series(GAMES), s = series(SOCIAL);
    let found = null;
    for (let i = years.length - 1; i >= 0; i--) {
      if (g[i] == null || s[i] == null) continue;
      if (g[i] >= s[i]) found = years[i]; else break;
    }
    return found;
  }

  function render(animate = false) {
    if (!root) return;
    const width = Math.max(260, plot.clientWidth), height = Math.max(220, plot.clientHeight);
    const left = 40, right = width < 450 ? 64 : 150, top = 28, bottom = height - 26;
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    const years = story.data.years;
    const x = d3.scaleLinear().domain([2003, 2025]).range([left, width - right]);
    const y = d3.scaleLinear().domain([0, 90]).range([bottom, top]);

    grid.selectAll('line').data([0, 30, 60, 90]).join('line').attr('class', 'games-gridline')
      .attr('x1', left).attr('x2', x(2025)).attr('y1', y).attr('y2', y);
    xAxis.attr('transform', `translate(0,${bottom})`)
      .call(d3.axisBottom(x).tickValues(width < 450 ? [2003, 2014, 2025] : [2003, 2008, 2013, 2018, 2025]).tickFormat(d3.format('d')).tickSize(0).tickPadding(8))
      .call(g => g.select('.domain').remove());
    yAxis.attr('transform', `translate(${left},0)`)
      .call(d3.axisLeft(y).tickValues([0, 30, 60, 90]).tickSize(0).tickPadding(8))
      .call(g => g.select('.domain').remove());
    svg.select('.games-unit').attr('x', left).attr('y', top - 14).text('min/day, ages 20–24');
    svg.select('.games-gap').attr('x', x(2020)).attr('y', bottom - 8).attr('text-anchor', 'middle').text('2020: no survey');

    const line = d3.line().defined(d => d[1] != null).x(d => x(d[0])).y(d => y(d[1]));
    const duration = animate && !state.drawn && !still() ? 1200 : 0;
    paths.selectAll('path').data(LINES, d => d.id).join('path')
      .attr('class', d => `games-line games-${d.id}`)
      .attr('d', d => line(years.map((yr, i) => [yr, series(d.code)[i]])))
      .each(function () {
        if (!duration) return;
        const len = this.getTotalLength();
        d3.select(this).attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
          .transition().duration(duration).ease(d3.easeCubicInOut).attr('stroke-dashoffset', 0)
          .on('end', function () { d3.select(this).attr('stroke-dasharray', null); });
      });
    if (duration) state.drawn = true;

    // Endpoint dots average two survey years, placed at the middle of each pair; line ends get direct labels.
    const ends = LINES.flatMap(d => [
      { id: `${d.id}-a`, line: d, year: 2003.5, v: story.avg(series(d.code), START), first: true },
      { id: `${d.id}-b`, line: d, year: 2024.5, v: story.avg(series(d.code), END), first: false },
    ]);
    const end = marks.selectAll('g.games-end').data(ends, d => d.id).join(enter => {
      const g = enter.append('g').attr('class', 'games-end');
      g.append('circle').attr('r', 4.5); g.append('text');
      return g;
    });
    end.attr('data-line', d => d.line.id).attr('transform', d => `translate(${x(d.year)},${y(d.v)})`)
      .style('opacity', 0).transition().delay(duration).duration(duration ? 400 : 0).style('opacity', 1);
    end.select('text').attr('text-anchor', d => (d.first ? 'start' : 'end')).attr('x', d => (d.first ? 8 : -8))
      .attr('y', d => (d.line.id === 'games' ? 18 : -10)).text(d => Math.round(d.v));
    const last = years.indexOf(2025);
    marks.selectAll('text.games-label').data(LINES, d => d.id).join('text')
      .attr('class', d => `games-label games-${d.id}`).attr('x', x(2025) + 8)
      .attr('y', d => y(series(d.code)[last]) + 4).text(d => (width < 450 ? (d.id === 'games' ? 'Games' : 'Social') : d.name));

    const cross = crossing();
    const cx = x(cross), cy = y(series(GAMES)[years.indexOf(cross)]);
    marks.selectAll('g.games-cross').data(cross ? [cross] : []).join(enter => {
      const g = enter.append('g').attr('class', 'games-cross');
      g.append('line'); g.append('text').attr('class', 'a'); g.append('text').attr('class', 'b');
      return g;
    }).each(function () {
      const g = d3.select(this);
      g.select('line').attr('x1', cx).attr('x2', cx).attr('y1', cy - 8).attr('y2', top + 4);
      g.select('.a').attr('x', cx - 6).attr('y', top + 8).attr('text-anchor', 'end').text(`${cross}: games pass socializing`);
      g.select('.b').attr('x', cx - 6).attr('y', top + 22).attr('text-anchor', 'end').text('and stay ahead');
    }).style('opacity', 0).transition().delay(duration).duration(duration ? 400 : 0).style('opacity', 1);

    note.style('opacity', state.step >= 1 ? 1 : 0);
    const g0 = story.avg(series(GAMES), START), g1 = story.avg(series(GAMES), END);
    const s0 = story.avg(series(SOCIAL), START), s1 = story.avg(series(SOCIAL), END);
    summary.textContent = `Ages 20–24, 2003–04 → 2024–25: games and computer use ${Math.round(g0)} → ${Math.round(g1)} min/day; socializing ${Math.round(s0)} → ${Math.round(s1)}.`;
    svg.attr('aria-label', `${summary.textContent} Games passed socializing in ${cross} and stayed ahead. The survey can't say one replaced the other.`);
  }

  story.chapter('games', {
    init(el) {
      root = document.createElement('div');
      root.className = 'games-panel';
      root.innerHTML = `<p class="games-heading">Games and computer use vs. socializing <span class="chart-tag">Ages 20–24</span></p>
        <p class="games-summary"></p>
        <div class="games-plot"></div>
        <p class="games-note">Two lines moved in opposite directions. The survey records what people did, not what they would have done instead.</p>
        <p class="games-caption">American Time Use Survey, BLS. "Playing games and computer use for leisure" isn't published for 15–24, so this chapter uses 20–24. Endpoint dots average two survey years. No estimates exist for 2020.</p>`;
      el.append(root);
      plot = root.querySelector('.games-plot');
      summary = root.querySelector('.games-summary');
      note = d3.select(root.querySelector('.games-note'));
      svg = d3.select(plot).append('svg').attr('role', 'img');
      grid = svg.append('g').attr('aria-hidden', 'true');
      xAxis = svg.append('g').attr('class', 'axis').attr('aria-hidden', 'true');
      yAxis = svg.append('g').attr('class', 'axis').attr('aria-hidden', 'true');
      svg.append('text').attr('class', 'games-unit').attr('aria-hidden', 'true');
      svg.append('text').attr('class', 'games-gap').attr('aria-hidden', 'true');
      paths = svg.append('g').attr('aria-hidden', 'true');
      marks = svg.append('g').attr('aria-hidden', 'true');
      new ResizeObserver(() => render()).observe(plot);
      render();
    },
    step(n) { state.step = Math.max(0, Math.min(1, n)); render(true); },
  });
})();
