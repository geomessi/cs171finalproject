/* Package 1 · Guess, then reveal. Values come from the shared ATUS data. */
(function () {
  let root, svg, range, output, button, feedback, question;
  let guess = 60, revealed = false;
  const format = v => d3.format('.1f')(v).replace(/\.0$/, '');
  function render() {
    if (!root) return;
    const age = story.ageName(story.you);
    const actual = story.avg(story.series(story.you, '600024'), [2024, 2025]);
    question.textContent = `Your guess for ages ${age}`;
    output.value = `${guess} min/day`;
    range.value = guess;
    range.setAttribute('aria-valuetext', `${guess} minutes per day`);
    button.textContent = revealed ? 'Try again' : 'Reveal the average';
    button.disabled = actual == null;
    if (actual == null) feedback.textContent = 'No estimate is available for this age group.';
    else if (!revealed) feedback.textContent = 'Make your guess, then see how it compares.';
    else {
      const diff = actual - guess;
      feedback.textContent = diff === 0 ? `Exactly right: ${format(actual)} min/day in 2024–25.`
        : `The average is ${format(actual)} min/day — ${format(Math.abs(diff))} min ${diff > 0 ? 'higher' : 'lower'} than your guess.`;
    }
    const width = Math.max(240, root.clientWidth);
    const x = d3.scaleLinear().domain([0, 120]).range([22, width - 24]);
    svg.attr('viewBox', `0 0 ${width} 142`).attr('aria-label', revealed && actual != null
      ? `Your guess: ${guess} minutes per day. Survey average for ages ${age}: ${format(actual)} minutes per day in 2024–25.`
      : `Your guess: ${guess} minutes per day. Reveal the survey average to compare.`);
    svg.selectAll('.guess-axis').data([null]).join('g').attr('class', 'axis guess-axis')
      .attr('transform', 'translate(0,118)').call(d3.axisBottom(x).tickValues([0,30,60,90,120]).tickSizeOuter(0));
    const rows = [{ id: 'guess', label: 'Your guess', value: guess, y: 32 }];
    if (revealed && actual != null) rows.push({ id: 'actual', label: 'Survey average', value: actual, y: 85 });
    const marks = svg.selectAll('.guess-mark').data(rows, d => d.id).join(enter => {
      const g = enter.append('g').attr('class', 'guess-mark');
      g.append('line'); g.append('circle').attr('r', 5); g.append('text'); return g;
    }).attr('data-kind', d => d.id);
    marks.select('line').attr('x1', x(0)).attr('x2', d => x(d.value)).attr('y1', d => d.y).attr('y2', d => d.y);
    marks.select('circle').attr('cx', d => x(d.value)).attr('cy', d => d.y);
    marks.select('text').attr('x', d => x(d.value)).attr('y', d => d.y - 12)
      .attr('text-anchor', d => d.value < 24 ? 'start' : d.value > 100 ? 'end' : 'middle')
      .text(d => `${d.label}: ${format(d.value)} min`);
    root.dataset.revealed = String(revealed);
  }
  story.chapter('guess', {
    init(el) {
      root = document.createElement('div'); root.className = 'opening-panel opening-guess';
      root.innerHTML = `<p class="opening-heading" id="guess-question"></p>
        <div class="guess-controls"><label for="social-guess">Your guess <output id="guess-output" for="social-guess"></output></label>
        <input id="social-guess" type="range" min="0" max="120" step="1" value="60" aria-describedby="guess-question">
        <div class="guess-range-labels" aria-hidden="true"><span>0 min</span><span>120 min</span></div></div>
        <button class="opening-button" type="button" aria-controls="guess-feedback">Reveal the average</button>
        <p class="guess-feedback" id="guess-feedback" role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="guess-comparison"></div>
        <p class="opening-caption">American Time Use Survey, BLS. Average of 2024 and 2025, across all days.</p>`;
      el.append(root);
      question = root.querySelector('#guess-question'); range = root.querySelector('input');
      output = root.querySelector('output'); button = root.querySelector('button'); feedback = root.querySelector('#guess-feedback');
      svg = d3.select(root.querySelector('.guess-comparison')).append('svg').attr('role', 'img');
      range.addEventListener('input', () => { guess = +range.value; revealed = false; render(); });
      button.addEventListener('click', () => { revealed = !revealed; render(); if (!revealed) range.focus(); });
      new ResizeObserver(render).observe(el); render();
    },
    age() { guess = 60; revealed = false; render(); },
  });
})();

