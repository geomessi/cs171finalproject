/* Package 1 · Guess, then reveal. The hero's clock shows one day in 2003–04, then zooms into one hour:
   the reader drags the minute hand to guess how much of that hour is left. Values come from the shared ATUS data.
   With the 3D world, the whole hero clock flies off its plinth and lands in this card as you scroll in; the chart
   takes over from it and turns from the painted dial into the site's colors (scroll-linked, so it plays back in reverse too). */
(function () {
  const SOCIAL = '600024';
  const R = 150, C = R + 38, W = 2 * C, TAU = Math.PI * 2;
  const RF = R / 0.84;   // the whole painted face: on the 3D clock the wedges end at 84% of it
  const DAY = 1440, HOUR = 60;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = ms => (reduceMotion ? 0 : ms);
  const format = v => d3.format('.1f')(v).replace(/\.0$/, '');
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const arc = d3.arc();
  const polar = (r, a) => [C + r * Math.sin(a), C - r * Math.cos(a)];
  let root, svg, output, button, feedback, question, legend, slot;
  let gFace, gDay, gDayTicks, gHourTicks, gGuess, guessWedge, hand, knob, band;
  let guess = 30, revealed = false, bandShown = false, span = DAY, zoomed = false, dragging = false;
  let q = 1;   // 0 = looks like the painted 3D face, 1 = the chart in the site's colors

  const actualNow = () => story.avg(story.series(story.you, SOCIAL) || [], [2024, 2025]);
  const then = () => story.avg(story.series(story.you, SOCIAL) || [], [2003, 2004]);

  // Wedge colors: the world's painted palette at q = 0, the site's dusk colors (52% toward the night) at q = 1
  function colorFor(code) {
    const chart = code === SOCIAL ? css('--c-social') : d3.interpolateRgb(css(story.ACTIVITIES[code].color), css('--bg'))(0.48);
    if (q >= 1 || !window.world) return chart;
    const pal = world.palette;
    return d3.interpolateRgb(code === SOCIAL ? pal.social : pal.act[code], chart)(q);
  }

  // The 2003–04 day for this age, socializing first so it starts at 12 o'clock.
  // `span` is how many minutes fit around the face: 1,440 is the whole day, 60 is one hour.
  function drawDay() {
    const parts = story.DAY_PARTS.map(code => ({ code, min: story.avg(story.series(story.you, code) || [], [2003, 2004]) || 0 }));
    let cum = 0;
    const rows = [parts.find(p => p.code === SOCIAL), ...parts.filter(p => p.code !== SOCIAL)].map(p => {
      const a0 = Math.min(TAU, cum / span * TAU); cum += p.min;
      return { code: p.code, a0, a1: Math.min(TAU, cum / span * TAU) };
    });
    // The 3D clock lands with socializing at the bottom; the chart turns it up to start at 12 o'clock.
    const turn = (Math.PI - rows[0].a1 / 2) * (1 - q);
    gDay.attr('transform', `translate(${C},${C}) rotate(${turn * 180 / Math.PI})`);
    const seam = window.world && q < 1 ? d3.interpolateRgb(world.palette.face, css('--bg'))(q) : 'var(--bg)';
    gDay.selectAll('path').data(rows, d => d.code).join('path')
      .style('fill', d => colorFor(d.code))
      .attr('stroke', seam).attr('stroke-width', d => (d.a1 - d.a0 > 0.01 ? 1 : 0))
      .attr('d', d => arc.innerRadius(RF * 0.2 * (1 - q)).outerRadius(R)({ startAngle: d.a0, endAngle: d.a1 }));
    if (gFace) {
      gFace.style('opacity', 1 - q);
      gDayTicks.style('stroke', d3.interpolateRgb(world.palette.ink, css('--faint'))(q));
    }
  }

  // Zoom from the whole day into one hour (or back). Log scale, so it feels like a camera zoom.
  function zoom(toHour, t) {
    if (toHour === zoomed) return;
    zoomed = toHour;
    const i = d3.interpolate(Math.log(span), Math.log(toHour ? HOUR : DAY));
    svg.transition('zoom').duration(dur(t)).ease(d3.easeCubicInOut)
      .tween('span', () => k => { span = Math.exp(i(k)); drawDay(); });
    // Once zoomed, only the 2003–04 socializing wedge stays, faded, as the hour to guess against.
    gDay.selectAll('path').transition('fade').delay(toHour ? dur(t * 0.8) : 0).duration(dur(500))
      .style('opacity', d => (!toHour ? 1 : d.code === SOCIAL ? 0.22 : 0));
    gDayTicks.transition().duration(dur(t / 2)).style('opacity', toHour ? 0 : 1);
    gHourTicks.transition().delay(toHour ? dur(t / 2) : 0).duration(dur(t / 2)).style('opacity', toHour ? 1 : 0);
    gGuess.transition().delay(toHour ? dur(t * 0.85) : 0).duration(dur(400)).style('opacity', toHour ? 1 : 0);
    root.dataset.zoomed = String(toHour);
    render();
  }

  // ----- the flight from the 3D clock into the card -----
  // Scroll progress p runs 0 → 1 as the card slides up to its sticky spot. Until LAND the 3D clock flies
  // (world.js); by SWAP this chart has faded in on top of it, then it fades the dial into the site's colors.
  const LAND = 0.8, SWAP = 0.86;
  function flyFrame() {
    const card = root.parentElement, top = card.getBoundingClientRect().top;
    const stick = parseFloat(getComputedStyle(card).top) || 0;
    const p = Math.max(0, Math.min(1, (innerHeight - top) / Math.max(1, innerHeight - stick)));
    const onScreen = document.getElementById('guess').getBoundingClientRect().bottom > 0;
    const r = slot.getBoundingClientRect(), s = Math.min(r.width, r.height) / W;
    world.holdHero(p > 0 && p < 1);
    // Once the reader scrolls past this chapter, the clock goes home to its plinth for the rest of the story.
    world.flyClock(p >= 1 ? +onScreen : d3.easeCubicInOut(Math.min(1, p / LAND)),
      { x: r.left + r.width / 2, y: r.top + r.height / 2, r: RF * s }, onScreen && p >= SWAP);
    svg.style('opacity', p >= 1 ? null : Math.max(0, Math.min(1, (p - LAND) / (SWAP - LAND))));
    const nq = p >= 1 ? 1 : Math.max(0, (p - SWAP) / (1 - SWAP));
    if (nq !== q) { q = nq; drawDay(); }
    // The card's frosted glass stays clear while the clock flies in, so the clock isn't blurred behind it.
    card.style.background = q >= 1 ? '' : `color-mix(in srgb, var(--surface) ${80 * q}%, transparent)`;
    card.style.backdropFilter = card.style.webkitBackdropFilter = q >= 1 ? '' : `blur(${14 * q}px)`;
  }

  function setGuess(m) {
    m = Math.max(0, Math.min(HOUR, m));
    if (m === guess && !revealed) return;
    guess = m; revealed = false; render();
  }

  // Minutes under the pointer. While dragging, the hand stops at 0 or 60 instead of jumping across 12 o'clock.
  function minutesAt(e) {
    const [x, y] = d3.pointer(e, svg.node());
    let a = Math.atan2(x - C, C - y); if (a < 0) a += TAU;
    let m = Math.round(a / TAU * HOUR);
    if (dragging && guess > 45 && m < 15) m = HOUR;
    else if (dragging && guess < 15 && m > 45) m = 0;
    return m;
  }

  function render() {
    if (!root) return;
    const age = story.ageName(story.you), actual = actualNow(), base = then();
    question.textContent = zoomed
      ? `One hour on the clock. Ages ${age} had ${format(base)} minutes of it in 2003–04. How much is left?`
      : `One average day in 2003–04, ages ${age}. Socializing is pink.`;
    output.value = `${guess} min/day`;
    const a = guess / HOUR * TAU;
    guessWedge.attr('d', arc.innerRadius(0).outerRadius(R)({ startAngle: 0, endAngle: a }));
    const [hx, hy] = polar(R - 10, a);
    hand.attr('x2', hx).attr('y2', hy);
    knob.attr('cx', hx).attr('cy', hy).style('opacity', zoomed ? 1 : 0)
      .attr('aria-valuenow', guess).attr('aria-valuetext', `${guess} minutes per day`);
    button.textContent = revealed ? 'Try again' : 'Reveal the average';
    button.disabled = actual == null;
    if (actual == null) feedback.textContent = 'No estimate is available for this age group.';
    else if (!zoomed) feedback.textContent = '';
    else if (!revealed) feedback.textContent = 'Drag the hand around the clock, then see how it compares.';
    else {
      const diff = actual - guess;
      feedback.textContent = diff === 0 ? `Exactly right: ${format(actual)} min/day in 2024–25.`
        : `The average is ${format(actual)} min/day — ${format(Math.abs(diff))} min ${diff > 0 ? 'higher' : 'lower'} than your guess.`;
    }
    // The real answer: a glowing ring around the rim that sweeps out to today's minutes.
    const show = revealed && actual != null;
    if (show && !bandShown) {
      band.attr('opacity', 1).transition().duration(dur(800)).ease(d3.easeCubicOut)
        .attrTween('d', () => k => arc.innerRadius(R + 7).outerRadius(R + 17)({ startAngle: 0, endAngle: k * actual / HOUR * TAU }));
    } else if (!show) band.interrupt().attr('opacity', 0);
    bandShown = show;
    legend.innerHTML = `<span class="key-then">2003–04: ${format(base)} min</span><span class="key-guess">Your guess: ${guess} min</span>`
      + (show ? `<span class="key-now">2024–25: ${format(actual)} min</span>` : '');
    svg.attr('aria-label', !zoomed
      ? `A 24-hour clock of one average day for ages ${age} in 2003–04. Socializing takes ${format(base)} minutes.`
      : `A one-hour clock. Your guess: ${guess} minutes per day.` + (show ? ` Survey average for ages ${age}: ${format(actual)} minutes per day in 2024–25.` : ''));
    root.dataset.revealed = String(revealed);
  }

  story.chapter('guess', {
    init(el) {
      root = document.createElement('div'); root.className = 'opening-panel opening-guess'; root.dataset.zoomed = 'false';
      root.innerHTML = `<div class="guess-top"><p class="opening-heading" id="guess-question"></p>
          <p class="guess-readout">Your guess <output id="guess-output"></output></p></div>
        <div class="guess-clock"></div>
        <p class="guess-legend" aria-hidden="true"></p>
        <div class="guess-actions"><button class="opening-button" type="button" aria-controls="guess-feedback">Reveal the average</button>
          <p class="guess-feedback" id="guess-feedback" role="status" aria-live="polite" aria-atomic="true"></p></div>
        <p class="opening-caption">American Time Use Survey, BLS. Averages of 2003–04 and 2024–25, across all days.</p>`;
      el.append(root);
      question = root.querySelector('#guess-question'); output = root.querySelector('output'); slot = root.querySelector('.guess-clock');
      button = root.querySelector('button'); feedback = root.querySelector('#guess-feedback'); legend = root.querySelector('.guess-legend');
      svg = d3.select(slot).append('svg').attr('viewBox', `0 0 ${W} ${W}`).attr('role', 'img');

      const glow = svg.append('defs').append('filter').attr('id', 'guess-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
      glow.append('feGaussianBlur').attr('stdDeviation', 5).attr('result', 'b');
      const merge = glow.append('feMerge'); merge.append('feMergeNode').attr('in', 'b'); merge.append('feMergeNode').attr('in', 'SourceGraphic');

      // The painted dial of the 3D clock (bezel, cream face, hour numerals), so the handoff from the 3D clock is seamless.
      if (window.world && !reduceMotion) {
        gFace = svg.append('g').attr('class', 'guess-dial').style('opacity', 0);
        gFace.append('circle').attr('cx', C).attr('cy', C).attr('r', RF * 1.012).style('fill', 'none').style('stroke', world.palette.bezel).style('stroke-width', RF * 0.068);
        gFace.append('circle').attr('cx', C).attr('cy', C).attr('r', RF).style('fill', world.palette.face);
        gFace.selectAll('text').data(d3.range(0, 24, 3)).join('text')
          .each(function (h) { const [x, y] = polar(RF * 0.948, h / 24 * TAU); d3.select(this).attr('x', x).attr('y', y); })
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').style('fill', world.palette.ink)
          .text(h => (h === 0 ? '24h' : `${h}h`));
      }
      gDay = svg.append('g').attr('transform', `translate(${C},${C})`);
      svg.append('circle').attr('class', 'guess-rim').attr('cx', C).attr('cy', C).attr('r', R);
      // 24 hour ticks (the day) and 60 minute ticks (the hour); the zoom crossfades them
      gDayTicks = svg.append('g').attr('class', 'guess-ticks');
      gDayTicks.selectAll('line').data(d3.range(24)).join('line')
        .each(function (d) { const a = d / 24 * TAU, [x1, y1] = polar(R + 3, a), [x2, y2] = polar(R + (d % 6 ? 7 : 10), a); d3.select(this).attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2); })
        .attr('stroke-width', d => (d % 6 ? 1 : 1.6));
      gHourTicks = svg.append('g').attr('class', 'guess-ticks').style('opacity', 0);
      gHourTicks.selectAll('line').data(d3.range(60)).join('line')
        .each(function (d) { const a = d / 60 * TAU, [x1, y1] = polar(R - (d % 5 ? 5 : 11), a), [x2, y2] = polar(R, a); d3.select(this).attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2); })
        .attr('stroke-width', d => (d % 5 ? 1 : 1.8));
      gHourTicks.selectAll('text').data([15, 30, 45, 60]).join('text').attr('class', 'guess-tick-label')
        .each(function (d) { const [x, y] = polar(R + 30, d / 60 * TAU); d3.select(this).attr('x', x).attr('y', y); })
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').text(d => (d === 60 ? '60 min' : d));

      band = svg.append('path').attr('class', 'guess-band').attr('transform', `translate(${C},${C})`).attr('filter', 'url(#guess-glow)').attr('opacity', 0);
      gGuess = svg.append('g').style('opacity', 0);
      guessWedge = gGuess.append('path').attr('class', 'guess-wedge').attr('transform', `translate(${C},${C})`);
      hand = gGuess.append('line').attr('class', 'guess-hand').attr('x1', C).attr('y1', C);
      gGuess.append('circle').attr('class', 'guess-pivot').attr('cx', C).attr('cy', C).attr('r', 5);

      // The whole face is the drag target, so a tap anywhere on it moves the hand there.
      const face = svg.append('circle').attr('class', 'guess-face').attr('cx', C).attr('cy', C).attr('r', R + 22);
      knob = svg.append('circle').attr('class', 'guess-knob').attr('r', 11).attr('tabindex', 0).attr('role', 'slider')
        .attr('aria-label', 'Your guess, minutes per day').attr('aria-valuemin', 0).attr('aria-valuemax', HOUR)
        .attr('aria-describedby', 'guess-question');
      [face, knob].forEach(s => s
        .on('pointerdown', e => {
          e.preventDefault(); zoom(true, 1400); knob.node().focus({ preventScroll: true });
          dragging = false; setGuess(minutesAt(e)); dragging = true; e.target.setPointerCapture(e.pointerId);
        })
        .on('pointermove', e => { if (dragging) setGuess(minutesAt(e)); })
        .on('pointerup pointercancel', () => { dragging = false; }));
      knob.on('keydown', e => {
        const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 }[e.key];
        if (step != null) setGuess(guess + step);
        else if (e.key === 'Home') setGuess(0);
        else if (e.key === 'End') setGuess(HOUR);
        else return;
        e.preventDefault(); zoom(true, 1400);
      });
      button.addEventListener('click', () => { zoom(true, 1400); revealed = !revealed; render(); if (!revealed) knob.node().focus(); });

      if (gFace) world.onFrame(flyFrame);
      drawDay(); render();
    },
    // Step 0 shows the whole day, like the clock in the hero. Step 1 zooms into that hour to guess.
    step(n) { zoom(n >= 1, 1600); },
    age() { guess = 30; revealed = false; drawDay(); render(); },
  });
})();
