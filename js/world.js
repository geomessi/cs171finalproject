/*
 * The world (NOVEL VIEW) · Owner: Georgia (Package 3). Only this package edits this file.
 *
 * A three.js scene that sits behind the whole story: a glowing grid floor running to a pearl
 * horizon, a giant clock floating above it, and tiny people walking past.
 *
 * What is data:
 * - The clock face is one average day for the reader's age group. Each wedge's angle is exact
 *   (minutes / 1,440 × 360°). Socializing is the only bright wedge, turned to the bottom.
 * - Drips and the pink pool grow with socializing minutes lost since 2003–04 (3-year smoothed).
 * - The walkers: the share of figures walking alone equals the share of waking time spent alone
 *   for the reader's age band (BLS "who with" data, from 2010; earlier years hold the 2010 value).
 * - The sky slides from dusk toward night as the year moves from 2003 to 2025 (mood, not data).
 *
 * Public API (window.world, null when WebGL is unavailable):
 *   world.init()          build the scene once story.data is loaded
 *   world.setYear(y)      move the clock, drips and walkers to year y (they glide there)
 *   world.setAge(code)    rebuild for an age group, e.g. '103'
 *   world.readout()       numbers for the chapter card: { year, soc, lost, aloneShare, aloneMin, aloneBand }
 */
