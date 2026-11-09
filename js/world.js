/*
 * The world (NOVEL VIEW) · Owner: Georgia (Package 3). Only this package edits this file.
 *
 * A sunlit, painterly three.js scene behind the whole story. The sky and dunes are a painted backdrop
 * (assets/desert.jpg, set on the canvas in base.css); the 3D ground is invisible and only catches shadows.
 * Originally: an ultramarine sky with a warm
 * horizon, an empty ochre plain under low raking light, a mirror-still lake, and a giant clock on a stone plinth
 * at the water's edge, with tiny figures walking across its face.
 *
 * What is data:
 * - The face is one average day for the reader's age group. Each painted region's angle is exact
 *   (minutes / 1,440 × 360°), drawn on the face. The outer numerals count hours of the day
 *   (3h, 6h…), so the dial reads as "how many hours", not "what time".
 * - Socializing is the pink region at the front, nearest the water. The two hands bracket it,
 *   so they close in as it shrinks.
 * - The front of the clock slumps over the water in proportion to socializing minutes lost
 *   since 2003–04 (3-year smoothed). Pink drips fall into the lake and ripple out.
 * - Walkers: the share of figures walking alone equals the share of waking time spent alone for
 *   the reader's age band (BLS "who with" data, from 2010; earlier years hold the 2010 value).
 * - Distant clocks: the smaller clocks floating over the far dunes are the other age groups'
 *   days for the same year, each tagged with its socializing minutes.
 * - Mood only: the sky deepens from golden hour toward dusk as the years run.
 *
 * Public API (window.world, null when WebGL is unavailable):
 *   world.init(), world.setYear(y), world.setAge(code), world.readout(), world.year
 *   For the guess chapter, where the whole clock flies off its plinth into the guess card:
 *   world.palette, world.flyClock(f, target), world.holdHero(on), world.onFrame(fn)
 */
