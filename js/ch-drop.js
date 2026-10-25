/* Package 1 · The drop. Each state supports reverse and fast scrolling. */
(function () {
  const ages = ['103', '031', '038', '042', '049', '065'];
  const format = v => d3.format('.1f')(v).replace(/\.0$/, '');
  const state = { step: 0, year: null, inspectAge: '103' };
  let root, plot, svg, clip, paths, labels, endpoints, cursor, input, summary, inspection, x, y, height;
  const average = (age, years) => story.avg(story.series(age, '600024'), years);
  const primary = () => state.step === 3 ? story.you : '103';
  const visibleAges = () => state.step >= 2 ? ages : ['103'];
  function color(age) {
    if (state.step === 3 && age === story.you) return 'var(--accent)';
    return age === '103' ? 'var(--c-social)' : 'var(--muted)';
  }
  function inspect(year, age) { state.year = year; state.inspectAge = age || primary(); drawInspection(); }
  function drawInspection() {
    const { year, inspectAge: age } = state;
    const value = year == null ? null : story.series(age, '600024')[story.data.years.indexOf(year)];
    cursor.attr('display', year == null ? 'none' : null);
    if (year != null) {
      cursor.select('line').attr('x1', x(year)).attr('x2', x(year)).attr('y1', 22).attr('y2', height - 38);
      cursor.select('circle').attr('display', value == null ? 'none' : null)
        .attr('cx', x(year)).attr('cy', value == null ? 0 : y(value)).style('fill', color(age));
    }
    const text = year == null ? 'Hover or tap a line. Keyboard: focus the chart and use ← / →; the age menu chooses your line.'
      : value == null ? `${year}: no ATUS estimate was published.`
      : `${year} · Ages ${story.ageName(age)} · ${format(value)} min/day`;
    inspection.textContent = text;
    input.attr('aria-valuenow', year == null ? (state.step === 0 ? 2004 : 2025) : year)
      .attr('aria-valuetext', year == null ? 'Use arrow keys to inspect a year.' : text);
  }
  function render(animate = false) {
    if (!root) return;
    const width = Math.max(260, plot.clientWidth);
    height = Math.max(220, plot.clientHeight);
    const left = 38, right = width < 450 ? 88 : 104, bottom = height - 38;
    x = d3.scaleLinear().domain([2003,2025]).range([left, width - right]);
    y = d3.scaleLinear().domain([0,70]).range([bottom,22]);
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    const ticks = width < 450 ? [2003,2010,2017,2025] : [2003,2008,2013,2018,2025];
    svg.select('.drop-x').attr('transform', `translate(0,${bottom})`)
      .call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format('d')).tickSizeOuter(0));
    svg.select('.drop-y').attr('transform', `translate(${left},0)`)
      .call(d3.axisLeft(y).tickValues([0,20,40,60]).tickSize(0).tickPadding(8)).call(g => g.select('.domain').remove());
    svg.select('.drop-grid').selectAll('line').data([0,20,40,60]).join('line').attr('class', 'opening-gridline')
      .attr('x1', left).attr('x2', x(2025)).attr('y1', y).attr('y2', y);
    svg.select('.drop-unit').attr('x', left).attr('y', 11).text('min/day');
    const duration = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 1100 : 0;
    clip.interrupt().attr('x', left - 6).attr('y', 0).attr('height', height);
    clip.transition().duration(duration).ease(d3.easeCubicInOut)
      .attr('width', (state.step === 0 ? x(2004) - left + 6 : x(2025) - left + 12));
    const line = d3.line().defined(d => d[1] != null).x(d => x(d[0])).y(d => y(d[1]));
    paths.selectAll('path').data(ages, d => d).join('path').attr('class', 'drop-line').attr('data-age', d => d)
      .attr('d', age => line(story.data.years.map((year,i) => [year, story.series(age,'600024')[i]])))
      .style('stroke', color).style('stroke-width', age => age === primary() ? 3 : 1.5)
      .interrupt().transition().duration(duration ? 450 : 0)
      .style('opacity', age => state.step < 2 && age !== '103' ? 0 : age === primary() ? 1 : 0.55);
    paths.selectAll('path').filter(age => age === primary()).raise();
    // Annual lines, with two-year averages positioned at the period midpoints.
    const age = primary(), start = average(age,[2003,2004]), end = average(age,[2024,2025]);
    const points = [{ id:'first', year:2003.5, value:start, period:'2003–04' }];
    if (state.step >= 1) points.push({ id:'last', year:2024.5, value:end, period:'2024–25' });
    const point = endpoints.selectAll('g').data(points,d => d.id).join(enter => {
      const g = enter.append('g').attr('class','drop-endpoint');
      g.append('circle').attr('r',4.5); g.append('text').attr('class','drop-end-value');
      g.append('text').attr('class','drop-end-period'); return g;
    });
    point.attr('transform', d => `translate(${x(d.year)},${y(d.value)})`).style('color',color(age));
    point.select('circle').style('fill',color(age));
    point.select('.drop-end-value').attr('x',d => d.id === 'first' ? 8 : -8).attr('y',-23)
      .attr('text-anchor',d => d.id === 'first' ? 'start':'end').text(d => `${format(d.value)} min`);
    point.select('.drop-end-period').attr('x',d => d.id === 'first' ? 8 : -8).attr('y',-9)
      .attr('text-anchor',d => d.id === 'first' ? 'start':'end').text(d => d.period);
    // Leaders keep crowded age-group labels readable at the right edge.
    const i = story.data.years.indexOf(2025);
    const labData = visibleAges().map(a => ({age:a, actualY:y(story.series(a,'600024')[i])})).sort((a,b) => a.actualY-b.actualY);
    labData.forEach((d,i) => { d.labelY = Math.max(d.actualY, i ? labData[i-1].labelY+19 : 22); });
    for (let i=labData.length-1; i>=0; i--) labData[i].labelY = Math.min(labData[i].labelY, i===labData.length-1 ? bottom-5 : labData[i+1].labelY-19);
    const lab = labels.selectAll('g').data(state.step>=1 ? labData:[],d => d.age).join(enter => {
      const g=enter.append('g'); g.append('path'); g.append('text'); return g;
    });
    lab.select('path').attr('d',d => `M${x(2025)+3},${d.actualY}L${x(2025)+12},${d.labelY}H${x(2025)+17}`)
      .attr('fill','none').style('stroke',d => color(d.age)).style('opacity',.65);
    lab.select('text').attr('x',x(2025)+21).attr('y',d => d.labelY+4).style('fill',d => color(d.age))
      .text(d => `${state.step===3 && d.age===story.you ? 'You · ':''}${story.ageName(d.age)}`);
    summary.textContent = state.step===0 ? `${format(start)} min/day for ages 15–24 in 2003–04.`
      : `Ages ${story.ageName(age)}: ${format(start)} → ${format(end)} min/day. Down ${format(start-end)} min (${Math.round((start-end)/start*100)}%).`;
    input.attr('x',left).attr('y',20).attr('width',x(2025)-left).attr('height',bottom-20)
      .attr('aria-valuemax',state.step===0 ? 2004:2025)
      .attr('aria-label',`Inspect annual socializing for ages ${story.ageName(state.step>=2 ? story.you:'103')}`);
    root.dataset.step=state.step; drawInspection();
  }
  story.chapter('drop', {
    init(el) {
      root=document.createElement('div'); root.className='opening-panel opening-drop';
      root.innerHTML=`<p class="opening-heading">Daily socializing, by age</p><p class="opening-summary"></p>
        <div class="opening-plot"></div><p class="opening-inspection"></p>
        <p class="opening-caption">American Time Use Survey, BLS. Lines: annual averages. Endpoint dots: two-year averages. The gap at 2020 reflects missing estimates.</p>`;
      el.append(root); plot=root.querySelector('.opening-plot'); summary=root.querySelector('.opening-summary'); inspection=root.querySelector('.opening-inspection');
      svg=d3.select(plot).append('svg').attr('role','group').attr('aria-label','Socializing minutes per day, 2003–2025');
      svg.append('g').attr('class','drop-grid').attr('aria-hidden','true');
      svg.append('g').attr('class','axis drop-x'); svg.append('g').attr('class','axis drop-y'); svg.append('text').attr('class','drop-unit');
      clip=svg.append('defs').append('clipPath').attr('id','drop-reveal-clip').append('rect').attr('width',0);
      paths=svg.append('g').attr('clip-path','url(#drop-reveal-clip)').attr('aria-hidden','true');
      labels=svg.append('g').attr('class','drop-labels').attr('aria-hidden','true'); endpoints=svg.append('g').attr('aria-hidden','true');
      cursor=svg.append('g').attr('class','drop-cursor').attr('aria-hidden','true'); cursor.append('line'); cursor.append('circle').attr('r',5);
      input=svg.append('rect').attr('class','drop-input').attr('fill','transparent').attr('tabindex',0).attr('role','slider')
        .attr('aria-valuemin',2003).attr('aria-valuenow',2004)
        .on('pointermove click',function(event) {
          if (event.type==='pointermove' && event.pointerType==='touch') return;
          const [px,py]=d3.pointer(event,svg.node());
          const year=Math.max(2003,Math.min(state.step===0 ? 2004:2025,Math.round(x.invert(px))));
          const i=story.data.years.indexOf(year);
          const nearest=visibleAges().filter(a => story.series(a,'600024')[i]!=null)
            .sort((a,b) => Math.abs(y(story.series(a,'600024')[i])-py)-Math.abs(y(story.series(b,'600024')[i])-py))[0];
          inspect(year,nearest);
        })
        .on('pointerleave',function() { if (document.activeElement!==this) inspect(null); })
        .on('focus',() => inspect(state.step===0 ? 2004:2025,state.step>=2 ? story.you:'103'))
        .on('blur',() => inspect(null))
        .on('keydown',event => {
          const max=state.step===0 ? 2004:2025, now=state.year==null ? max:state.year;
          const changes={ArrowLeft:now-1,ArrowDown:now-1,ArrowRight:now+1,ArrowUp:now+1,Home:2003,End:max};
          if (event.key==='Escape') { inspect(null); return; }
          if (!(event.key in changes)) return;
          event.preventDefault(); inspect(Math.max(2003,Math.min(max,changes[event.key])),state.step>=2 ? story.you:'103');
        });
      new ResizeObserver(() => render()).observe(plot); render();
    },
    step(n) { state.step=Math.max(0,Math.min(3,n)); state.year=null; render(true); },
    age() { state.year=null; render(); },
  });
})();

