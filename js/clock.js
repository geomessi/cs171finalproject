/*
 * Hero + Chapter 6 · The melting clock (NOVEL VIEW)
 * Owner: Georgia (Package 3). Only this package edits this file.
 *
 * One average day as a 24-hour clock face that melts as the years pass.
 *
 * What is data and what is metaphor:
 * - DATA: each wedge's angle is exact (minutes / 1,440 × 360°). The year, the minutes in the
 *   center and the tooltip numbers come straight from data/atus.json.
 * - METAPHOR: under the socializing wedge the rim softens and pink drips hang off the clock,
 *   longer as more minutes are lost since 2003–04 (smoothed over three years so single noisy
 *   years don't jerk it around). Falling drops fill a pool; one drop ≈ 2 minutes.
 *   The melt stays outside the wedges so it never changes what people read.
 * - LOOK (STYLEGUIDE.md): every wedge is dimmed toward the night background; socializing is the
 *   only bright, glowing shape. Pink means socializing only; sand means "you" only.
 * - The wedges show how much of the day each activity takes, not when it happens.
 *   Socializing is rotated to the bottom so it melts with gravity.
 *
 * Registers 'hero' (still 2003 clock) and 'clock' (scroll-driven, with Play and a year slider).
 */
(function () {
  const SOCIAL = '600024';
  const SHORT = {
    '600001': 'Sleep & personal care', '600013': 'Working', '600016': 'Education', '600003': 'Chores',
    '600007': 'Caring at home', '600010': 'Caring for others', '600018': 'Shopping', '600022': 'Eating',
    '600024': 'Socializing', '600025': 'TV', 'leis': 'Other leisure', '600030': 'Civic & religious',
    '600033': 'Calls & email', '600034': 'Other',
  };
  const MIN_PER_DROP = 2;
  const SAG_PER_MIN = 3.4;   // px of rim sag per minute lost
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = ms => (reduceMotion ? 0 : ms);
  const fmt = m => (m >= 60 ? `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}m` : `${Math.round(m)} min`);
  let uid = 0;

  function makeClock(el, { interactive }) {
    const id = `clock${uid++}`;
    const W = 600, H = interactive ? 640 : 560, cx = 300, cy = 262, R = 196, R0 = 96, RIM = R + 12;
    const POOL_Y = H - 42;
    let age = story.you, year = 2003, timer = null, dropsShown = 0;

    el.classList.add('clock-viz');
    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img');
    const defs = svg.append('defs');
    const sheen = defs.append('linearGradient').attr('id', `${id}-sheen`).attr('x1', 0).attr('y1', 0).attr('x2', 1).attr('y2', 1);
    [['0%', '--pearl-a'], ['55%', '--pearl-b'], ['100%', '--pearl-c']].forEach(([o, v]) => sheen.append('stop').attr('offset', o).style('stop-color', `var(${v})`));
    const SHEEN = `url(#${id}-sheen)`;
    const glow = defs.append('filter').attr('id', `${id}-glow`).attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', 7).attr('result', 'b');
    const merge = glow.append('feMerge'); merge.append('feMergeNode').attr('in', 'b'); merge.append('feMergeNode').attr('in', 'SourceGraphic');
    const GLOW = `url(#${id}-glow)`;
    const dusk = code => `color-mix(in srgb, ${story.color(code)} 52%, var(--bg))`;

    const gPool = svg.append('g');
    const rim = svg.append('path').attr('class', 'clock-rim').attr('fill', 'none').attr('stroke', 'var(--muted)').attr('stroke-opacity', 0.55).attr('stroke-width', 1.2);
    const gDrips = svg.append('g').attr('filter', GLOW);
    const gTicks = svg.append('g').attr('transform', `translate(${cx},${cy})`);
    const gWedges = svg.append('g').attr('transform', `translate(${cx},${cy})`);
    const gLabels = svg.append('g').attr('transform', `translate(${cx},${cy})`).attr('pointer-events', 'none');
    const gCenter = svg.append('g').attr('transform', `translate(${cx},${cy})`).attr('text-anchor', 'middle').attr('pointer-events', 'none');
    const gDrops = svg.append('g');

    // 24 ticks, one per hour of the day
    gTicks.selectAll('line').data(d3.range(24)).join('line')
      .attr('x1', d => (R + 3) * Math.sin(d * Math.PI / 12)).attr('y1', d => -(R + 3) * Math.cos(d * Math.PI / 12))
      .attr('x2', d => (R + (d % 6 ? 7 : 10)) * Math.sin(d * Math.PI / 12)).attr('y2', d => -(R + (d % 6 ? 7 : 10)) * Math.cos(d * Math.PI / 12))
      .attr('stroke', 'var(--faint)').attr('stroke-width', d => (d % 6 ? 1 : 1.6));

    const yearText = gCenter.append('text').attr('class', 'clock-year').attr('y', -2);
    const socText = gCenter.append('text').attr('class', 'clock-soc').attr('y', 28);
    gCenter.append('text').attr('class', 'clock-soc-label').attr('y', 46).text('socializing a day');

    const pool = gPool.append('ellipse').attr('cx', cx).attr('cy', POOL_Y).attr('rx', 0).attr('ry', 0).style('fill', 'var(--c-social)').attr('opacity', 0.75).attr('filter', `url(#${id}-glow)`);
    const poolText = gPool.append('text').attr('class', 'clock-pool-label').attr('x', cx).attr('y', POOL_Y + 30).attr('text-anchor', 'middle');

    const arc = d3.arc().innerRadius(R0).outerRadius(R);
    const pie = d3.pie().sort(null).value(d => d.min);

    const tip = d3.select(el).append('div').attr('class', 'clock-tip').attr('hidden', true);

    // ----- data for a year -----
    function dayFor(a, y) {
      const i = story.data.years.indexOf(y);
      const parts = story.DAY_PARTS.map(code => ({ code, min: story.series(a, code)?.[i] }));
      if (parts.some(p => p.min == null)) return null;
      const arcs = pie(parts);
      const s = arcs.find(d => d.data.code === SOCIAL);
      const turn = Math.PI - (s.startAngle + s.endAngle) / 2;   // put socializing at the bottom
      arcs.forEach(d => { d.startAngle += turn; d.endAngle += turn; });
      return arcs;
    }
    const validYears = a => story.data.years.filter(y => dayFor(a, y));
    const baseline = a => story.avg(story.series(a, SOCIAL), [2003, 2004]);
    function lostBy(a, y) {           // smoothed minutes of socializing lost vs 2003–04, never negative
      const s = story.series(a, SOCIAL), ys = story.data.years;
      const near = [y - 1, y, y + 1].map(t => s[ys.indexOf(t)]).filter(v => v != null);
      return Math.max(0, baseline(a) - d3.mean(near));
    }

    // ----- the rim: a circle pulled down under socializing -----
    function rimPath(sag) {
      const pts = d3.range(0, 2 * Math.PI, Math.PI / 90).map(t => {
        const pull = sag * Math.exp(-(((t - Math.PI) / 0.34) ** 2));
        return [cx + RIM * Math.sin(t), cy - RIM * Math.cos(t) + pull];
      });
      return d3.line().curve(d3.curveCatmullRomClosed)(pts);
    }

    // Hanging drips: offset from the bottom center, width, and share of the full drip length
    const DRIPS = [{ dx: -30, w: 5, len: 0.4 }, { dx: -14, w: 7, len: 0.78 }, { dx: 0, w: 10, len: 1 }, { dx: 15, w: 6, len: 0.6 }, { dx: 29, w: 4, len: 0.3 }];
    function dripPath(x, y0, w, L) {   // a soft stem with a round bead at the end
      const r = w / 2, b = w * 0.8, Ls = Math.max(0, L);
      if (Ls < 1) return `M${x - r},${y0} L${x + r},${y0} Z`;
      return `M${x - r},${y0} C${x - r},${y0 + Ls * 0.5} ${x - b},${y0 + Ls - b} ${x - b},${y0 + Ls} `
        + `A${b},${b} 0 1 0 ${x + b},${y0 + Ls} C${x + b},${y0 + Ls - b} ${x + r},${y0 + Ls * 0.5} ${x + r},${y0} Z`;
    }

    function setPool(n) {
      pool.transition().duration(dur(300)).attr('rx', n ? 8 + n * 3.2 : 0).attr('ry', n ? 3 + n * 0.35 : 0);
    }

    function render(y, { t = 450, drip = false } = {}) {
      const arcs = dayFor(age, y);
      if (!arcs) return;
      year = y;

      gWedges.selectAll('path').data(arcs, d => d.data.code).join(
        enter => enter.append('path').each(function (d) { this._a = d; })
          .attr('d', arc).attr('stroke', 'var(--bg)').attr('stroke-width', 1)
          .on('mousemove', (e, d) => showTip(e, d)).on('mouseleave', () => tip.attr('hidden', true)),
      )
        .style('fill', d => (d.data.code === SOCIAL ? 'var(--c-social)' : dusk(d.data.code)))
        .attr('filter', d => (d.data.code === SOCIAL ? GLOW : null))
        .attr('stroke', d => (d.data.code === SOCIAL ? SHEEN : 'var(--bg)'))
        .attr('stroke-width', d => (d.data.code === SOCIAL ? 1.5 : 1))
        .transition().duration(dur(t)).ease(d3.easeCubicInOut)
        .attrTween('d', function (d) { const i = d3.interpolate(this._a, d); this._a = i(1); return k => arc(i(k)); });

      const big = arcs.filter(d => d.endAngle - d.startAngle > 0.42);
      gLabels.selectAll('g').data(big, d => d.data.code).join(enter => {
        const g = enter.append('g').attr('class', 'clock-label');
        g.append('text').attr('class', 'n');
        g.append('text').attr('class', 'v').attr('dy', 14);
        return g;
      })
        .transition().duration(dur(t)).attr('transform', d => { const [x, yy] = arc.centroid(d); return `translate(${x},${yy})`; });
      gLabels.selectAll('g').select('.n').text(d => SHORT[d.data.code]);
      gLabels.selectAll('g').select('.v').text(d => fmt(d.data.min));

      const soc = arcs.find(d => d.data.code === SOCIAL).data.min;
      yearText.text(y);
      socText.text(`${Math.round(soc)} min`);

      const lost = lostBy(age, y);
      const sag = Math.min(90, lost * SAG_PER_MIN);
      rim.transition().duration(dur(t)).ease(d3.easeCubicInOut).attr('d', rimPath(sag * 0.28));
      const rimY = cy + RIM + sag * 0.28;
      gDrips.selectAll('path').data(DRIPS).join('path').style('fill', 'var(--c-social)')
        .transition().duration(dur(t)).ease(d3.easeCubicInOut)
        .attr('d', d => dripPath(cx + d.dx, rimY - 3 - Math.abs(d.dx) * 0.12, d.w, sag * d.len));

      const target = Math.round(lost / MIN_PER_DROP);
      if (drip && !reduceMotion && target > dropsShown) {
        const tipY = cy + RIM + Math.min(90, lost * SAG_PER_MIN) * 1.28;
        d3.range(target - dropsShown).forEach(k => {
          gDrops.append('circle').attr('cx', cx + (Math.random() - 0.5) * 4).attr('cy', tipY).attr('r', 4)
            .style('fill', 'var(--c-social)')
            .transition().delay(k * 120).duration(650).ease(d3.easeQuadIn).attr('cy', POOL_Y)
            .on('end', function () { d3.select(this).remove(); });
        });
        setTimeout(() => setPool(target), 650);
      } else {
        setPool(target);
      }
      dropsShown = target;
      const lostRaw = baseline(age) - story.avg(story.series(age, SOCIAL), [y - 1, y].filter(v => v !== 2020));
      poolText.text(y <= 2004 ? '' : lostRaw > 0.5 ? `−${Math.round(lostRaw)} min a day vs. 2003–04` : 'about the same as 2003–04');

      if (interactive) { slider.property('value', y); out.text(y); }
    }

    function showTip(e, d) {
      const box = el.getBoundingClientRect();
      tip.attr('hidden', null).html(`<b>${story.ACTIVITIES[d.data.code].name}</b><span>${fmt(d.data.min)} a day in ${year}</span>`)
        .style('left', `${Math.min(e.clientX - box.left + 12, box.width - 190)}px`).style('top', `${e.clientY - box.top + 12}px`);
    }

    // ----- controls (chapter version only) -----
    let slider, out, playBtn;
    function stop() { if (timer) { timer.stop(); timer = null; } if (playBtn) playBtn.text('Play 2003 → 2025'); }
    function play() {
      stop();
      const ys = validYears(age);
      if (reduceMotion) { render(ys.at(-1), { t: 0 }); return; }
      let i = 0;
      dropsShown = 0;
      render(ys[0], { t: 0 });
      if (playBtn) playBtn.text('Pause');
      timer = d3.interval(() => {
        i += 1;
        if (i >= ys.length) { stop(); return; }
        render(ys[i], { t: 260, drip: true });
      }, 300);
    }
    if (interactive) {
      const c = d3.select(el).append('div').attr('class', 'clock-controls');
      playBtn = c.append('button').attr('type', 'button').attr('id', 'clock-play').text('Play 2003 → 2025')
        .on('click', () => (timer ? stop() : play()));
      slider = c.append('input').attr('type', 'range').attr('id', 'clock-year').attr('min', 2003).attr('max', 2025).attr('step', 1)
        .attr('aria-label', 'Year').on('input', function () {
          stop();
          let y = +this.value;
          if (y === 2020) y = year < 2020 ? 2021 : 2019;
          render(y, { t: 200 });
        });
      out = c.append('output').attr('for', 'clock-year').attr('class', 'clock-out');
      d3.select(el).append('p').attr('class', 'clock-note')
        .text('Each tick is one hour. Wedges show how much of an average day goes to each activity, not when. Each drop is about 2 minutes of socializing lost since 2003–04. American Time Use Survey, BLS; no 2020 estimates.');
    }

    return {
      render, play, stop,
      setAge(a) { age = a; stop(); const ys = validYears(a); dropsShown = 0; gDrops.selectAll('*').interrupt().remove(); render(ys.includes(year) ? year : ys[0], { t: 300 }); },
      get year() { return year; },
    };
  }

  let hero, main;

  story.chapter('hero', {
    init(el) { hero = makeClock(el, { interactive: false }); hero.render(2003, { t: 0 }); },
    age(code) { hero?.setAge(code); hero?.render(2003, { t: 300 }); },
  });

  story.chapter('clock', {
    init(el) { main = makeClock(el, { interactive: true }); main.render(2003, { t: 0 }); },
    step(n, dir) {
      if (!main) return;
      if (n === 0) { main.stop(); main.render(2003, { t: 400 }); }
      if (n === 1 && dir === 'down') main.play();
      if (n === 2 && main.year < 2025) { main.stop(); main.render(2025, { t: 600, drip: true }); }
    },
    age(code) { main?.setAge(code); },
  });
})();
