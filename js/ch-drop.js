/* Mariah · The case: one clock, one receding shoreline.
 * V3 replaces the generic trend chart with the tide-mark clock. */
(function () {
  const SOCIAL = '600024';
  const YEARS = [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2021,2022,2023,2024,2025];
  const TAU = Math.PI * 2, R = 142;
  const format = v => d3.format('.1f')(v).replace(/\.0$/, '');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let root, svg, wedge, marks, dot, yearText, valueText, summary, slider, output, built = false, year = 2003;
  const value = (age, y) => { const s = story.series(age, SOCIAL); return s ? s[story.data.years.indexOf(y)] : null; };
  const average = (age, ys) => story.avg(story.series(age, SOCIAL) || [], ys);
  const radians = min => min / 1440 * TAU;
  const validYear = y => y === 2020 ? 2021 : y;
  function render(next, animate = false) {
    if (!built) return;
    year = validYear(next); const age = story.you, now = value(age, year);
    const start = average(age, [2003,2004]), end = average(age, [2024,2025]);
    const a = radians(now == null ? end : now), arc = d3.arc().innerRadius(24).outerRadius(R - 2);
    const old = +wedge.attr('data-angle') || a, tween = d3.interpolateNumber(old, a);
    wedge.interrupt().attr('data-angle', a);
    if (animate && !reduced) wedge.transition('case-wedge').duration(850).ease(d3.easeCubicInOut).attrTween('d', () => t => arc({startAngle:0,endAngle:tween(t)}));
    else wedge.attr('d', arc({startAngle:0,endAngle:a}));
    const data = YEARS.map(y => { const v = value(age,y); return {year:y, value:v, angle:radians(v == null ? a : v)}; });
    const m = marks.selectAll('.tide-mark').data(data, d => d.year).join(enter => { const g=enter.append('g').attr('class','tide-mark'); g.append('line'); g.append('text'); return g; });
    m.attr('transform', d => 'rotate(' + d.angle * 180 / Math.PI + ')').classed('is-current', d => d.year === year).classed('is-recent', d => d.year >= 2024);
    m.select('line').attr('x1',R-1).attr('x2',R+13); m.select('text').attr('x',R+19).attr('y',4).text(d => d.year === year ? d.year : '');
    dot.attr('cx',R*Math.cos(a-Math.PI/2)).attr('cy',R*Math.sin(a-Math.PI/2));
    yearText.text(year); valueText.text(now == null ? 'No estimate published' : format(now) + ' min/day with other people');
    summary.textContent = story.ageName(age) + ': ' + format(start) + ' → ' + format(end) + ' min/day (2003–04 to 2024–25).';
    output.text(year); slider.property('value',year).attr('aria-valuenow',year).attr('aria-valuetext',now == null ? year + ': no ATUS estimate was published' : year + ': ' + format(now) + ' minutes per day');
    svg.attr('aria-label','A clock showing socializing for ages ' + story.ageName(age) + ' in ' + year + '. ' + (now == null ? 'No estimate was published for this year.' : format(now) + ' minutes per day.') + ' Tide marks show every published year from 2003 through 2025.');
  }
  function setYear(next, animate) { next=Math.max(2003,Math.min(2025,Math.round(next))); if(next===2020) next=next>year?2021:2019; render(next,animate); }
  story.chapter('drop', { init(el) {
    root=document.createElement('div'); root.className='opening-panel opening-drop opening-case-clock';
    root.innerHTML='<div class="case-clock-head"><div><p class="opening-heading">Socializing, as a shrinking part of the day</p><p class="opening-summary"></p></div><output class="case-clock-year" aria-live="polite"></output></div><div class="case-clock-plot"></div><p class="case-clock-value" aria-live="polite"></p><div class="case-clock-controls"><label for="case-year">Scrub the years<input id="case-year" type="range" min="2003" max="2025" step="1" value="2003"></label><span class="case-clock-gap" aria-hidden="true">2020 unavailable</span></div><p class="opening-caption">American Time Use Survey, BLS. The pink wedge is socializing and communicating. Each tide mark is a published year; 2020 is marked as a missing survey year.</p>';
    // These are written to with d3's .text(), so they have to be selections, not raw nodes.
    el.append(root); summary=root.querySelector('.opening-summary'); yearText=d3.select(root.querySelector('.case-clock-year')); valueText=d3.select(root.querySelector('.case-clock-value')); slider=d3.select(root.querySelector('#case-year')); output=yearText;
    const plot=root.querySelector('.case-clock-plot'); svg=d3.select(plot).append('svg').attr('viewBox','-180 -180 360 360').attr('role','img'); svg.append('circle').attr('class','case-clock-face').attr('r',R); wedge=svg.append('path').attr('class','case-clock-wedge').attr('transform','rotate(-90)'); marks=svg.append('g').attr('class','case-tide-marks').attr('transform','rotate(-90)'); dot=svg.append('circle').attr('class','case-clock-dot').attr('r',5);
    story.howto(root,'Drag the year slider, or use the scroll steps. The pink wedge is the minutes spent socializing; tide marks show where it used to reach.'); slider.on('input',function(){setYear(+this.value,false);});
    new ResizeObserver(()=>{const w=Math.max(260,plot.clientWidth); plot.style.height=Math.min(460,Math.max(280,w*.72))+'px';}).observe(plot); built=true; render(2003);
  }, step(n){if(n<=1)setYear(2003,true);else setYear(2025,true);}, age(){render(year,false);} });
})();
