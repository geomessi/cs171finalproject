/*
 * Chapter 15 · Your case file (explorable ending, LINKED VIEWS)
 * Owner: Chloe (Package 2). Only this package edits this file.
 *
 * One group picker and one day-type picker drive three panels at once:
 *   A · the hour: socializing over the years, with then and now
 *   B · what moved: change in every block of the day between then and now (diverging bars)
 *   C · alone vs. together: waking time alone and with others (BLS publishes it by age, from 2010)
 * Brushing a year range in A or C sets "then" (the first two years of the range) and "now" (the last
 * two) for all three panels. The From/To menus do the same for keyboard users.
 * BLS doesn't cross age with parent status, so groups are one list, not two filters.
 */
(function () {
  const SOCIAL = '600024', FIRST = 2003, LAST = 2025, WHO_FIRST = 2010;
  const GROUPS = [
    { id: '103', name: 'Ages 15–24', who: '020', whoNote: 'Alone vs. together uses ages 20–24, the closest band BLS publishes.' },
    { id: '020', name: 'Ages 20–24', who: '020' },
    { id: '031', name: 'Ages 25–34', who: '031' },
    { id: '038', name: 'Ages 35–44', who: '038' },
    { id: '042', name: 'Ages 45–54', who: '042' },
    { id: '049', name: 'Ages 55–64', who: '049' },
    { id: '065', name: 'Ages 65+', who: '113', whoNote: 'Alone vs. together uses ages 65–74, the closest band BLS publishes.' },
    { id: 'p13', name: 'Parents of a child under 18', par: '13' },
    { id: 'p01', name: 'No kids at home', par: '01' },
  ];
  const DAYS = [{ id: '00', name: 'All days' }, { id: '19', name: 'Weekdays' }, { id: '16', name: 'Weekends' }];
  const SHORT = { '600001': 'Sleep & care', '600007': 'Care: household', '600010': 'Care: others', '600018': 'Shopping', 'leis': 'Other leisure', '600030': 'Civic & religious', '600033': 'Calls & mail' };
  const hm = v => `${Math.floor(Math.round(v) / 60)}h${String(Math.round(v) % 60).padStart(2, '0')}m`;
  const sign = v => { const r = Math.round(v); return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r); };
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { group: GROUPS[0], day: '00', range: [FIRST, LAST] };
  let root, panels = {}, fromSel, toSel, syncing = false, dragging = null;

  // ----- data -----
  function series(code, g = state.group, day = state.day) {
    const s = g.par ? story.data.par[g.par][day] : story.data.act[g.id][day];
    if (!s) return null;
    if (code === 'leis') return s['600023'].map((v, i) => (v == null || s[SOCIAL][i] == null || s['600025'][i] == null ? null : v - s[SOCIAL][i] - s['600025'][i]));
    return s[code] || null;
  }
  // "Then" is the first two years of the range and "now" the last two (one each if the range is short).
  function periods(lo = state.range[0]) {
    const hi = state.range[1], span = hi - lo;
    return span >= 3 ? [[lo, lo + 1], [hi - 1, hi]] : [[lo], [hi]];
  }
  const label = ys => (ys.length > 1 ? `${ys[0]}–${String(ys[1]).slice(2)}` : `${ys[0]}`);
  const avg = (s, ys) => (s ? story.avg(s, ys) : null);

  // ----- shared pieces -----
  function makePanel(key, title) {
    const el = root.querySelector(`.file-${key}`);
    el.innerHTML = `<p class="file-panel-title">${title}</p><p class="file-readout"></p><div class="file-plot"></div><p class="file-note"></p>`;
    const plot = el.querySelector('.file-plot');
    const svg = d3.select(plot).append('svg').attr('role', 'img');
    return { el, plot, svg, readout: el.querySelector('.file-readout'), note: el.querySelector('.file-note') };
  }
  function size(p) { return [Math.max(240, p.plot.clientWidth), Math.max(220, p.plot.clientHeight)]; }

  // A brush along the years. Moving it sets the shared range; the other panels follow.
  function attachBrush(p, minYear) {
    p.brush = d3.brushX().on('brush end', event => {
      if (syncing || !event.sourceEvent) return;
      if (!event.selection) { if (event.type === 'end') setRange([FIRST, LAST]); return; }
      let [a, b] = event.selection.map(v => Math.round(p.x.invert(v)));
      a = Math.max(minYear, a); b = Math.min(LAST, b);
      if (b - a < 1) return;
      dragging = event.type === 'end' ? null : p;   // don't redraw the brush that's being dragged
      setRange([a, b], event.type === 'end');
    });
    p.brushG = p.svg.append('g').attr('class', 'file-brush');
  }
  function placeBrush(p, minYear) {
    const [w, h] = size(p);
    p.svg.attr('viewBox', `0 0 ${w} ${h}`);
    if (dragging === p) return;
    p.brush.extent([[p.x(minYear), p.top], [p.x(LAST), p.bottom]]);
    syncing = true;
    p.brushG.call(p.brush);
    const [a, b] = state.range, full = a <= minYear && b >= LAST;
    p.brushG.call(p.brush.move, full ? null : [p.x(Math.max(a, minYear)), p.x(b)]);
    syncing = false;
  }

  function setRange(r, settle = true) {
    state.range = r;
    fromSel.value = r[0]; toSel.value = r[1];
    render(settle);
  }

  // ----- A · the hour -----
  function renderHour() {
    const p = panels.hour, [w, h] = size(p);
    p.top = 14; p.bottom = h - 24;
    const s = series(SOCIAL), years = story.data.years;
    const max = Math.max(60, d3.max(s.filter(v => v != null)) || 60);
    p.x = d3.scaleLinear().domain([FIRST, LAST]).range([34, w - 12]);
    const y = d3.scaleLinear().domain([0, max]).nice().range([p.bottom, p.top]);
    p.axisX.attr('transform', `translate(0,${p.bottom})`).call(d3.axisBottom(p.x).tickValues([2003, 2010, 2015, 2020, 2025]).tickFormat(d3.format('d')).tickSize(0).tickPadding(8)).call(g => g.select('.domain').remove());
    p.axisY.attr('transform', 'translate(34,0)').call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(6)).call(g => g.select('.domain').remove());
    p.grid.selectAll('line').data(y.ticks(4)).join('line').attr('x1', 34).attr('x2', w - 12).attr('y1', y).attr('y2', y);
    const [r0, r1] = state.range;
    p.band.attr('x', p.x(r0)).attr('width', p.x(r1) - p.x(r0)).attr('y', p.top).attr('height', p.bottom - p.top);
    p.path.attr('d', d3.line().defined(d => d[1] != null).x(d => p.x(d[0])).y(d => y(d[1]))(years.map((yr, i) => [yr, s[i]])));
    const [tp, np] = periods(), a = avg(s, tp), b = avg(s, np);
    const mid = ys => d3.mean(ys);
    p.dots.selectAll('circle').data([{ k: 'then', yr: mid(tp), v: a }, { k: 'now', yr: mid(np), v: b }].filter(d => d.v != null))
      .join('circle').attr('class', d => `file-dot ${d.k}`).attr('r', 5).attr('cx', d => p.x(d.yr)).attr('cy', d => y(d.v));
    p.readout.innerHTML = a == null || b == null ? 'No estimate for this range.'
      : `<b>${Math.round(a)}</b> min/day in ${label(tp)} → <b class="soc">${Math.round(b)}</b> in ${label(np)} <span>(${sign(b - a)})</span>`;
    p.svg.attr('aria-label', `Socializing, ${state.group.name.toLowerCase()}, ${DAYS.find(d => d.id === state.day).name.toLowerCase()}: ${p.readout.textContent}`);
    placeBrush(p, FIRST);
  }

  // ----- B · what moved -----
  function renderMoved(animate) {
    const p = panels.moved, [w, h] = size(p);
    p.svg.attr('viewBox', `0 0 ${w} ${h}`);
    const narrow = w < 380, left = narrow ? 100 : 150, right = 34, top = 6, bottom = h - 22;
    const [tp, np] = periods();
    const rows = story.DAY_PARTS.map(code => {
      const s = series(code), a = avg(s, tp), b = avg(s, np);
      return { code, name: (narrow && SHORT[code]) || story.ACTIVITIES[code].name, d: a == null || b == null ? null : b - a };
    }).filter(r => r.d != null).sort((p1, q) => q.d - p1.d);
    const lim = Math.max(10, d3.max(rows, r => Math.abs(r.d)));
    const x = d3.scaleLinear().domain([-lim, lim]).nice().range([left + 28, w - right]);
    const y = d3.scaleBand().domain(rows.map(r => r.code)).range([top, bottom]).padding(0.25);
    const t = animate && !still() ? 450 : 0;
    p.axisX.attr('transform', `translate(0,${bottom})`).call(d3.axisBottom(x).ticks(4).tickFormat(d => (d > 0 ? '+' : '') + d).tickSize(0).tickPadding(6)).call(g => g.select('.domain').remove());
    p.zero.attr('x1', x(0)).attr('x2', x(0)).attr('y1', top).attr('y2', bottom);
    const row = p.rows.selectAll('g').data(rows, r => r.code).join(enter => {
      const g = enter.append('g').attr('class', 'file-row');
      g.append('rect'); g.append('text').attr('class', 'n').attr('text-anchor', 'end'); g.append('text').attr('class', 'v');
      return g;
    });
    row.classed('is-social', r => r.code === SOCIAL).transition().duration(t).attr('transform', r => `translate(0,${y(r.code)})`);
    row.select('rect').attr('height', y.bandwidth()).classed('less', r => r.d < 0).classed('more', r => r.d >= 0)
      .transition().duration(t).attr('x', r => x(Math.min(0, r.d))).attr('width', r => Math.abs(x(r.d) - x(0)));
    row.select('.n').attr('x', left - 8).attr('y', y.bandwidth() / 2 + 4).text(r => r.name);
    row.select('.v').attr('y', y.bandwidth() / 2 + 4).attr('text-anchor', r => (r.d < 0 ? 'end' : 'start'))
      .transition().duration(t).attr('x', r => x(r.d) + (r.d < 0 ? -4 : 4)).text(r => sign(r.d));
    const up = rows[0], down = rows[rows.length - 1];
    p.readout.textContent = rows.length ? `${label(tp)} → ${label(np)}: ${up.name} grew most (${sign(up.d)}), ${down.name} shrank most (${sign(down.d)}).` : 'No estimate for this range.';
    p.note.textContent = 'Blocks moved together; this can\'t say what replaced what.';
    p.svg.attr('aria-label', `Change in minutes per day, ${label(tp)} to ${label(np)}: ${rows.map(r => `${r.name} ${sign(r.d)}`).join(', ')}.`);
  }

  // ----- C · alone vs. together -----
  function renderAlone() {
    const p = panels.alone, [w, h] = size(p), g = state.group;
    p.top = 14; p.bottom = h - 24;
    p.x = d3.scaleLinear().domain([WHO_FIRST, LAST]).range([40, w - 12]);
    const has = !!g.who;
    p.svg.style('display', has ? null : 'none');
    p.plot.style.display = has ? '' : 'none';
    if (!has) {
      p.readout.textContent = 'BLS doesn\'t publish time alone vs. with others for parent groups, so there\'s nothing honest to draw here.';
      p.note.textContent = '';
      return;
    }
    const alone = story.data.who[`01|${g.who}|00`], others = story.data.who[`02|${g.who}|00`], years = story.data.years;
    const y = d3.scaleLinear().domain([0, 720]).range([p.bottom, p.top]);
    p.axisX.attr('transform', `translate(0,${p.bottom})`).call(d3.axisBottom(p.x).tickValues([2010, 2015, 2020, 2025]).tickFormat(d3.format('d')).tickSize(0).tickPadding(8)).call(s => s.select('.domain').remove());
    p.axisY.attr('transform', 'translate(40,0)').call(d3.axisLeft(y).tickValues([0, 240, 480, 720]).tickFormat(d => `${d / 60}h`).tickSize(0).tickPadding(6)).call(s => s.select('.domain').remove());
    p.grid.selectAll('line').data([0, 240, 480, 720]).join('line').attr('x1', 40).attr('x2', w - 12).attr('y1', y).attr('y2', y);
    const lo = Math.max(WHO_FIRST, state.range[0]), r1 = state.range[1];
    p.band.attr('x', p.x(lo)).attr('width', Math.max(0, p.x(r1) - p.x(lo))).attr('y', p.top).attr('height', p.bottom - p.top);
    const line = d3.line().defined(d => d[1] != null).x(d => p.x(d[0])).y(d => y(d[1]));
    const pts = s => years.filter(yr => yr >= WHO_FIRST).map(yr => [yr, s[years.indexOf(yr)]]);
    p.pathA.attr('d', line(pts(alone))); p.pathO.attr('d', line(pts(others)));
    const [tp, np] = r1 - lo >= 1 ? periods(lo) : [[lo], [r1]];
    const a0 = avg(alone, tp), a1 = avg(alone, np);
    p.readout.innerHTML = a0 == null || a1 == null ? 'No estimate for this range.'
      : `Alone <b>${hm(a0)}</b> in ${label(tp)} → <b>${hm(a1)}</b> in ${label(np)}`;
    p.note.textContent = [state.range[0] < WHO_FIRST ? '"Who with" data starts in 2010.' : '', g.whoNote || '',
      state.day !== '00' ? 'BLS publishes this by day type only for all ages, so it shows all days.' : ''].filter(Boolean).join(' ');
    p.svg.attr('aria-label', `Waking time alone vs. with others. ${p.readout.textContent}`);
    placeBrush(p, WHO_FIRST);
  }

  function render(animate = false) {
    if (!root) return;
    renderHour(); renderMoved(animate); renderAlone();
  }

  function linePanel(p, cls) {
    p.grid = p.svg.append('g').attr('class', 'file-grid').attr('aria-hidden', 'true');
    p.band = p.svg.append('rect').attr('class', 'file-band').attr('aria-hidden', 'true');
    p.axisX = p.svg.append('g').attr('class', 'axis').attr('aria-hidden', 'true');
    p.axisY = p.svg.append('g').attr('class', 'axis').attr('aria-hidden', 'true');
    return p;
  }

  story.chapter('file', {
    init(el) {
      root = document.createElement('div');
      root.className = 'file-panel';
      const yearOpts = d3.range(FIRST, LAST + 1).filter(y => y !== 2020).map(y => `<option>${y}</option>`).join('');
      root.innerHTML = `<div class="file-controls">
          <label>Group <select class="file-group">${GROUPS.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}</select></label>
          <label>Days <select class="file-day">${DAYS.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}</select></label>
          <label>Years <select class="file-from" aria-label="From year">${yearOpts}</select> to <select class="file-to" aria-label="To year">${yearOpts}</select></label>
          <button type="button" class="file-reset">All years</button>
        </div>
        <p class="file-hint">Drag across the years in the first or last panel to compare any two periods. All three panels follow.</p>
        <div class="file-grid-wrap">
          <div class="file-card file-hour"></div><div class="file-card file-moved"></div><div class="file-card file-alone"></div>
        </div>
        <p class="file-caption">American Time Use Survey, BLS. "Then" and "now" average the first and last two years of the range. No estimates exist for 2020. Changes show what moved together, not what caused what.</p>`;
      el.append(root);

      panels.hour = linePanel(makePanel('hour', 'The hour: socializing'));
      panels.hour.path = panels.hour.svg.append('path').attr('class', 'file-social').attr('aria-hidden', 'true');
      panels.hour.dots = panels.hour.svg.append('g').attr('aria-hidden', 'true');
      attachBrush(panels.hour, FIRST);
      panels.moved = makePanel('moved', 'What grew and what shrank');
      panels.moved.axisX = panels.moved.svg.append('g').attr('class', 'axis').attr('aria-hidden', 'true');
      panels.moved.rows = panels.moved.svg.append('g').attr('aria-hidden', 'true');
      panels.moved.zero = panels.moved.svg.append('line').attr('class', 'file-zero');
      panels.alone = linePanel(makePanel('alone', 'Alone vs. with others'));
      panels.alone.pathO = panels.alone.svg.append('path').attr('class', 'file-others').attr('aria-hidden', 'true');
      panels.alone.pathA = panels.alone.svg.append('path').attr('class', 'file-alone').attr('aria-hidden', 'true');
      attachBrush(panels.alone, WHO_FIRST);
      panels.alone.el.querySelector('.file-panel-title').insertAdjacentHTML('beforeend', ' <span class="file-key"><i class="a"></i>alone <i class="o"></i>with others</span>');

      const groupSel = root.querySelector('.file-group'), daySel = root.querySelector('.file-day');
      fromSel = root.querySelector('.file-from'); toSel = root.querySelector('.file-to');
      groupSel.addEventListener('change', () => { state.group = GROUPS.find(g => g.id === groupSel.value); render(true); });
      daySel.addEventListener('change', () => { state.day = daySel.value; render(true); });
      const fromMenus = () => { const a = +fromSel.value, b = +toSel.value; if (b > a) setRange([a, b]); else { fromSel.value = state.range[0]; toSel.value = state.range[1]; } };
      fromSel.addEventListener('change', fromMenus); toSel.addEventListener('change', fromMenus);
      root.querySelector('.file-reset').addEventListener('click', () => setRange([FIRST, LAST]));
      fromSel.value = FIRST; toSel.value = LAST;
      this.groupSel = groupSel;
      new ResizeObserver(() => render()).observe(root.querySelector('.file-grid-wrap'));
      render();
    },
    // Follow the "I'm…" menu when the picker is on an age group
    age(code) {
      const g = GROUPS.find(v => v.id === code);
      if (!g || !root || state.group.par) return;
      state.group = g; this.groupSel.value = g.id; render(true);
    },
  });
})();