(function () {
  const canvas = document.getElementById('world');
  const glOK = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  })();
  if (!canvas || !window.THREE || !glOK) { document.documentElement.classList.add('no-world'); window.world = null; return; }
  document.documentElement.classList.add('has-world');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SOCIAL = '600024';
  const CLOCK = new THREE.Vector3(0, 13, -34);
  const R = 9, R0 = 3.4;
  // "who with" data uses different age bands than the activity data
  const WHO_BAND = { '000': ['000', 'all ages'], '103': ['020', '20–24'], '031': ['031', '25–34'], '038': ['038', '35–44'], '042': ['042', '45–54'], '049': ['049', '55–64'], '065': ['113', '65–74'] };

  let ready = false, age = '103', year = 2003;
  let renderer, scene, camera, skyMat, floorMat, stars, wedges = [], socGlow, drips = [], pool, poolGlow, drops = [], bodies, heads;
  const target = { arcs: null, lost: 0, share: 0.3, night: 0 };
  const cur = { arcs: null, lost: 0, share: 0.3, night: 0 };
  const mouse = { x: 0, y: 0 };
  const camPos = new THREE.Vector3(5, 3.2, 10), camLook = new THREE.Vector3(-9, 9.5, -34);
  let veilNow = 0;

  const css = getComputedStyle(document.documentElement);
  const C = name => new THREE.Color(css.getPropertyValue(name).trim());

  // ---------- data ----------
  function arcsFor(a, y) {
    const i = story.data.years.indexOf(y);
    const mins = story.DAY_PARTS.map(code => story.series(a, code)?.[i]);
    if (mins.some(v => v == null)) return null;
    const total = d3.sum(mins);
    let acc = 0;
    const arcs = mins.map((m, k) => { const s = acc; acc += (m / total) * Math.PI * 2; return { code: story.DAY_PARTS[k], s, e: acc, min: m }; });
    const soc = arcs.find(d => d.code === SOCIAL);
    const turn = Math.PI - (soc.s + soc.e) / 2;   // socializing at the bottom, so it melts with gravity
    arcs.forEach(d => { d.s += turn; d.e += turn; });
    return arcs;
  }
  const valid = (a, y) => !!arcsFor(a, y);
  const baseline = a => story.avg(story.series(a, SOCIAL), [2003, 2004]);
  function lostBy(a, y) {
    const s = story.series(a, SOCIAL), ys = story.data.years;
    const near = [y - 1, y, y + 1].map(t => s[ys.indexOf(t)]).filter(v => v != null);
    return Math.max(0, baseline(a) - d3.mean(near));
  }
  function aloneFor(a, y) {
    const [band, label] = WHO_BAND[a] || WHO_BAND['000'];
    const ys = story.data.years, al = story.data.who[`01|${band}|00`], ot = story.data.who[`02|${band}|00`];
    if (!al || !ot) return null;
    let yy = Math.max(2010, y);
    while (yy > 2009 && (al[ys.indexOf(yy)] == null || ot[ys.indexOf(yy)] == null)) yy -= 1;
    const A = al[ys.indexOf(yy)], O = ot[ys.indexOf(yy)];
    return { share: A / (A + O), min: A, band: label, year: yy };
  }

  // ---------- helpers ----------
  function radialTexture(inner, outer = 'rgba(0,0,0,0)') {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, inner); grad.addColorStop(1, outer);
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  const lerpK = (dt, speed) => (reduceMotion ? 1 : 1 - Math.exp(-dt * speed));
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------- build ----------
  function build() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setClearColor(C('--bg'));
    scene = new THREE.Scene();
    const fogColor = C('--bg').lerp(C('--pearl-b'), 0.1);
    scene.fog = new THREE.Fog(fogColor, 30, 125);
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2400);

    // Sky: night above, an iridescent pearl band at the horizon
    skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uTop: { value: C('--bg') }, uHorizon: { value: fogColor.clone() }, uA: { value: C('--pearl-a') }, uB: { value: C('--pearl-b') }, uC: { value: C('--pearl-c') }, uNight: { value: 0 } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform vec3 uTop, uHorizon, uA, uB, uC; uniform float uNight; varying vec3 vDir;
        vec3 pearlAt(float ang){ vec3 p = mix(uA, uB, 0.5 + 0.5 * sin(ang * 2.0 + 0.6)); return mix(p, uC, 0.5 + 0.5 * sin(ang * 3.0 + 2.1)); }
        void main(){
          float h = vDir.y;
          float ang = atan(vDir.z, vDir.x);
          float glow = mix(0.62, 0.24, uNight);
          vec3 sky = mix(uHorizon, uTop, smoothstep(0.0, 0.55, h)) + pearlAt(ang) * exp(-max(h, 0.0) * 7.0) * glow;
          gl_FragColor = vec4(sky, 1.0);
        }`,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), skyMat));

    // Stars
    const sp = [];
    for (let i = 0; i < 700; i++) {
      const u = Math.random() * Math.PI * 2, v = 0.08 + Math.random() * 0.9;
      sp.push(Math.cos(u) * Math.sqrt(1 - v * v) * 480, v * 480, Math.sin(u) * Math.sqrt(1 - v * v) * 480);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: C('--ink'), size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.25, fog: false }));
    scene.add(stars);

    // Floor: a glowing grid that fades into the horizon
    floorMat = new THREE.ShaderMaterial({
      fog: false,
      uniforms: { uLine: { value: C('--pearl-a') }, uBase: { value: C('--bg') }, uFog: { value: fogColor.clone() }, uGlow: { value: 0.55 },
        uA: { value: C('--pearl-a') }, uB: { value: C('--pearl-b') }, uC: { value: C('--pearl-c') }, uNight: { value: 0 } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `
        uniform vec3 uLine, uBase, uFog, uA, uB, uC; uniform float uGlow, uNight; varying vec3 vW;
        vec3 pearlAt(float ang){ vec3 p = mix(uA, uB, 0.5 + 0.5 * sin(ang * 2.0 + 0.6)); return mix(p, uC, 0.5 + 0.5 * sin(ang * 3.0 + 2.1)); }
        void main(){
          vec2 p = vW.xz / 3.0;
          vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
          float line = 1.0 - min(min(g.x, g.y), 1.0);
          float near = exp(-distance(vW.xz, vec2(0.0, -34.0)) * 0.02);
          vec3 c = uBase + uLine * line * (0.12 + 0.88 * near) * uGlow;
          vec3 dir = vW - cameraPosition;
          vec3 haze = uFog + pearlAt(atan(dir.z, dir.x)) * mix(0.62, 0.24, uNight);
          float far = smoothstep(25.0, 260.0, length(dir.xz));
          c = mix(c, haze, pow(far, 1.6));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    floorMat.extensions = { derivatives: true };
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Soft shadow under the clock, so it floats rather than hangs
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(26, 9), new THREE.MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,0.75)'), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(CLOCK.x, 0.02, CLOCK.z);
    scene.add(shadow);

    // The clock: a thick disc, a dark face, exact wedges, a hairline rim and hour ticks
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.4, R + 0.4, 0.9, 128, 1), new THREE.MeshBasicMaterial({ color: C('--surface').lerp(C('--pearl-b'), 0.06) }));
    body.rotation.x = Math.PI / 2; body.position.copy(CLOCK).add(new THREE.Vector3(0, 0, -0.46));
    scene.add(body);
    const face = new THREE.Mesh(new THREE.CircleGeometry(R + 0.3, 128), new THREE.MeshBasicMaterial({ color: C('--bg') }));
    face.position.copy(CLOCK).add(new THREE.Vector3(0, 0, 0.005));
    scene.add(face);

    story.DAY_PARTS.forEach(code => {
      const color = code === SOCIAL ? C('--c-social') : C(story.ACTIVITIES[code].color).lerp(C('--bg'), 0.45);
      const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
      m.position.copy(CLOCK).add(new THREE.Vector3(0, 0, code === SOCIAL ? 0.03 : 0.02));
      m.userData = { code, s: null, e: null };
      wedges.push(m); scene.add(m);
    });

    const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.32, 0.06, 8, 160), new THREE.MeshBasicMaterial({ color: C('--muted') }));
    rim.position.copy(CLOCK).add(new THREE.Vector3(0, 0, 0.04));
    scene.add(rim);
    const tick = [];
    for (let h = 0; h < 24; h++) {
      const a = (h / 24) * Math.PI * 2, r1 = R + 0.55, r2 = R + (h % 6 ? 0.85 : 1.15);
      tick.push(Math.sin(a) * r1, Math.cos(a) * r1, 0, Math.sin(a) * r2, Math.cos(a) * r2, 0);
    }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tick, 3));
    const ticks = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: C('--muted'), transparent: true, opacity: 0.6 }));
    ticks.position.copy(CLOCK).add(new THREE.Vector3(0, 0, 0.04));
    scene.add(ticks);

    // Socializing glows
    socGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture('rgba(255,141,184,0.55)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    socGlow.position.copy(CLOCK).add(new THREE.Vector3(0, -(R0 + R) / 2, 0.4));
    scene.add(socGlow);

    // Drips hang from the bottom of the rim; a pool gathers on the floor
    const pink = new THREE.MeshBasicMaterial({ color: C('--c-social') });
    const anchorY = CLOCK.y - (R + 0.32);
    [{ dx: -1.5, w: 0.13, len: 0.42 }, { dx: -0.7, w: 0.19, len: 0.8 }, { dx: 0, w: 0.26, len: 1 }, { dx: 0.75, w: 0.17, len: 0.62 }, { dx: 1.45, w: 0.11, len: 0.33 }].forEach(d => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(d.w, d.w * 0.8, 1, 14).translate(0, -0.5, 0), pink);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(d.w * 1.45, 16, 12), pink);
      const y0 = anchorY + 0.05 + Math.abs(d.dx) * 0.12;
      stem.position.set(CLOCK.x + d.dx, y0, CLOCK.z + 0.1);
      bead.position.copy(stem.position);
      stem.scale.y = 0.001;
      stem.userData = { ...d, y0 }; bead.userData = stem.userData;
      drips.push({ stem, bead }); scene.add(stem, bead);
    });
    pool = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: C('--c-social'), transparent: true, opacity: 0.85 }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(CLOCK.x, 0.03, CLOCK.z + 0.6); pool.scale.setScalar(0.001);
    poolGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,141,184,0.5)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    poolGlow.rotation.x = -Math.PI / 2; poolGlow.position.set(CLOCK.x, 0.04, CLOCK.z + 0.6);
    scene.add(pool, poolGlow);
    for (let i = 0; i < 10; i++) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), pink);
      d.visible = false; d.userData = { v: 0 };
      drops.push(d); scene.add(d);
    }

    // Walkers: tiny luminous figures
    const N = 64;
    const figMat = new THREE.MeshBasicMaterial({ color: C('--ink').lerp(C('--pearl-a'), 0.2).lerp(C('--bg'), 0.2) });
    bodies = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.1, 0.46, 4, 8), figMat, N);
    heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 10, 8), figMat, N);
    bodies.userData.figs = d3.range(N).map(i => ({ i, rank: (i * 0.61803398875 + 0.137) % 1, x: (hash(i) - 0.5) * 50, z: -16 - hash(i + 9) * 15, phase: hash(i + 3) * 6.28 }));
    scene.add(bodies, heads);

    addEventListener('resize', resize);
    addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });
    resize();
  }

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  // ---------- per-frame updates ----------
  function updateWedges(k) {
    if (!target.arcs) return;
    if (!cur.arcs) cur.arcs = target.arcs.map(d => ({ ...d }));
    wedges.forEach((m, idx) => {
      const t = target.arcs[idx], c = cur.arcs[idx];
      c.s += (t.s - c.s) * k; c.e += (t.e - c.e) * k; c.min = t.min;
      const ud = m.userData;
      if (ud.s !== null && Math.abs(ud.s - c.s) < 1e-4 && Math.abs(ud.e - c.e) < 1e-4) return;
      ud.s = c.s; ud.e = c.e;
      const gap = 0.006, len = Math.max(0.0005, c.e - c.s - gap);
      m.geometry.dispose();
      m.geometry = new THREE.RingGeometry(R0, R, Math.max(3, Math.ceil((len / (Math.PI * 2)) * 160)), 1, Math.PI / 2 - c.e + gap / 2, len);
    });
    const soc = cur.arcs.find(d => d.code === SOCIAL);
    const scale = 2.8 + (soc.e - soc.s) * 22;
    socGlow.scale.set(scale, scale, 1);
  }

  let dropTimer = 0;
  function updateMelt(dt, k) {
    cur.lost += (target.lost - cur.lost) * k;
    const L = cur.lost;
    const maxLen = drips[0].stem.userData.y0 - 0.5;
    const sag = Math.min(1, L / 24) * maxLen * 0.85;
    drips.forEach(({ stem, bead }) => {
      const len = Math.max(0.001, sag * stem.userData.len);
      stem.scale.y = len;
      bead.position.y = stem.userData.y0 - len;
      bead.visible = len > 0.05;
    });
    const r = L > 0.5 ? 0.4 + L * 0.085 : 0.001;
    pool.scale.setScalar(r);
    poolGlow.scale.set(r * 4.5, r * 4.5, 1);
    // falling drops, faster when more has been lost
    if (!reduceMotion && L > 1) {
      dropTimer -= dt;
      if (dropTimer <= 0) {
        dropTimer = Math.max(0.35, 2.2 - L * 0.07);
        const free = drops.find(d => !d.visible);
        const longest = drips[2];
        if (free) { free.visible = true; free.position.set(CLOCK.x, longest.bead.position.y - 0.2, CLOCK.z + 0.1); free.userData.v = 0; }
      }
    }
    drops.forEach(d => {
      if (!d.visible) return;
      d.userData.v += 14 * dt; d.position.y -= d.userData.v * dt;
      if (d.position.y <= 0.08) { d.visible = false; pool.scale.multiplyScalar(1.04); }
    });
  }

  const dummy = new THREE.Object3D();
  const SIZES = [2, 3, 2, 2, 4, 2, 3];
  function updateWalkers(t, dt, k) {
    cur.share += (target.share - cur.share) * k;
    const figs = bodies.userData.figs;
    // who walks alone this year: the lowest-ranked share of figures
    const solo = new Set(figs.filter(f => f.rank < cur.share).map(f => f.i));
    const rest = figs.filter(f => !solo.has(f.i));
    const units = [...solo].map(i => [i]);
    for (let p = 0, g = 0; p < rest.length; g++) { const n = SIZES[g % SIZES.length]; units.push(rest.slice(p, p + n).map(f => f.i)); p += n; }
    units.forEach(members => {
      const lead = members[0];
      const speed = (0.45 + hash(lead + 21) * 0.55) * (hash(lead + 5) > 0.5 ? 1 : -1);
      const laneZ = -16 - hash(lead + 9) * 15;
      const span = 64;
      const x0 = ((((hash(lead) - 0.5) * span + (reduceMotion ? 0 : t * speed)) % span) + span * 1.5) % span - span / 2;
      members.forEach((i, m) => {
        const f = figs[i];
        const tx = x0 + (m % 2 ? 0.15 : -0.15) * Math.min(m, 1);
        const tz = laneZ + (m - (members.length - 1) / 2) * 0.38;
        const jump = Math.abs(tx - f.x) > span / 2;   // wrapped around: snap instead of gliding across
        f.x = jump ? tx : f.x + (tx - f.x) * lerpK(dt, 2.2);
        f.z += (tz - f.z) * lerpK(dt, 2.2);
        const bob = reduceMotion ? 0 : Math.abs(Math.sin(t * 5 * Math.abs(speed) + f.phase)) * 0.035;
        dummy.position.set(f.x, 0.34 + bob, f.z); dummy.updateMatrix(); bodies.setMatrixAt(i, dummy.matrix);
        dummy.position.set(f.x, 0.8 + bob, f.z); dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix);
      });
    });
    bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
  }

  function sceneFor() {
    // which part of the story is in the middle of the screen
    const mid = innerHeight / 2;
    const hero = document.getElementById('hero').getBoundingClientRect();
    const clock = document.getElementById('clock').getBoundingClientRect();
    if (hero.bottom > mid * 0.9) return 'hero';
    if (clock.top < mid) return 'verdict';
    return 'evidence';
  }
  const narrow = () => innerWidth < 820;
  const SHOTS = {
    hero: { pos: [5, 3.2, 10], look: [-9, 9.5, -34], veil: 0 },
    evidence: { pos: [0, 15, 38], look: [0, 5, -60], veil: 0.72 },
    verdict: { pos: [2, 9, 14], look: [-3.2, 8, -34], veil: 0.08 },
  };
  // Phones: clock above the hero text; in the verdict, clock below the stats card
  const SHOTS_NARROW = {
    hero: { pos: [0, 3, 24], look: [0, 4, -34], veil: 0 },
    evidence: SHOTS.evidence,
    verdict: { pos: [0, 6, 28], look: [0, 15.5, -34], veil: 0.05 },
  };

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    const k = lerpK(dt, 2.4);
    const shot = (narrow() ? SHOTS_NARROW : SHOTS)[sceneFor()];
    const look = new THREE.Vector3(...shot.look);
    const pos = new THREE.Vector3(...shot.pos).add(new THREE.Vector3(mouse.x * 1.2, -mouse.y * 0.6, 0));
    camPos.lerp(pos, lerpK(dt, 1.3)); camLook.lerp(look, lerpK(dt, 1.3));
    camera.position.copy(camPos); camera.lookAt(camLook);

    veilNow += (shot.veil - veilNow) * lerpK(dt, 2);
    document.getElementById('veil').style.opacity = veilNow.toFixed(3);

    cur.night += (target.night - cur.night) * k;
    skyMat.uniforms.uNight.value = cur.night;
    floorMat.uniforms.uNight.value = cur.night;
    stars.material.opacity = 0.18 + cur.night * 0.35;

    updateWedges(k);
    updateMelt(dt, k);
    updateWalkers(t, dt, k);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function retarget() {
    if (!ready) return;
    let y = year;
    if (!valid(age, y)) { const ys = story.data.years.filter(v => valid(age, v)); y = ys.reduce((a, b) => (Math.abs(b - year) < Math.abs(a - year) ? b : a)); }
    target.arcs = arcsFor(age, y);
    target.lost = lostBy(age, y);
    const al = aloneFor(age, y);
    target.share = al ? al.share : 0.3;
    target.night = (y - 2003) / 22;
  }

  window.world = {
    init() {
      if (ready) return;
      build(); ready = true; retarget();
      cur.lost = target.lost; cur.share = target.share; cur.night = target.night;
      requestAnimationFrame(frame);
    },
    setYear(y) { year = y; retarget(); },
    setAge(a) { age = a; retarget(); },
    readout() {
      if (!ready) return null;
      const i = story.data.years.indexOf(year);
      const soc = story.series(age, SOCIAL)[i];
      const lost = year <= 2004 ? 0 : baseline(age) - story.avg(story.series(age, SOCIAL), [year - 1, year].filter(v => v !== 2020));
      const al = aloneFor(age, year);
      return { year, soc, lost, aloneShare: al?.share, aloneMin: al?.min, aloneBand: al?.band, aloneYear: al?.year };
    },
    get year() { return year; },
  };
})();
