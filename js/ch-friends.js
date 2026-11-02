/* Mariah · The empty chair. Figures encode rounded minutes, never individual people. */
(function () {
  const format = n => d3.format('.1f')(n).replace(/\.0$/, '');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const steps = ['2010', '2019', '2021', 'recent'];
  let root, plot, svg, seats, picker, metric, label, summary, noData, series;
  let selected = '2010';
  let capacity;

  function reading() {
    const years = selected === 'recent' ? [2024, 2025] : [+selected];
    const values = years.map(year => series[story.data.years.indexOf(year)]);
    const value = values.every(n => Number.isFinite(n)) ? d3.mean(values) : null;
    return { value, count: value == null ? null : Math.round(value), period: selected === 'recent' ? '2024–25 average' : selected };
  }

  function draw(animate = false) {
    if (!root) return;
    const { value, count, period } = reading();
    const available = value != null;
    const width = Math.max(250, plot.clientWidth);
    const height = Math.max(210, plot.clientHeight);
    const cell = (width - 16) / 13;
    const rowGap = Math.min(54, (height - 40) / 5);
    const top = (height - rowGap * 5) / 2 + 12;
    picker.value = selected;
    root.dataset.period = selected;
    root.dataset.count = count == null ? '' : String(count);
    metric.textContent = available ? `${count} min/day` : 'No estimate';
    label.textContent = period;
    noData.hidden = available;
    svg.style('display', available ? null : 'none').attr('viewBox', `0 0 ${width} ${height}`)
      .attr('aria-label', available
        ? `Time with friends, all ages 15 and older: ${format(value)} minutes per day in ${period}, shown as ${count} figures rounded to whole minutes. The 2010 baseline has ${capacity} figures; empty chairs show the difference, not people who were tracked.`
        : 'No annual ATUS estimate is available for 2020.');
    summary.textContent = available
      ? `${period}: ${format(value)} min/day. ${capacity - count} empty chairs compared with 2010.`
      : 'No annual ATUS estimate was published for 2020. Choose another period.';

    // One long table folds into five rows. Its chairs stay put when figures leave.
    const tableRows = d3.range(5).map(i => ({ y: top + i * rowGap + 24, i }));
    svg.selectAll('.friends-table').data(tableRows).join('line').attr('class', 'friends-table')
      .attr('x1', 8).attr('x2', width - 8).attr('y1', d => d.y).attr('y2', d => d.y);
    svg.selectAll('.friends-table-end').data(tableRows.slice(0, -1)).join('path').attr('class', 'friends-table-end')
      .attr('d', d => {
        const x = d.i % 2 ? 8 : width - 8;
        const edge = d.i % 2 ? 2 : width - 2;
        return `M${x},${d.y}Q${edge},${d.y} ${edge},${d.y + rowGap / 2}Q${edge},${d.y + rowGap} ${x},${d.y + rowGap}`;
      });
    seats.attr('transform', i => `translate(${8 + (i % 13 + .5) * cell},${top + Math.floor(i / 13) * rowGap})`)
      .attr('data-occupied', i => String(available && i < count));
    seats.select('.friends-chair').classed('is-empty', i => available && i >= count);
    const figures = seats.select('.friends-person').interrupt('friends-exit');
    const duration = animate && !motion.matches ? 700 : 0;
    if (duration) {
      figures.transition('friends-exit').duration(duration).ease(d3.easeCubicInOut)
        .style('opacity', i => available && i < count ? 1 : 0)
        .attr('transform', i => `translate(0,${available && i < count ? 0 : 14})`);
    } else {
      figures.style('opacity', i => available && i < count ? 1 : 0)
        .attr('transform', i => `translate(0,${available && i < count ? 0 : 14})`);
    }
  }

  function select(period, animate) { selected = period; draw(animate); }

  story.chapter('friends', {
    init(el, data) {
      series = data.who['43|000|00'];
      if (!series || !Number.isFinite(series[data.years.indexOf(2010)])) {
        el.textContent = 'Time-with-friends data is unavailable. See Methods and notes.';
        return;
      }
      capacity = Math.round(series[data.years.indexOf(2010)]);
      root = document.createElement('div');
      root.className = 'friends-panel';
      root.innerHTML = `<div class="friends-heading"><output class="friends-metric"></output><span class="friends-period"></span></div>
        <p class="friends-scope">Time with friends · all ages 15+</p>
        <div class="friends-plot"><p class="friends-no-data" hidden>No annual estimate for 2020.<br>Choose another period.</p></div>
        <p class="friends-summary" role="status" aria-live="polite" aria-atomic="true"></p>
        <label class="friends-control" for="friends-period">Inspect a period<select id="friends-period"></select></label>
        <p class="friends-caption">American Time Use Survey, BLS. One figure ≈ one minute a day, not one person. Empty chairs compare with 2010. <a href="#methods">Methods</a>.</p>`;
      el.append(root);
      plot = root.querySelector('.friends-plot');
      picker = root.querySelector('select');
      metric = root.querySelector('.friends-metric');
      label = root.querySelector('.friends-period');
      summary = root.querySelector('.friends-summary');
      noData = root.querySelector('.friends-no-data');
      const options = data.years.filter(year => year >= 2010).map(year => ({ value: String(year), label: year === 2020 ? '2020 — no annual estimate' : `${year} annual average` }));
      options.push({ value: 'recent', label: '2024–25 average (story endpoint)' });
      d3.select(picker).selectAll('option').data(options).join('option').attr('value', d => d.value).text(d => d.label);
      picker.addEventListener('change', () => select(picker.value, true));
      svg = d3.select(plot).append('svg').attr('role', 'img');
      seats = svg.append('g').attr('class', 'friends-seats').selectAll('g').data(d3.range(capacity)).join('g').attr('class', 'friends-seat');
      seats.append('rect').attr('class', 'friends-chair').attr('x', -7).attr('y', 2).attr('width', 14).attr('height', 19).attr('rx', 2);
      const figures = seats.append('g').attr('class', 'friends-person');
      figures.append('circle').attr('cy', -4).attr('r', 3.5);
      figures.append('path').attr('d', 'M-5,4Q0,-1 5,4L5,15H-5Z');
      new ResizeObserver(() => draw()).observe(plot);
      motion.addEventListener('change', () => { if (motion.matches) draw(); });
      draw();
    },
    step(n) { select(steps[Math.max(0, Math.min(steps.length - 1, n))], true); },
  });
})();
