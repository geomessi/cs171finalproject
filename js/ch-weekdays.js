/* Package 1 · Weekdays vs. weekends. A working version of the V1 draft. */
(function () {
  const format = v => d3.format('.1f')(v).replace(/\.0$/, '');
  let root, svg, plot, summary, narrative;
  function render() {
    if (!root) return;
    const age=story.ageName(story.you);
    const rows=[{day:'19',name:'Weekdays'},{day:'16',name:'Weekends'}].map(d => {
      const series=story.series(story.you,'600024',d.day);
      const start=story.avg(series,[2003,2004]),end=story.avg(series,[2024,2025]);
      return {...d,start,end,loss:start-end};
    });
    const width=Math.max(260,plot.clientWidth), height=Math.max(230,plot.clientHeight), compact=width<450;
    const bottom=height-42;
    // Fixed across groups and periods: selecting an age never changes the scale.
    const x=d3.scaleLinear().domain([0,120]).range([24,width-28]);
    const y=d3.scalePoint().domain(rows.map(d => d.day)).range([100,bottom-45]);
    svg.attr('viewBox',`0 0 ${width} ${height}`).attr('aria-label',`Socializing for ages ${age}. ${rows.map(d => `${d.name}: ${format(d.start)} minutes in 2003–04 and ${format(d.end)} in 2024–25, down ${format(d.loss)} minutes`).join('. ')}.`);
    svg.selectAll('.week-axis').data([null]).join('g').attr('class','axis week-axis').attr('transform',`translate(0,${bottom})`)
      .call(d3.axisBottom(x).tickValues([0,30,60,90,120]).tickSizeOuter(0));
    svg.selectAll('.week-unit').data([null]).join('text').attr('class','week-unit').attr('x',24).attr('y',16).text('min/day');
    const g=svg.selectAll('.week-row').data(rows,d => d.day).join(enter => {
      const g=enter.append('g').attr('class','week-row'); g.append('text').attr('class','week-row-title'); g.append('line').attr('class','week-connector');
      g.append('circle').attr('class','week-start').attr('r',5); g.append('circle').attr('class','week-end').attr('r',5);
      g.append('text').attr('class','week-start-label'); g.append('text').attr('class','week-end-label'); return g;
    }).attr('data-day',d => d.day).attr('transform',d => `translate(0,${y(d.day)})`);
    g.select('.week-row-title').attr('x',24).attr('y',-40).text(d => `${d.name} · ${format(d.loss)} min less (${Math.round(d.loss/d.start*100)}%)`);
    g.select('.week-connector').attr('x1',d => x(d.end)).attr('x2',d => x(d.start)).attr('y1',0).attr('y2',0);
    g.select('.week-start').attr('cx',d => x(d.start)).attr('cy',0); g.select('.week-end').attr('cx',d => x(d.end)).attr('cy',0);
    g.select('.week-start-label').attr('x',d => x(d.start)).attr('y',-12).attr('text-anchor','middle').text(d => `${format(d.start)}${compact ? '':' min'} · 2003–04`);
    g.select('.week-end-label').attr('x',d => x(d.end)).attr('y',24).attr('text-anchor','middle').text(d => `${format(d.end)}${compact ? '':' min'} · 2024–25`);
    summary.textContent=`Ages ${age} · 2003–04 compared with 2024–25`;
    // Chapter-owned copy follows the chosen group and the actual endpoint means.
    const name=story.you==='065' ? 'people 65 and older':`${age}-year-olds`;
    narrative.textContent=`For ${name}, weekday socializing fell from ${format(rows[0].start)} to ${format(rows[0].end)} minutes a day. Weekends fell from ${format(rows[1].start)} to ${format(rows[1].end)} minutes.`;
  }
  story.chapter('weekdays', {
    init(el) {
      root=document.createElement('div'); root.className='opening-panel opening-weekdays';
      root.innerHTML=`<p class="opening-heading">Then and now, by day type</p><p class="opening-summary"></p><div class="opening-plot"></div>
        <p class="opening-caption">American Time Use Survey, BLS. Each endpoint averages two survey years. Open dot: 2003–04; pink dot: 2024–25.</p>`;
      el.append(root); plot=root.querySelector('.opening-plot'); summary=root.querySelector('.opening-summary');
      narrative=el.closest('[data-chapter]').querySelector('.step p:last-child');
      svg=d3.select(plot).append('svg').attr('role','img'); new ResizeObserver(render).observe(plot); render();
    },
    age() { render(); },
  });
})();

