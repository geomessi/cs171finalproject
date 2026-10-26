/*
 * Weigh it · The balance scale · Owner: Georgia (Package 3). Only this package edits this file.
 *
 * A painted balance scale in the world's style: one pan holds the waking hours spent with other
 * people, the other the hours spent alone (BLS "who with" data, from 2010).
 *
 * What is data:
 * - Tilt is proportional to the difference: (with others − alone) / (with others + alone).
 * - The 24 tiny figures split between the pans in proportion to the minutes, so each figure is
 *   about 1/24 of waking time. "With others" figures stand in groups of three; "alone" figures apart.
 * - Steps show two-year averages (2010–11, then 2024–25); the slider shows single years.
 * - Age band follows the "I'm…" menu (the "who with" bands differ: 15–24 → 20–24, 65+ → 65–74).
 */
(function () {
  const BAND = { '000': ['000', 'all ages', 'Americans'], '103': ['020', '20–24', '20–24-year-olds'], '031': ['031', '25–34', '25–34-year-olds'], '038': ['038', '35–44', '35–44-year-olds'], '042': ['042', '45–54', '45–54-year-olds'], '049': ['049', '55–64', '55–64-year-olds'], '065': ['113', '65–74', '65–74-year-olds'] };
  const F = 24;                       // figures shared between the pans
  const W = 600, H = 560, PX = 300, PY = 168, ARM = 214, DROP = 150, GROUND = 478;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hm = m => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}m`;
  const words = ['No one', 'One person', 'Two people', 'Three people', 'Four people', 'Five people', 'Six people', 'Seven people', 'Eight people'];

  let svg, beam, panL, panR, tagL, tagR, stringsL, stringsR, yearText, bandText, slider, out;
  let age = '103', theta = 0, mode = { kind: 'period', years: [2010, 2011] };

  function minutes(years) {
    const [band] = BAND[age] || BAND['000'];
    const al = story.data.who[`01|${band}|00`], ot = story.data.who[`02|${band}|00`];
    const A = story.avg(al, years), O = story.avg(ot, years);
    return { A, O };
  }
  const counts = ({ A, O }) => { const nA = Math.round(F * A / (A + O)); return { nA, nO: F - nA }; };
  const tiltFor = ({ A, O }) => -26 * (O - A) / (O + A);   // degrees; negative lowers the left ("with others") pan

  // A tiny standing person with a long shadow (sun from the left)
  function person(sel) {
    sel.append('ellipse').attr('class', 'bp-shadow').attr('cx', 9).attr('cy', 0).attr('rx', 10).attr('ry', 2.2);
    sel.append('rect').attr('class', 'bp-body').attr('x', -4.5).attr('y', -18).attr('width', 9).attr('height', 18).attr('rx', 4);
    sel.append('circle').attr('class', 'bp-body').attr('cx', 0).attr('cy', -22.5).attr('r', 4.2);
  }
  function layout(n, alone) {
    const pts = [];
    if (alone) {
      const step = Math.min(30, 150 / Math.max(n, 1));
      for (let i = 0; i < n; i++) { const row = i % 2; pts.push([(i - (n - 1) / 2) * step, row ? 5 : -3]); }
    } else {
      const groups = Math.ceil(n / 3), gap = Math.min(44, 160 / Math.max(groups, 1));
      for (let i = 0; i < n; i++) {
        const g = Math.floor(i / 3), m = i % 3;
        pts.push([(g - (groups - 1) / 2) * gap + (m - 1) * 8, (g % 2 ? 5 : -3) + (m === 1 ? 2 : 0)]);
      }
    }
    return pts;
  }

  function placeAt(th) {
    theta = th;
    const r = th * Math.PI / 180;
    beam.attr('transform', `rotate(${th} ${PX} ${PY})`);
    const ends = [[-ARM, 0], [ARM, 0]].map(([x]) => [PX + x * Math.cos(r), PY + x * Math.sin(r)]);
    [[panL, stringsL, tagL, ends[0]], [panR, stringsR, tagR, ends[1]]].forEach(([pan, strings, tag, [ex, ey]]) => {
      pan.attr('transform', `translate(${ex},${ey + DROP})`);
      strings.attr('d', `M${ex},${ey} L${ex - 86},${ey + DROP - 4} M${ex},${ey} L${ex + 86},${ey + DROP - 4} M${ex},${ey} L${ex},${ey + DROP - 10}`);
      tag.attr('transform', `translate(${ex},${ey - 54})`);
    });
  }

  function show(m, label, animate = true) {
    const { nA, nO } = counts(m);
    const target = tiltFor(m);
    const start = theta;
    if (animate && !reduceMotion) {
      svg.transition('tilt').duration(1100).ease(d3.easeCubicInOut)
        .tween('tilt', () => t => placeAt(start + (target - start) * t));
    } else placeAt(target);

    [[panL, nO, false], [panR, nA, true]].forEach(([pan, n, alone]) => {
      const pts = layout(n, alone);
      pan.select('.bp-people').selectAll('g.bp-person').data(pts, (d, i) => i).join(
        enter => enter.append('g').attr('class', 'bp-person').style('opacity', 0).call(person)
          .attr('transform', d => `translate(${d[0]},${d[1] - 3})`),
        update => update,
        exit => exit.transition().duration(reduceMotion ? 0 : 400).style('opacity', 0).remove(),
      )
        .transition().duration(reduceMotion ? 0 : 900).ease(d3.easeCubicOut)
        .style('opacity', 1).attr('transform', d => `translate(${d[0]},${d[1] - 3})`);
    });

    const tot = m.A + m.O;
    tagL.select('.bt-value').text(hm(m.O)); tagL.select('.bt-share').text(`${Math.round(100 * m.O / tot)}% of waking time`);
    tagR.select('.bt-value').text(hm(m.A)); tagR.select('.bt-share').text(`${Math.round(100 * m.A / tot)}% of waking time`);
    yearText.text(label);
    bandText.text(`AGES ${(BAND[age] || BAND['000'])[1].toUpperCase()} · WAKING HOURS A DAY`);
  }

  function refresh(animate = true) {
    if (mode.kind === 'period') show(minutes(mode.years), mode.years[0] === 2010 ? '2010–11' : '2024–25', animate);
    else show(minutes([mode.year]), String(mode.year), animate);
    if (slider) { slider.property('value', mode.kind === 'year' ? mode.year : mode.years[0]); out.text(mode.kind === 'year' ? mode.year : (mode.years[0] === 2010 ? '2010–11' : '2024–25')); }
  }

  function syncText() {
    const b = BAND[age] || BAND['000'];
    document.querySelectorAll('[data-balance-band]').forEach(n => { n.textContent = b[2]; });
    const moved = counts(minutes([2010, 2011])).nO - counts(minutes([2024, 2025])).nO;
    document.querySelectorAll('[data-balance-moved]').forEach(n => { n.textContent = moved > 0 ? (words[moved] || `${moved} people`) : 'No one'; });
  }

  function build(el) {
    el.classList.add('balance-viz');
    svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
      .attr('aria-label', 'Balance scale: waking hours spent with other people versus alone');
    const defs = svg.append('defs');
    const clip = defs.append('clipPath').attr('id', 'bp-clip'); clip.append('rect').attr('width', W).attr('height', H).attr('rx', 14);
    const sky = defs.append('linearGradient').attr('id', 'bp-sky').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    [['0%', '#22348F'], ['52%', '#3A52B6'], ['80%', '#F3D3A2'], ['100%', '#F3D3A2']].forEach(([o, c]) => sky.append('stop').attr('offset', o).attr('stop-color', c));
    const pearl = defs.append('linearGradient').attr('id', 'bp-pearl').attr('x1', 0).attr('y1', 0).attr('x2', 1).attr('y2', 0);
    [['0%', '#C9C2B6'], ['45%', '#FBF8F2'], ['100%', '#D8D2C6']].forEach(([o, c]) => pearl.append('stop').attr('offset', o).attr('stop-color', c));
    const panG = defs.append('linearGradient').attr('id', 'bp-pan').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    [['0%', '#FBF8F2'], ['100%', '#CFC8BB']].forEach(([o, c]) => panG.append('stop').attr('offset', o).attr('stop-color', c));
    defs.append('filter').attr('id', 'bp-blur').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
      .append('feGaussianBlur').attr('stdDeviation', 12);

    const scene = svg.append('g').attr('clip-path', 'url(#bp-clip)');
    scene.append('rect').attr('width', W).attr('height', H).attr('fill', 'url(#bp-sky)');
    [[120, 120, 90, 26], [470, 92, 110, 30], [380, 250, 70, 18]].forEach(([x, y, rx, ry]) =>
      scene.append('ellipse').attr('cx', x).attr('cy', y).attr('rx', rx).attr('ry', ry).attr('fill', '#F4A9C8').attr('opacity', 0.8).attr('filter', 'url(#bp-blur)'));
    scene.append('path').attr('fill', '#E2C29A').attr('d', `M0,${GROUND - 40} C140,${GROUND - 90} 260,${GROUND - 30} 380,${GROUND - 56} S560,${GROUND - 70} ${W},${GROUND - 44} L${W},${H} L0,${H} Z`);
    scene.append('path').attr('fill', '#D8B489').attr('d', `M0,${GROUND + 6} C170,${GROUND - 20} 420,${GROUND + 24} ${W},${GROUND - 4} L${W},${H} L0,${H} Z`);

    // stand
    scene.append('ellipse').attr('cx', PX + 40).attr('cy', GROUND + 6).attr('rx', 90).attr('ry', 9).attr('fill', '#2A2320').attr('opacity', 0.22);
    scene.append('ellipse').attr('cx', PX).attr('cy', GROUND).attr('rx', 56).attr('ry', 12).attr('fill', 'url(#bp-pan)').attr('stroke', '#B8B0A2');
    scene.append('rect').attr('x', PX - 6).attr('y', PY).attr('width', 12).attr('height', GROUND - PY - 4).attr('rx', 5).attr('fill', 'url(#bp-pearl)');

    stringsL = scene.append('path').attr('class', 'bp-string');
    stringsR = scene.append('path').attr('class', 'bp-string');
    beam = scene.append('g');
    beam.append('rect').attr('x', PX - ARM - 6).attr('y', PY - 5).attr('width', 2 * ARM + 12).attr('height', 10).attr('rx', 5).attr('fill', 'url(#bp-pearl)');
    scene.append('circle').attr('cx', PX).attr('cy', PY).attr('r', 13).attr('fill', 'url(#bp-pearl)').attr('stroke', '#B8B0A2');

    function makePan() {
      const p = scene.append('g');
      p.append('ellipse').attr('cx', 0).attr('cy', 4).attr('rx', 92).attr('ry', 14).attr('fill', '#B8B0A2');
      p.append('ellipse').attr('cx', 0).attr('cy', 0).attr('rx', 92).attr('ry', 13).attr('fill', 'url(#bp-pan)');
      p.append('g').attr('class', 'bp-people');
      return p;
    }
    panL = makePan(); panR = makePan();

    function makeTag(title) {
      const t = scene.append('g').attr('class', 'bp-tag');
      t.append('rect').attr('x', -66).attr('y', -34).attr('width', 132).attr('height', 62).attr('rx', 10);
      t.append('text').attr('class', 'bt-title').attr('y', -17).text(title);
      t.append('text').attr('class', 'bt-value').attr('y', 6);
      t.append('text').attr('class', 'bt-share').attr('y', 21);
      return t;
    }
    tagL = makeTag('WITH OTHERS'); tagR = makeTag('ALONE');

    yearText = scene.append('text').attr('class', 'bp-year').attr('x', PX).attr('y', 58);
    bandText = scene.append('text').attr('class', 'bp-band').attr('x', PX).attr('y', 82);

    const c = d3.select(el).append('div').attr('class', 'balance-controls');
    slider = c.append('input').attr('type', 'range').attr('id', 'balance-year').attr('min', 2010).attr('max', 2025).attr('step', 1)
      .attr('aria-label', 'Year').on('input', function () {
        let y = +this.value;
        if (y === 2020) y = mode.kind === 'year' && mode.year < 2020 ? 2021 : 2019;
        mode = { kind: 'year', year: y }; refresh();
      });
    out = c.append('output').attr('for', 'balance-year').attr('class', 'balance-out');
    d3.select(el).append('p').attr('class', 'balance-note')
      .text('Each figure is about 1/24 of waking time. Tilt and figures are proportional to the hours. BLS American Time Use Survey, "who with" data; no 2020 estimates.');

    placeAt(0);
  }

  story.chapter('balance', {
    init(el) { age = story.you; build(el); syncText(); refresh(false); },
    step(n) {
      if (n === 0) mode = { kind: 'period', years: [2010, 2011] };
      if (n === 1) mode = { kind: 'period', years: [2024, 2025] };
      if (n <= 1) refresh();
    },
    age(code) { age = code; syncText(); if (svg) refresh(); },
  });
})();
