/* Mariah · A day can't grow. Geometry totals 1,440; labels retain reported minutes. */
(function () {
  const PERIODS = [[2003, 2004], [2024, 2025]];
  const LABELS = ['600001', '600003', '600024', '600025', 'leis'];
  const format = n => d3.format('.1f')(n).replace(/\.0$/, '');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let root, plot, svg, range, picker, period, detail, rows;
  let progress = 0;
  let target = 0;
  let selected = '600024';

  function currentRows() {
    const values = rows.map(row => ({ ...row, value: row.before + (row.after - row.before) * progress }));
    const total = d3.sum(values, row => row.value);
    let accumulated = 0;
    return values.map((row, i) => {
      const start = accumulated;
      // Close the final block exactly, rather than accumulating floating-point error.
      accumulated = i === values.length - 1 ? 1440 : accumulated + row.value * 1440 / total;
      return { ...row, start, end: accumulated };
    });
  }

  function describe(row) {
    const difference = row.after - row.before;
    return `${row.name}: ${format(row.before)} → ${format(row.after)} min/day (${difference < 0 ? '−' : '+'}${format(Math.abs(difference))}).`;
  }

  function draw() {
    if (!root) return;
    const width = Math.max(250, plot.clientWidth);
    const height = Math.max(240, plot.clientHeight);
    const compact = width < 450;
    const left = compact ? 28 : 48;
    const columnWidth = compact ? 64 : 104;
    const y = d3.scaleLinear().domain([0, 1440]).range([30, height - 22]);
    const values = currentRows();
    const periodLabel = progress === 0 ? '2003–04' : progress === 1 ? '2024–25' : 'Between the two periods';
    root.dataset.progress = String(progress);
    root.dataset.total = String(d3.sum(values, row => row.end - row.start));
    period.textContent = periodLabel;
    range.value = String(Math.round(progress * 100));
    range.setAttribute('aria-valuetext', progress === 0 || progress === 1
      ? periodLabel : `Illustrated transition, ${Math.round(progress * 100)} percent toward 2024–25; not an annual estimate`);
    svg.attr('viewBox', `0 0 ${width} ${height}`)
      .attr('aria-label', `A fixed 24-hour day for ages 15–24. Socializing fell from ${format(rows.find(r => r.id === '600024').before)} to ${format(rows.find(r => r.id === '600024').after)} minutes per day. Showing ${periodLabel}.`);

    svg.selectAll('.day-total').data([null]).join('text').attr('class', 'day-total')
      .attr('x', left + columnWidth / 2).attr('y', 17).attr('text-anchor', 'middle').text('24 hours');
    svg.selectAll('.day-column').data([null]).join('rect').attr('class', 'day-column')
      .attr('x', left).attr('y', y(0)).attr('width', columnWidth).attr('height', y(1440) - y(0));
    const blocks = svg.selectAll('.day-block').data(values, row => row.id).join('g').attr('class', 'day-block');
    blocks.selectAll('rect').data(row => [row]).join('rect')
      .attr('x', left).attr('y', row => y(row.start)).attr('width', columnWidth)
      .attr('height', row => Math.max(0, y(row.end) - y(row.start)))
      .attr('data-activity', row => row.id).attr('data-minutes', row => row.value)
      .classed('is-selected', row => row.id === selected).style('fill', row => story.color(row.id))
      .on('pointerenter', (event, row) => { detail.textContent = `${describe(row)} ${periodLabel}: ${format(row.value)} min/day.`; })
      .on('pointerleave', showSelected)
      .on('click', (event, row) => { selected = row.id; picker.value = selected; draw(); });
    blocks.selectAll('title').data(row => [row]).join('title')
      .text(row => `${describe(row)} ${periodLabel}: ${format(row.value)} minutes per day.`);

    const direct = values.filter(row => LABELS.includes(row.id)).map(row => ({ ...row, center: y((row.start + row.end) / 2) }));
    direct.sort((a, b) => a.center - b.center);
    direct.forEach((row, i) => { row.labelY = Math.max(row.center, i ? direct[i - 1].labelY + 38 : 40); });
    for (let i = direct.length - 1; i >= 0; i--) {
      direct[i].labelY = Math.min(direct[i].labelY, i === direct.length - 1 ? height - 36 : direct[i + 1].labelY - 38);
    }
    const label = svg.selectAll('.day-label').data(direct, row => row.id).join(enter => {
      const group = enter.append('g').attr('class', 'day-label');
      group.append('path');
      group.append('text').attr('class', 'day-label-name');
      group.append('text').attr('class', 'day-label-value');
      return group;
    }).classed('is-social', row => row.id === '600024');
    const labelX = left + columnWidth + 26;
    label.select('path').attr('d', row => `M${left + columnWidth + 2},${row.center}H${labelX - 15}L${labelX - 5},${row.labelY}`);
    label.select('.day-label-name').attr('x', labelX).attr('y', row => row.labelY - 3)
      .text(row => compact && row.id === '600001' ? 'Sleep & care'
        : compact && row.id === '600003' ? 'Chores'
        : compact && row.id === 'leis' ? 'Other leisure & sports' : row.name);
    label.select('.day-label-value').attr('x', labelX).attr('y', row => row.labelY + 13)
      .text(row => `${format(row.value)} min`);
    svg.selectAll('.day-bottom').data([null]).join('text').attr('class', 'day-bottom')
      .attr('x', left + columnWidth / 2).attr('y', height - 5).attr('text-anchor', 'middle').text('1,440 min');
    showSelected();
  }

  function showSelected() {
    const row = currentRows().find(row => row.id === selected);
    detail.textContent = `${describe(row)}${progress > 0 && progress < 1 ? ` Illustrated position: ${format(row.value)} min.` : ''}`;
  }

  function moveTo(next, animate) {
    target = Math.max(0, Math.min(1, next));
    if (!root) { progress = target; return; }
    d3.select(root).interrupt('day-morph');
    if (!animate || motion.matches) { progress = target; draw(); return; }
    const start = progress;
    d3.select(root).transition('day-morph').duration(1100).ease(d3.easeCubicInOut)
      .tween('progress', () => t => { progress = start + (target - start) * t; draw(); });
  }

  story.chapter('day', {
    init(el) {
      rows = story.DAY_PARTS.map(id => {
        const series = story.series('103', id);
        const [before, after] = PERIODS.map(years => series ? story.avg(series, years) : NaN);
        return { id, name: story.ACTIVITIES[id].name, before, after };
      });
      if (rows.length !== 14 || rows.some(row => !Number.isFinite(row.before) || !Number.isFinite(row.after) || row.before < 0 || row.after < 0)) {
        el.textContent = 'The complete activity data is unavailable. See Methods and notes.';
        return;
      }
      root = document.createElement('div');
      root.className = 'day-panel';
      root.innerHTML = `<div class="day-heading"><span>Same 24 hours · ages 15–24</span><output class="day-period"></output></div>
        <div class="day-plot"></div>
        <p class="day-detail" aria-live="off"></p>
        <div class="day-controls"><label for="day-position">Then → now<input id="day-position" type="range" min="0" max="100" step="1" value="0"></label>
        <label for="day-activity">Inspect an activity<select id="day-activity"></select></label></div>
        <p class="day-caption">American Time Use Survey, BLS. Two-year averages; heights adjust rounding. Between-period positions are blends, not annual estimates. <a href="#methods">Methods</a>.</p>`;
      el.append(root);
      plot = root.querySelector('.day-plot');
      range = root.querySelector('#day-position');
      picker = root.querySelector('#day-activity');
      period = root.querySelector('.day-period');
      detail = root.querySelector('.day-detail');
      d3.select(picker).selectAll('option').data(rows).join('option').attr('value', row => row.id).text(row => row.name);
      picker.value = selected;
      range.addEventListener('input', () => moveTo(+range.value / 100, false));
      picker.addEventListener('change', () => { selected = picker.value; draw(); });
      svg = d3.select(plot).append('svg').attr('role', 'img');
      new ResizeObserver(draw).observe(plot);
      motion.addEventListener('change', () => { if (motion.matches) moveTo(target, false); });
      draw();
    },
    step(n) { moveTo(n === 0 ? 0 : 1, true); },
  });
})();