(function () {
  const canvas = document.getElementById('world');
  const glOK = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  })();
  if (!canvas || !window.THREE || !glOK) { document.documentElement.classList.add('no-world'); window.world = null; return; }
  document.documentElement.classList.add('has-world');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The world renders behind the whole page the entire time you scroll, so it has to be cheap on a
  // weak laptop or a phone. Pick a quality tier up front, then step down if frames come in slowly.
  const TIER = (() => {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;          // GiB, Chrome only; assume a middling machine
    const small = Math.min(screen.width, screen.height) < 820 || innerWidth < 760;
    if (small || cores <= 4 || mem <= 4) return 'low';
    if (cores >= 8 && innerWidth >= 1200 && mem >= 8) return 'high';
    return 'mid';
  })();
  const QUALITY = {
    low:  { aa: false, dpr: 1,    shadow: 1024, walkers: 14 },
    mid:  { aa: true,  dpr: 1.3,  shadow: 2048, walkers: 24 },
    high: { aa: true,  dpr: 1.75, shadow: 4096, walkers: 30 },
  }[TIER];

  const SOCIAL = '600024';
  const WATER = 0.25;
  const R = 10;
  const CLOCK_XZ = [0, -24];
  
  const TILT = 0.12;   // the clock tips its face slightly toward the viewer
  const HERO_TILT = 0.45;   // in the hero and the verdict it tips further, so an eye-level camera still sees the face
  const FAR_BASE = -6;      // the distant plinths reach down to here, so they stand in the painted dunes instead of floating
  const WHO_BAND = { '000': ['000', 'all ages'], '103': ['020', '20–24'], '031': ['031', '25–34'], '038': ['038', '35–44'], '042': ['042', '45–54'], '049': ['049', '55–64'], '065': ['113', '65–74'] };

  // The world's own painterly palette (STYLEGUIDE.md, "The world"). Socializing keeps the site pink.
  const PAL = {
    zenith: '#16246E', sky: '#2C46A8', horizon: '#F7EAC0', horizonDusk: '#F2B98A', zenithDusk: '#0E1550',
    sand: '#C99E68', sandShade: '#8E6A45', stone: '#CDB89A', water: '#5A5E9E', cloud: '#F4A9C8',
    backdropHaze: '#E7B48E', shadow: '#2A1E3A',   // matched to the painted backdrop's horizon and shade
    face: '#EFE6D5', ink: '#2A2320', bezel: '#D4BE9C', body: '#E6DCCF',
    social: '#FF8DB8',
    // Socializing is the only luminous color; everything else stays at dusk. These match the
    // --c-* tokens in css/base.css, so the 3D face and the 2D charts name a day the same way.
    act: {
      '600001': '#34466A', '600013': '#7C6B45', '600016': '#66603F', '600003': '#594F47', '600007': '#4F463F',
      '600010': '#4F463F', '600018': '#4A453F', '600022': '#40604A', '600025': '#4F4588', 'leis': '#6F63B8',
      '600030': '#343741', '600033': '#343741', '600034': '#343741',
    },
  };
  const SHORT = {
    '600001': 'Sleep & care', '600013': 'Work', '600016': 'School', '600003': 'Chores', '600007': 'Family care',
    '600010': 'Caring', '600018': 'Shopping', '600022': 'Eating', '600024': 'Socializing', '600025': 'TV',
    'leis': 'Other leisure', '600030': 'Civic', '600033': 'Calls', '600034': 'Other',
  };

  // Surfaces (look only): a gold rim and a pearly body that reflect the painted sky, on a concrete plinth.
  // Shared by the main clock, its lake reflection and the distant clocks. Metal stays off until the
  // sky reflection has loaded, since metal with nothing to reflect renders black.
  const MAT = {
    bezel: new THREE.MeshStandardMaterial({ color: PAL.bezel, metalness: 0, roughness: 0.34 }),
    body: TIER === 'low'
      ? new THREE.MeshStandardMaterial({ color: PAL.body, metalness: 0, roughness: 0.2, side: THREE.DoubleSide })
      : new THREE.MeshPhysicalMaterial({ color: PAL.body, metalness: 0, roughness: 0.2, side: THREE.DoubleSide,
        iridescence: 0.9, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 520], clearcoat: 0.6 }),
    stone: new THREE.MeshStandardMaterial({ color: '#E9D3B2', roughness: 1 }),
  };
  function loadSurfaces() {
    const loader = new THREE.TextureLoader();
    loader.load('assets/desert.jpg', t => {
      t.mapping = THREE.EquirectangularReflectionMapping;
      const pm = new THREE.PMREMGenerator(renderer);
      const env = pm.fromEquirectangular(t).texture;
      pm.dispose(); t.dispose();
      Object.assign(MAT.bezel, { envMap: env, metalness: 1, envMapIntensity: 1.05 });
      Object.assign(MAT.body, { envMap: env, metalness: 0.35, envMapIntensity: 1.1 });
      MAT.stone.envMap = env; MAT.stone.envMapIntensity = 0.35;
      Object.values(MAT).forEach(m => { m.needsUpdate = true; });
    });
    const tile = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1.3); t.anisotropy = 4; return t; };
    MAT.stone.map = tile(loader.load('assets/textures/concrete_diff.jpg'));
    MAT.stone.normalMap = tile(loader.load('assets/textures/concrete_normal.jpg'));
    MAT.stone.roughnessMap = tile(loader.load('assets/textures/concrete_rough.jpg'));
    MAT.stone.needsUpdate = true;
  }

  let ready = false, starting = null, age = '103', year = 2003;
  let renderer, scene, camera, sun, hemi, skyMat, clockGroup, mirrorClock, faceTex, faceCtx, grooves;
  let distant = [];
  let clockY = 4, deformables = [], walkers, walkerShadows, drips = [], ripples = [], pinkPool, clouds = [];
  const target = { arcs: null, lost: 0, share: 0.3, dusk: 0 };
  const cur = { arcs: null, lost: 0, share: 0.3, dusk: 0, melt: -1 };
  const mouse = { x: 0, y: 0 };
  const camPos = new THREE.Vector3(0, 3.5, 24), camLook = new THREE.Vector3(-9, 7, -40);
  let veilNow = 0, faceDirty = true, displayFont = 'Georgia, serif';
  let hold = false, tiltNow = HERO_TILT;   // the guess chapter wants the hero shot kept while the clock flies
  const flight = { f: 0, to: null, hidden: false, home: null };   // f: 0 = on the plinth, 1 = landed in the card
  const frameHooks = [];

  // ---------- data ----------
  function arcsFor(a, y) {
    const i = story.data.years.indexOf(y);
    // BLS suppresses tiny categories for some groups (e.g. education for 65+): count those as 0,
    // but the year is only usable when sleep and socializing were published.
    const raw = story.DAY_PARTS.map(code => story.series(a, code)?.[i]);
    if (raw[story.DAY_PARTS.indexOf('600001')] == null || raw[story.DAY_PARTS.indexOf(SOCIAL)] == null) return null;
    const mins = raw.map(v => v ?? 0);
    const total = d3.sum(mins);
    let acc = 0;
    const arcs = mins.map((m, k) => { const s = acc; acc += (m / total) * Math.PI * 2; return { code: story.DAY_PARTS[k], s, e: acc, min: m }; });
    const soc = arcs.find(d => d.code === SOCIAL);
    const turn = Math.PI - (soc.s + soc.e) / 2;   // socializing at the front, over the water
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
  const lerpK = (dt, speed) => (reduceMotion ? 1 : 1 - Math.exp(-dt * speed));
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function puffTexture(color) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, color); grad.addColorStop(0.55, color + 'aa'); grad.addColorStop(1, color + '00');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  // Ground: soft dunes, a mound for the clock, a lake in front
  function groundH(x, z) {
    const dc = Math.hypot(x - CLOCK_XZ[0], z - CLOCK_XZ[1]);
    const dunes = (1.6 * Math.sin(x * 0.045 + 0.7) * Math.sin(z * 0.035 + 0.3) + 1.0 * Math.sin((x + z) * 0.06)
      + 3.0 * smooth(-60, -160, z) * (0.5 + 0.5 * Math.sin(x * 0.028 + 1.1))) * 0.55 * smooth(14, 40, dc)
      ;
    const mound = 2.0 * Math.exp(-((x * x) / (2 * 14 * 14) + ((z + 26) ** 2) / (2 * 14 * 14)));
    const lake = -9 * Math.exp(-((x * x) / (2 * 40 * 40) + ((z + 2) ** 2) / (2 * 12 * 12)));
    return 1.2 + dunes + mound + lake;
  }

  // ---------- the clock face, painted on a canvas ----------
  const TEX = 1536, C0 = TEX / 2, RPX = TEX / 2 - 4;
  function drawGrooves() {
    grooves = document.createElement('canvas'); grooves.width = grooves.height = TEX;
    const g = grooves.getContext('2d');
    for (let r = RPX * 0.18; r < RPX * 0.86; r += 5) {
      g.strokeStyle = `rgba(40,30,25,${0.035 + hash(r) * 0.035})`; g.lineWidth = 1.2;
      g.beginPath(); g.arc(C0, C0, r, 0, Math.PI * 2); g.stroke();
    }
    const shade = g.createRadialGradient(C0 - RPX * 0.25, C0 - RPX * 0.3, RPX * 0.1, C0, C0, RPX);
    shade.addColorStop(0, 'rgba(255,250,240,0.16)'); shade.addColorStop(1, 'rgba(60,40,30,0.16)');
    g.fillStyle = shade; g.beginPath(); g.arc(C0, C0, RPX, 0, Math.PI * 2); g.fill();
  }
  function drawFace() { paintFace(faceCtx, cur.arcs, 1); faceTex.needsUpdate = true; }
  function paintFace(g, arcs, k) {   // k scales the TEX-sized drawing onto a smaller canvas
    g.setTransform(k, 0, 0, k, 0, 0);
    g.clearRect(0, 0, TEX, TEX);
    g.fillStyle = PAL.face; g.beginPath(); g.arc(C0, C0, RPX, 0, Math.PI * 2); g.fill();
    const r0 = RPX * 0.2, r1 = RPX * 0.84;
    // canvas angle: 0 = top, clockwise (matches the 2D clock); ctx.arc uses 0 = right, so subtract 90°
    arcs.forEach(d => {
      g.fillStyle = d.code === SOCIAL ? PAL.social : PAL.act[d.code];
      g.beginPath(); g.arc(C0, C0, r1, d.s - Math.PI / 2, d.e - Math.PI / 2); g.arc(C0, C0, r0, d.e - Math.PI / 2, d.s - Math.PI / 2, true); g.closePath(); g.fill();
      g.strokeStyle = PAL.face; g.lineWidth = 3; g.stroke();
    });
    g.drawImage(grooves, 0, 0);
    // hour marks: one per hour, numerals every 3 hours (hours of the day, not clock times)
    g.fillStyle = PAL.ink; g.strokeStyle = PAL.ink;
    for (let h = 0; h < 24; h++) {
      const a = (h / 24) * Math.PI * 2, s = Math.sin(a), c = -Math.cos(a);
      g.lineWidth = h % 3 ? 2 : 5;
      const ra = RPX * (h % 3 ? 0.875 : 0.865), rb = RPX * 0.9;
      g.beginPath(); g.moveTo(C0 + s * ra, C0 + c * ra); g.lineTo(C0 + s * rb, C0 + c * rb); g.stroke();
      if (h % 3 === 0) {
        g.font = `600 ${TEX * 0.036}px ${displayFont}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        const rn = RPX * 0.948;
        g.fillText(h === 0 ? '24h' : `${h}h`, C0 + s * rn, C0 + c * rn);
      }
    }
    // labels on the bigger regions
    g.textAlign = 'center'; g.textBaseline = 'middle';
    arcs.forEach(d => {
      if (d.e - d.s < 0.36 || d.code === SOCIAL) return;
      const m = (d.s + d.e) / 2, rm = (r0 + r1) / 2, x = C0 + Math.sin(m) * rm, y = C0 - Math.cos(m) * rm;
      g.fillStyle = 'rgba(255,250,240,0.92)';
      g.font = `500 ${TEX * 0.024}px "IBM Plex Sans", system-ui, sans-serif`; g.fillText(SHORT[d.code], x, y - TEX * 0.013);
      g.font = `400 ${TEX * 0.02}px "IBM Plex Mono", ui-monospace, monospace`;
      const mm = d.min; g.fillText(mm >= 60 ? `${Math.floor(mm / 60)}h ${String(Math.round(mm % 60)).padStart(2, '0')}m` : `${Math.round(mm)}m`, x, y + TEX * 0.016);
    });
    // socializing label sits just inside the hub side of its region
    const soc = arcs.find(d => d.code === SOCIAL);
    g.fillStyle = PAL.ink; g.font = `600 ${TEX * 0.026}px "IBM Plex Mono", ui-monospace, monospace`;
    g.fillText(`${Math.round(soc.min)} min`, C0, C0 + RPX * 0.13);
    // hub
    g.fillStyle = PAL.face; g.beginPath(); g.arc(C0, C0, r0 - 6, 0, Math.PI * 2); g.fill();
  }

  // ---------- distant clocks: every other age group's day, floating over the far dunes ----------
  const ALL_AGES = ['000', '103', '031', '038', '042', '049', '065'];
  const FAR_SPOTS = [[22, -112, 0.5], [64, -92, 0.46], [104, -124, 0.42], [-4, -158, 0.42], [50, -170, 0.4], [140, -100, 0.38]];
  function buildDistantClocks() {
    const SMALL = 512, k = SMALL / TEX;
    FAR_SPOTS.forEach(([x, z, sc]) => {
      const c = document.createElement('canvas'); c.width = c.height = SMALL;
      const tex = new THREE.CanvasTexture(c);
      const geos = [];
      const own = geo => { geo.userData.orig = Float32Array.from(geo.attributes.position.array); geos.push(geo); return geo; };
      const grp = new THREE.Group();
      const face = new THREE.Mesh(own(new THREE.RingGeometry(0.001, R, 96, 24).rotateX(-Math.PI / 2).translate(0, 0.42, 0)),
        new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.42 }));
      const body = new THREE.Mesh(own(new THREE.CylinderGeometry(R + 0.15, R + 0.05, 0.8, 96, 3)), MAT.body);
      const bezel = new THREE.Mesh(own(new THREE.TorusGeometry(R + 0.2, 0.55, 12, 120).rotateX(Math.PI / 2).translate(0, 0.46, 0)), MAT.bezel);
      grp.add(face, body, bezel);
      const gy = groundH(x, z), ph = 6.2 * sc;
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(RS * 0.9 * sc, RS * 1.1 * sc, gy + ph - FAR_BASE, 24), MAT.stone);
      plinth.position.set(x, (gy + ph + FAR_BASE) / 2, z);
      grp.scale.setScalar(sc);
      grp.position.set(x, gy + ph + 0.45 * sc, z);
      grp.rotation.set(TILT, Math.atan2(-x, 30 - z) * 0.5, 0, 'YXZ');
      const tag = labelSprite(); tag.position.set(x, gy + ph + 5.5, z); tag.scale.set(10, 5, 1);
      scene.add(grp, plinth, tag);
      distant.push({ ctx: c.getContext('2d'), tex, k, tag, geos, melt: -1, age: null });
    });
  }
  function paintDistant() {
    const others = ALL_AGES.filter(a => a !== age);
    distant.forEach((d, i) => {
      const a = others[i];
      let y = year;
      if (!valid(a, y)) { const ys = story.data.years.filter(v => valid(a, v)); y = ys.reduce((p, q) => (Math.abs(q - year) < Math.abs(p - year) ? q : p)); }
      const arcs = arcsFor(a, y);
      paintFace(d.ctx, arcs, d.k); d.tex.needsUpdate = true;
      d.age = a;
      // each distant clock goes soft by its own age group's loss
      const m = Math.min(1, lostBy(a, y) / 24);
      if (Math.abs(m - d.melt) > 0.01) {
        d.melt = m;
        d.geos.forEach(geo => {
          const p = geo.attributes.position, o = geo.userData.orig;
          for (let i = 0; i < o.length; i += 3) { const v = deformPoint(o[i], o[i + 1], o[i + 2], m); p.array[i] = v[0]; p.array[i + 1] = v[1]; p.array[i + 2] = v[2]; }
          p.needsUpdate = true; geo.computeVertexNormals();
        });
      }
      paintLabel(d.tag, a === '000' ? 'ALL AGES' : `AGES ${story.ageName(a)}`, `${Math.round(arcs.find(v => v.code === SOCIAL).min)} min`);
    });
  }

  // ---------- melt: the clock goes soft and folds over the front of its plinth ----------
  // m = 0 is a rigid, perfect clock resting on its plinth. As socializing minutes are lost, the
  // part beyond the plinth's front edge (the socializing side, toward the water) bends over like
  // warm wax and hangs down. The fold angle is the data: m × ~100°. Corners fold a little less,
  // and the far side softens slightly, so it reads as limp rather than hinged.
  const RS = 2.3;            // plinth radius
  const BEND = 2.1;          // radius of the soft fold
  const FOLD_MAX = 1.75;     // radians at full melt (just past vertical, like a drip)
  function deformPoint(x, y, z, m) {
    if (m <= 0) return [x, y, z];
    const hinge = RS + 0.06 * x * x;                       // a curved fold line, not a straight hinge
    const phi = m * FOLD_MAX * (1 - 0.28 * (x / R) ** 2);   // corners fold less
    // the far side relaxes a little too, like a soft object settling
    const settle = z < -RS ? 0.35 * m * smooth(RS, R, -z) ** 2 : 0;
    if (z <= hinge) return [x, y - settle, z];
    const L = z - hinge, Lb = BEND * phi;
    let pz, py, a;
    if (L <= Lb) { a = L / BEND; pz = hinge + BEND * Math.sin(a); py = -BEND * (1 - Math.cos(a)); }
    else { a = phi; pz = hinge + BEND * Math.sin(phi) + (L - Lb) * Math.cos(phi); py = -BEND * (1 - Math.cos(phi)) - (L - Lb) * Math.sin(phi); }
    // keep the slab's thickness: offset along the bent surface's normal
    const wobble = 0.12 * m * Math.sin(x * 0.9 + L * 0.6);
    return [x * (1 + 0.03 * m * L / R), py + y * Math.cos(a) + wobble, pz + y * Math.sin(a)];
  }
  function applyMelt(m) {
    deformables.forEach(geo => {
      const p = geo.attributes.position, o = geo.userData.orig, a = p.array;
      for (let i = 0; i < o.length; i += 3) { const v = deformPoint(o[i], o[i + 1], o[i + 2], m); a[i] = v[0]; a[i + 1] = v[1]; a[i + 2] = v[2]; }
      p.needsUpdate = true; geo.computeVertexNormals();
    });
  }
  const _v = new THREE.Vector3();
  function frontEdge(m, x) {   // world position of the front rim at offset x
    const z = Math.sqrt(Math.max(0, (R + 0.2) ** 2 - x * x));
    const v = deformPoint(x, -0.4, z, m);
    clockGroup.updateMatrixWorld();
    return clockGroup.localToWorld(_v.set(v[0], v[1], v[2])).clone();
  }

  // ---------- build ----------
  function build() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: QUALITY.aa, alpha: true });   // see-through, so the painted backdrop shows
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITY.dpr));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;   // crisp, painted-looking shadows
    loadSurfaces();
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(new THREE.Color(PAL.backdropHaze), 140, 560);   // Dalí's air is clear
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 3000);

    // Sky: deep ultramarine above, a warm band at the horizon, mirrored below so the lake reflects it
    skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uZen: { value: new THREE.Color(PAL.zenith) }, uSky: { value: new THREE.Color(PAL.sky) }, uHor: { value: new THREE.Color(PAL.horizon) },
        uZenD: { value: new THREE.Color(PAL.zenithDusk) }, uHorD: { value: new THREE.Color(PAL.horizonDusk) }, uDusk: { value: 0 },
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform vec3 uZen, uSky, uHor, uZenD, uHorD; uniform float uDusk; varying vec3 vDir;
        void main(){
          float h = abs(vDir.y);
          vec3 zen = mix(uZen, uZenD, uDusk), hor = mix(uHor, uHorD, uDusk);
          vec3 c = mix(uSky, zen, smoothstep(0.1, 0.65, h));
          c = mix(hor, c, smoothstep(0.0, 0.2, h));
          c += hor * 0.18 * exp(-h * 40.0);   // a luminous line right at the horizon
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    // The painted backdrop is the sky now; the shader sky stays built but out of the scene.
    new THREE.Mesh(new THREE.SphereGeometry(1400, 48, 24), skyMat);

    // Light: low warm sun from behind-left, so shadows fall toward the viewer
    hemi = new THREE.HemisphereLight(0x8da2e8, 0xa07850, 0.42);   // low fill, so shadows stay deep
    scene.add(hemi);
    sun = new THREE.DirectionalLight(0xffe6bf, 1.4);
    sun.position.set(-126, 30, -13);   // low, from the left: long shadows across the plain
    sun.target.position.set(0, 2, -24);
    sun.castShadow = true;
    sun.shadow.mapSize.set(QUALITY.shadow, QUALITY.shadow);
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 320 });
    sun.shadow.bias = -0.0008;
    scene.add(sun, sun.target);

    // Ground (the parts under the lake are cut away so the water shows the mirrored sky)
    const gg = new THREE.PlaneGeometry(900, 900, 240, 240);
    gg.rotateX(-Math.PI / 2);
    const gp = gg.attributes.position;
    for (let i = 0; i < gp.count; i++) gp.setY(i, groundH(gp.getX(i), gp.getZ(i)));
    gg.computeVertexNormals();
    const groundMat = new THREE.ShadowMaterial({ color: PAL.shadow, opacity: 0.45 });   // invisible: only shadows land on the backdrop
    groundMat.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vWY;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWY = (modelMatrix * vec4(position, 1.0)).y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vWY;')
        .replace('void main() {', `void main() {\n if (vWY < ${(WATER - 0.02).toFixed(2)}) discard;`);
    };
    const ground = new THREE.Mesh(gg, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // Water: a thin tinted sheet; what you see through it is the mirrored world
    const water = new THREE.Mesh(new THREE.PlaneGeometry(240, 100), new THREE.MeshBasicMaterial({ color: PAL.water, transparent: true, opacity: 0.5, depthWrite: false }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, WATER, -2);
    water.renderOrder = 2;
    water.visible = false;   // the painted backdrop has no lake
    scene.add(water);

    // The clock: built lying flat in its own frame, front (+z) toward the water
    const baseY = groundH(...CLOCK_XZ), PLINTH = 7.6;
    clockY = baseY + PLINTH + 0.45;
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(RS * 0.9, RS * 1.1, PLINTH + 1, 40), MAT.stone);
    plinth.position.set(CLOCK_XZ[0], baseY + (PLINTH - 1) / 2, CLOCK_XZ[1]);
    plinth.castShadow = true; plinth.receiveShadow = true;
    scene.add(plinth);
    clockGroup = new THREE.Group();
    clockGroup.position.set(CLOCK_XZ[0], clockY, CLOCK_XZ[1]);
    clockGroup.rotation.x = tiltNow;
    scene.add(clockGroup);

    faceCtx = (() => { const c = document.createElement('canvas'); c.width = c.height = TEX; return c.getContext('2d'); })();
    faceTex = new THREE.CanvasTexture(faceCtx.canvas);
    faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    drawGrooves();

    const keep = geo => { geo.userData.orig = Float32Array.from(geo.attributes.position.array); deformables.push(geo); return geo; };
    const faceGeo = keep(new THREE.RingGeometry(0.001, R, 160, 60).rotateX(-Math.PI / 2).translate(0, 0.42, 0));
    const face = new THREE.Mesh(faceGeo, new THREE.MeshLambertMaterial({ map: faceTex, emissive: 0xffffff, emissiveMap: faceTex, emissiveIntensity: 0.42 }));
    face.receiveShadow = true;
    const bodyGeo = keep(new THREE.CylinderGeometry(R + 0.15, R + 0.05, 0.8, 160, 6, false));
    // the body needs interior vertices to bend, so give its caps rings too
    const capGeo = keep(new THREE.RingGeometry(0.001, R + 0.05, 160, 40).rotateX(Math.PI / 2).translate(0, -0.4, 0));
    const body = new THREE.Mesh(bodyGeo, MAT.body);
    body.castShadow = true; body.receiveShadow = true;
    const bezelGeo = keep(new THREE.TorusGeometry(R + 0.2, 0.55, 24, 200).rotateX(Math.PI / 2).translate(0, 0.46, 0));
    const bezel = new THREE.Mesh(bezelGeo, MAT.bezel);
    bezel.castShadow = true;
    const under = new THREE.Mesh(capGeo, MAT.body);
    under.castShadow = true;
    clockGroup.add(face, body, bezel, under);

    // Hands: they bracket socializing (rigid, short enough to stay clear of the melt)
    const handMat = new THREE.MeshLambertMaterial({ color: PAL.ink });
    const handGeo = new THREE.BoxGeometry(0.16, 0.08, R * 0.2).translate(0, 0, R * 0.1);
    const tipGeo = new THREE.ConeGeometry(0.2, 0.6, 4).rotateX(Math.PI / 2).translate(0, 0, R * 0.2 + 0.25);
    ['handA', 'handB'].forEach(name => {
      const h = new THREE.Group(); h.name = name;
      const m1 = new THREE.Mesh(handGeo, handMat), m2 = new THREE.Mesh(tipGeo, handMat);
      m1.castShadow = m2.castShadow = true;
      h.add(m1, m2); h.position.y = 0.55;
      clockGroup.add(h);
    });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 24), MAT.bezel);
    cap.position.y = 0.62; cap.castShadow = true; clockGroup.add(cap);

    // The clock's reflection in the lake (shares geometry, so the melt reflects too)
    mirrorClock = clockGroup.clone(true);
    mirrorClock.traverse(o => { o.castShadow = false; o.receiveShadow = false; });
    const mirrorRoot = new THREE.Group();          // reflect across the water plane: y -> 2·WATER − y
    mirrorRoot.position.y = 2 * WATER; mirrorRoot.scale.y = -1;
    mirrorRoot.add(mirrorClock); scene.add(mirrorRoot); mirrorClock.userData.root = mirrorRoot; mirrorRoot.visible = false;

    // Drips from the front edge, and ripples on the water
    const pinkMat = new THREE.MeshLambertMaterial({ color: PAL.social, emissive: PAL.social, emissiveIntensity: 0.25 });
    [{ dx: -1.7, w: 0.14, len: 0.5 }, { dx: -0.8, w: 0.2, len: 0.85 }, { dx: 0, w: 0.27, len: 1 }, { dx: 0.85, w: 0.18, len: 0.7 }, { dx: 1.6, w: 0.12, len: 0.4 }].forEach(d => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(d.w, d.w * 0.75, 1, 14).translate(0, -0.5, 0), pinkMat);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(d.w * 1.5, 16, 12), pinkMat);
      stem.userData = d; stem.visible = bead.visible = false;
      drips.push({ stem, bead }); scene.add(stem, bead);
    });
    pinkPool = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ map: puffTexture('#FF8DB8'), transparent: true, depthWrite: false, opacity: 0.7 }));
    pinkPool.rotation.x = -Math.PI / 2; pinkPool.renderOrder = 3; scene.add(pinkPool);
    for (let i = 0; i < 6; i++) {
      const rg = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: PAL.social, transparent: true, opacity: 0, depthWrite: false }));
      rg.rotation.x = -Math.PI / 2; rg.renderOrder = 4; rg.userData.t = 99;
      ripples.push(rg); scene.add(rg);
    }

    // Walkers: tiny dark figures on the face, with long shadows. The count is a quality setting,
    // not data: the share of them walking alone is what carries the number.
    const N = QUALITY.walkers;
    const figMat = new THREE.MeshLambertMaterial({ color: PAL.ink });
    const figGeo = new THREE.CapsuleGeometry(0.085, 0.34, 4, 8).translate(0, 0.26, 0);
    const headGeo = new THREE.SphereGeometry(0.085, 10, 8).translate(0, 0.58, 0);
    const merged = mergeGeos([figGeo, headGeo]);
    walkers = new THREE.InstancedMesh(merged, figMat, N);
    walkers.castShadow = true;
    walkers.userData.figs = d3.range(N).map(i => ({ i, rank: (i * 0.61803398875 + 0.137) % 1, r: 0, th: 0, phase: hash(i + 3) * 6.28 }));
    clockGroup.add(walkers);

    buildDistantClocks();

    addEventListener('resize', resize);
    addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });
    resize();
  }

  function mergeGeos(list) {
    const pos = [], nor = [], idx = [];
    let off = 0;
    list.forEach(g => {
      const gi = g.index ? g : g.toNonIndexed();
      pos.push(...gi.attributes.position.array); nor.push(...gi.attributes.normal.array);
      if (gi.index) idx.push(...Array.from(gi.index.array, v => v + off));
      off += gi.attributes.position.count;
    });
    const m = new THREE.BufferGeometry();
    m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    if (idx.length) m.setIndex(idx);
    return m;
  }

  // ---------- small floating tags (age labels on the distant clocks) ----------
  function labelSprite() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false }));
    sp.userData.ctx = c.getContext('2d'); sp.scale.set(6, 3, 1);
    return sp;
  }
  function paintLabel(sp, title, value) {
    const g = sp.userData.ctx;
    g.clearRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(21,22,31,0.72)';
    g.beginPath(); if (g.roundRect) g.roundRect(96, 70, 320, 130, 24); else g.rect(96, 70, 320, 130); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#A19DB0'; g.font = '500 28px "IBM Plex Mono", ui-monospace, monospace'; g.fillText(title, 256, 108);
    g.fillStyle = '#FF8DB8'; g.font = `600 52px ${displayFont}`; g.fillText(value, 256, 160);
    sp.material.map.needsUpdate = true;
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }

  // ---------- per-frame updates ----------
  function updateFace(k) {
    if (!target.arcs) return;
    if (!cur.arcs) { cur.arcs = target.arcs.map(d => ({ ...d })); faceDirty = true; }
    let moving = false;
    cur.arcs.forEach((c, i) => {
      const t = target.arcs[i];
      if (Math.abs(t.s - c.s) > 1e-4 || Math.abs(t.e - c.e) > 1e-4) moving = true;
      c.s += (t.s - c.s) * k; c.e += (t.e - c.e) * k; c.min += (t.min - c.min) * k;
    });
    if (moving || faceDirty) { drawFace(); faceDirty = false; }
    const soc = cur.arcs.find(d => d.code === SOCIAL);
    // hands: canvas angle a (0 = far side, clockwise from above) -> rotation about y
    [['handA', soc.s], ['handB', soc.e]].forEach(([name, a]) => {
      const rot = Math.PI - a;
      clockGroup.getObjectByName(name).rotation.y = rot;
      mirrorClock.getObjectByName(name).rotation.y = rot;
    });
  }

  let dropTimer = 0;
  function updateMelt(dt, k) {
    cur.lost += (target.lost - cur.lost) * k;
    const melt = Math.min(1, cur.lost / 24);
    if (Math.abs(melt - cur.melt) > 0.002) { applyMelt(melt); cur.melt = melt; }
    const mid = frontEdge(melt, 0), edgeZ = mid.z;
    drips.forEach(({ stem, bead }) => {
      const d = stem.userData, e = frontEdge(melt, d.dx);
      const room = Math.max(0, e.y - WATER);
      const len = melt > 0.04 ? room * (0.3 + 0.6 * d.len) * Math.min(1, melt * 1.6) : 0;
      stem.visible = bead.visible = len > 0.05;
      stem.position.copy(e);
      stem.scale.y = Math.max(0.001, len);
      bead.position.set(e.x, e.y - len, e.z);
    });
    const pr = cur.lost > 0.5 ? 0.6 + cur.lost * 0.16 : 0.001;
    pinkPool.scale.setScalar(pr);
    pinkPool.position.set(mid.x, WATER + 0.01, edgeZ + 0.3);
    if (!reduceMotion && cur.lost > 1) {
      dropTimer -= dt;
      if (dropTimer <= 0) {
        dropTimer = Math.max(0.5, 2.6 - cur.lost * 0.08);
        const rg = ripples.find(r => r.userData.t > 2.4);
        if (rg) { rg.userData.t = 0; rg.position.set(mid.x + (hash(performance.now()) - 0.5) * 2.4, WATER + 0.02, edgeZ + 0.2); }
      }
    }
    ripples.forEach(rg => {
      rg.userData.t += dt;
      const t = rg.userData.t;
      rg.material.opacity = t < 2.4 ? 0.7 * (1 - t / 2.4) : 0;
      const s = 0.3 + t * 1.6; rg.scale.set(s, s, 1);
    });
  }

  const dummy = new THREE.Object3D();
  const SIZES = [2, 3, 2, 2, 4, 2, 3];
  const FRONT_GAP = 1.15;   // walkers stay off the melting front (radians either side of front)
  function updateWalkers(t, dt, k) {
    cur.share += (target.share - cur.share) * k;
    const figs = walkers.userData.figs;
    const solo = new Set(figs.filter(f => f.rank < cur.share).map(f => f.i));
    const rest = figs.filter(f => !solo.has(f.i));
    const units = [...solo].map(i => [i]);
    for (let p = 0, g = 0; p < rest.length; g++) { const n = SIZES[g % SIZES.length]; units.push(rest.slice(p, p + n).map(f => f.i)); p += n; }
    units.forEach(members => {
      const lead = members[0];
      const ring = R * (0.26 + hash(lead + 9) * 0.46);
      const span = Math.PI * 2 - FRONT_GAP * 2;     // allowed arc, measured from just past the front gap
      const w = (0.05 + hash(lead + 21) * 0.06) * (hash(lead + 5) > 0.5 ? 1 : -1);
      const u = ((hash(lead) * span + (reduceMotion ? 0 : t * w * 2)) % (2 * span) + 2 * span) % (2 * span);
      const along = u < span ? u : 2 * span - u;   // walk to the end of the arc, then turn back
      const th = Math.PI + FRONT_GAP + along;       // angle measured like the canvas: π = front
      members.forEach((i, m) => {
        const f = figs[i];
        const tr = ring + (m - (members.length - 1) / 2) * 0.36;
        const tth = th + (m % 2 ? 0.012 : -0.012);
        f.r += (tr - f.r) * lerpK(dt, 2); f.th += (tth - f.th) * lerpK(dt, 2);
        if (Math.abs(tth - f.th) > 1) f.th = tth;
        const bob = reduceMotion ? 0 : Math.abs(Math.sin(t * 6 + f.phase)) * 0.03;
        const px = Math.sin(f.th) * f.r, pz = -Math.cos(f.th) * f.r, pv = deformPoint(px, 0.45, pz, Math.max(0, cur.melt));
        dummy.position.set(pv[0], pv[1] + bob, pv[2]);
        dummy.rotation.y = -f.th; dummy.updateMatrix();
        walkers.setMatrixAt(i, dummy.matrix);
      });
    });
    walkers.instanceMatrix.needsUpdate = true;
  }

  function sceneFor() {
    const mid = innerHeight / 2;
    const hero = document.getElementById('hero').getBoundingClientRect();
    const clock = document.getElementById('clock').getBoundingClientRect();
    if (hold || hero.bottom > mid * 0.9) return 'hero';
    if (clock.top < mid) return 'verdict';
    return 'evidence';
  }
  const narrow = () => innerWidth < 820;
  const SHOTS = {
    hero: { pos: [0, 5.2, 10], look: [-8.8, 6.5, -22.8], veil: 0 },   // eye level, so the 3D horizon meets the painted one; the clock fills the right
    evidence: { pos: [-20, 5.2, 24], look: [2, 7, -26], veil: 0.72 },
    verdict: { pos: [0, 5.5, 16], look: [-1, 6.9, -24], veil: 0.04 },   // eye level too, so nothing floats above the painted horizon
  };
  const SHOTS_NARROW = {
    hero: { pos: [0, 15, 46], look: [0, 1.5, -32], veil: 0 },
    evidence: SHOTS.evidence,
    verdict: { pos: [0, 37, 28], look: [0, 0, -22], veil: 0.04 },
  };

  // ---------- the guess chapter's flight ----------
  // Lands the clock face-on to the camera and upright (24h at the top), its face exactly covering flight.to
  // (a screen circle in CSS px), where the chart takes over. A full-size clock that small
  // would sit far out under the ground, so it lands close to the camera and scaled down instead.
  function placeClock() {
    if (!flight.home) flight.home = { pos: clockGroup.position.clone(), quat: new THREE.Quaternion() };
    const { home, f, to } = flight;
    home.quat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), tiltNow);
    clockGroup.visible = !flight.hidden;
    if (f <= 0 || !to) {
      clockGroup.position.copy(home.pos); clockGroup.quaternion.copy(home.quat); clockGroup.scale.setScalar(1);
      return;
    }
    camera.updateMatrixWorld();
    const fit = R * innerHeight / (2 * to.r * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const depth = Math.min(fit, 14), sc = depth / fit;
    const dir = new THREE.Vector3(to.x / innerWidth * 2 - 1, 1 - to.y / innerHeight * 2, 0.5).unproject(camera).sub(camera.position).normalize();
    const fwd = camera.getWorldDirection(new THREE.Vector3());
    const landPos = camera.position.clone().addScaledVector(dir, depth / dir.dot(fwd));
    const camX = new THREE.Vector3(), camY = new THREE.Vector3(), camZ = new THREE.Vector3();
    camera.matrixWorld.extractBasis(camX, camY, camZ);
    const landQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(camX, camZ, camY.negate()));
    landPos.addScaledVector(camZ, -0.42 * sc);   // the face sits 0.42 above the clock's center
    clockGroup.position.lerpVectors(home.pos, landPos, f);
    clockGroup.position.y += Math.sin(f * Math.PI) * 5;   // an arc up off the plinth
    clockGroup.quaternion.slerpQuaternions(home.quat, landQuat, f);
    clockGroup.scale.setScalar(1 + (sc - 1) * f);
  }

  let last = performance.now(), duskShown = -1;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (document.hidden) { requestAnimationFrame(frame); return; }   // nothing to draw in a background tab
    const t = now / 1000, k = lerpK(dt, 2.4);
    const where = sceneFor();
    const shot = (narrow() ? SHOTS_NARROW : SHOTS)[where];
    const pos = new THREE.Vector3(...shot.pos).add(new THREE.Vector3(mouse.x * 1.4, -mouse.y * 0.7, 0));
    camPos.lerp(pos, lerpK(dt, 1.2)); camLook.lerp(new THREE.Vector3(...shot.look), lerpK(dt, 1.2));
    camera.position.copy(camPos); camera.lookAt(camLook);
    veilNow += (shot.veil - veilNow) * lerpK(dt, 2);
    tiltNow += ((where !== 'evidence' && !narrow() ? HERO_TILT : TILT) - tiltNow) * lerpK(dt, 1.2);
    document.getElementById('veil').style.opacity = veilNow.toFixed(3);

    cur.dusk += (target.dusk - cur.dusk) * k;
    skyMat.uniforms.uDusk.value = cur.dusk;
    sun.intensity = 1.4 - cur.dusk * 0.35;
    sun.color.setHSL(0.09 - cur.dusk * 0.03, 1, 0.87 - cur.dusk * 0.1);
    scene.fog.color.set(PAL.backdropHaze).lerp(new THREE.Color(PAL.horizonDusk), cur.dusk);
    if (Math.abs(cur.dusk - duskShown) > 0.003) { duskShown = cur.dusk; canvas.style.setProperty('--dusk', cur.dusk.toFixed(3)); }   // dims the backdrop

    updateFace(k);
    updateMelt(dt, k);
    updateWalkers(t, dt, k);
    placeClock();
    watchdog(dt);
    renderer.render(scene, camera);
    frameHooks.forEach(f => f());
    requestAnimationFrame(frame);
  }

  // Frame watchdog. If frames are coming in slowly, give up quality rather than let the whole page
  // stutter: first the pixel ratio and the shadow map, then shadows altogether. Never steps back up.
  let fpsFrames = 0, fpsTime = 0, downgrades = 0;
  function watchdog(dt) {
    fpsFrames += 1; fpsTime += dt;
    if (fpsFrames < 90) return;
    const fps = fpsFrames / fpsTime;
    fpsFrames = 0; fpsTime = 0;
    if (fps > 38 || downgrades >= 2) return;
    downgrades += 1;
    if (downgrades === 1) {
      renderer.setPixelRatio(1);
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
      sun.shadow.mapSize.set(1024, 1024);
    } else {
      renderer.shadowMap.enabled = false;
      sun.castShadow = false;
      scene.traverse(o => {
        if (!o.material) return;
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.needsUpdate = true; });
      });
    }
    console.info(`world: ${fps.toFixed(0)} fps, stepping quality down (${downgrades}/2)`);
  }

  function retarget() {
    if (!ready) return;
    let y = year;
    if (!valid(age, y)) { const ys = story.data.years.filter(v => valid(age, v)); y = ys.reduce((a, b) => (Math.abs(b - year) < Math.abs(a - year) ? b : a)); }
    target.arcs = arcsFor(age, y);
    target.lost = lostBy(age, y);
    const al = aloneFor(age, y);
    target.share = al ? al.share : 0.3;
    target.dusk = (y - 2003) / 22;
    paintDistant();
  }

  window.world = {
    init() {   // safe to call more than once: the hero and the verdict both start the world
      if (!starting) starting = (async () => {
        try { await document.fonts.load('600 40px Fraunces'); if (document.fonts.check('600 40px Fraunces')) displayFont = '"Fraunces", Georgia, serif'; } catch (e) { /* keep Georgia */ }
        build(); ready = true; retarget();
        cur.lost = target.lost; cur.share = target.share; cur.dusk = target.dusk;
        requestAnimationFrame(frame);
      })();
      return starting;
    },
    setYear(y) { year = y; retarget(); },
    setAge(a) { age = a; retarget(); },
    readout() {
      if (!story.data) return null;
      const i = story.data.years.indexOf(year);
      const soc = story.series(age, SOCIAL)[i];
      const lost = year <= 2004 ? 0 : baseline(age) - story.avg(story.series(age, SOCIAL), [year - 1, year].filter(v => v !== 2020));
      const al = aloneFor(age, year);
      return { year, soc, lost, aloneShare: al?.share, aloneMin: al?.min, aloneBand: al?.band, aloneYear: al?.year };
    },
    get year() { return year; },
    palette: PAL,
    // f: 0 = on the plinth, 1 = landed on `target` ({x, y, r}: the face's screen circle, CSS px). hidden: once the chart has taken over.
    flyClock(f, target, hidden = false) { flight.f = f; flight.to = target; flight.hidden = hidden; },
    holdHero(on) { hold = on; },
    onFrame(fn) { frameHooks.push(fn); },   // runs right after each render, so overlays line up with the frame
  };
})();
