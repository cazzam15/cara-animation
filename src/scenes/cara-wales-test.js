// cara-wales-test.js: "Cara in Wales", the 20-second test scene. See STORYBOARD.md for the shots and the reads.
//   A (0–7.6)    Cara walks into a Welsh valley, is delighted, then notices something up the hill.
//   B (7.6–13.6) The rock on the hillside wobbles, puffs smoke, and a little red dragon (Dewi) peeks out, pops up and waves.
//   C (13.6–20)  Two-shot: Cara is surprised, then delighted, and waves back. Dewi hops and puffs a pink heart. Iris out.
// It's one continuous set: every shot paints the same world, and one camera path (CAM_L / CAM_V) runs through all
// three, so the A→B and B→C seams are camera moves, not cuts.
(() => {
  // Voiceover slot: placeholder talking spans ("Wales!", "Helo!"). When the ElevenLabs audio exists, make a mouth track
  // with tools/mouth_track.mjs and replace LINES with its name, e.g. const LINES = 'cara-wales-test-cara';
  const LINES = [[5.2, 6.0], [16.4, 17.1]];

  const GROUND = 940, STOP = 720, U = 24;        // Cara's path, where she stops, her size
  const RX = 1380, RY = 600, DU = 16;            // the rock's centre, Dewi's size
  const PERCH = 500;                             // Dewi's feet when he stands on the rock

  // ---------- one camera path for the whole film: [t, cx, cy, zoom] ----------
  const CAM_L = [[0, 900, 540, 1], [4.4, 950, 540, 1], [6.8, 970, 545, 1.02], [8.6, 1385, 530, 2], [13.4, 1385, 525, 2.12], [14.9, 1070, 600, 1.12], [20, 1040, 615, 1.18]];
  const CAM_V = [[0, 700, 790, 1.35], [4.4, 720, 790, 1.35], [6.8, 760, 740, 1.36], [8.6, 1385, 520, 2], [13.4, 1385, 525, 2.1], [14.9, 1020, 770, 1.2], [20, 1020, 770, 1.26]];
  function camera(t) {
    const K = fmt(CAM_L, CAM_V), c = kf(t, K.map(([k, ...v]) => [k, v]));
    camBegin(c[0] + 6 * Math.sin(t * .5), c[1] + 3 * Math.sin(t * .37), c[2]);   // a gentle drift: the camera is never dead
  }

  // ---------- the set ----------
  const HILL = through([[560, 1010], [800, 830], [1050, 630], [1250, 490], [1500, 380], [1750, 335], [2100, 360], [2800, 430]]);
  function cloud(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * TAU, up = Math.sin(a) < 0, b = up ? 1 + .3 * Math.pow(Math.abs(Math.sin(a * 3)), .6) : 1;
      pts.push([cx + Math.cos(a) * r * 1.9 * (up ? b * .95 : 1), cy + Math.sin(a) * (up ? .9 : .45) * r * b]);
    }
    paint(pts, { wash: SOFT.cloud, ink: mixCol(SOFT.skyDeep, PAL.ink, .15), sw: .5, curv: .4 });
    paint(ellPts(cx + r * .2, cy + r * .25, r * 1.4, r * .16, 14), { wash: mixCol(SOFT.cloud, SOFT.skyDeep, .35), ink: null });
  }
  function sky(t) {
    boilSeed('sky');
    const warm = seg(t, 15.6, 19);   // the light warms a touch as the friendship lands
    paint(rectPts(-1400, -1400, 4800, 3900), { wash: mixCol(SOFT.sky, '#F7E6C6', .3 * warm), ink: null });
    paint(ellPts(1000, 860, 1900, 420, 30, 10), { wash: mixCol(SOFT.cloud, SOFT.sun, .25 + .35 * warm), washOp: 110, ink: null });   // haze by the horizon
    boilSeed('sun');
    paint(ellPts(1700, 110, 64, 64, 24, 1.2), { wash: mixCol(SOFT.sun, '#FFD27A', warm), ink: mixCol(SOFT.sun, PAL.ochre, .6), sw: .6 });
    for (let i = 0; i < 6; i++) {
      boilSeed('cloud' + i);
      const cx = -500 + hash(i + 1) * 2700 + t * (8 + 6 * hash(i + 9)), cy = -330 + hash(i + 4) * 520;
      cloud(cx, cy, 55 + 45 * hash(i + 2));
    }
  }
  function mountains() {
    boilSeed('mountains');
    paint(through([[-600, 760], [-100, 560], [180, 400], [360, 280], [460, 245], [560, 300], [760, 380], [1000, 520], [1300, 760]]).concat([[1300, 900], [-600, 900]]),
      { wash: SOFT.mountain, ink: mixCol(SOFT.mountain, PAL.ink, .35), sw: .5 });
    paint(ellPts(420, 420, 150, 110, 18, 4), { fill: mixCol(SOFT.mountain, SOFT.lilac, .6), fillOp: 90, bleed: .15, tex: .6, ink: null });
    paint(through([[800, 760], [1150, 480], [1420, 400], [1650, 440], [1900, 380], [2300, 520], [2800, 760]]).concat([[2800, 900], [800, 900]]),
      { wash: mixCol(SOFT.mountain, SOFT.sky, .45), ink: null });
    paint(ellPts(250, 850, 1000, 230, 34, 3), { wash: SOFT.hillFar, ink: mixCol(SOFT.hillFar, PAL.ink, .4), sw: .5 });
    paint(ellPts(-500, 860, 700, 260, 30, 3), { wash: mixCol(SOFT.hillFar, SOFT.hillMid, .5), ink: mixCol(SOFT.hillFar, PAL.ink, .4), sw: .5 });
  }
  // a white cottage with a slate roof and a curl of chimney smoke, on the far hill
  function cottage(x, y, s, t) {
    boilSeed('cottage');
    const P = pts => pts.map(([a, b]) => [x + a * s, y + b * s]);
    paint(P([[-1, 0], [1, 0], [1, -1.1], [-1, -1.1]]), { wash: SOFT.white, ink: PAL.ink, sw: .6 });
    paint(P([[-1.2, -1.05], [1.2, -1.05], [.8, -1.85], [-.8, -1.85]]), { wash: '#7D8AA6', ink: PAL.ink, sw: .6 });
    paint(P([[.45, -1.85], [.75, -1.85], [.75, -2.2], [.45, -2.2]]), { wash: SOFT.stone, ink: PAL.ink, sw: .5 });
    paint(P([[-.15, 0], [.15, 0], [.15, -.6], [-.15, -.6]]), { wash: '#6FA7A0', ink: PAL.ink, sw: .45 });
    for (const wx of [-.6, .6]) paint(P([[wx - .18, -.5], [wx + .18, -.5], [wx + .18, -.82], [wx - .18, -.82]]), { wash: '#A9D4E8', ink: PAL.ink, sw: .45 });
    for (let i = 0; i < 3; i++) { const k = frac(t * .18 + i / 3); boilSeed('chimney' + i); paint(ellPts(x + (.6 + k * .6) * s, y - (2.4 + k * 1.6) * s, (.12 + k * .2) * s, (.1 + k * .15) * s, 12), { wash: SOFT.cloud, washOp: 220 * (1 - k), ink: null }); }
  }
  // a sheep: a puffy cream body, a dark face, four little legs. graze 0..1 lowers the head.
  function sheep(x, y, s, t, id, o = {}) {
    boilSeed('sheep' + id);
    push(); translate(x, y); if (o.flip) scale(-1, 1);
    for (const lx of [-.55, -.25, .3, .6]) inkLine([[lx * s, -.2 * s], [lx * s, .35 * s]], clamp(s / 30, .5, 1.1), '#4E4450', 'ink', 0);
    const pts = []; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, b = 1 + .1 * Math.abs(Math.sin(a * 5)); pts.push([Math.cos(a) * s * b, -.3 * s + Math.sin(a) * .58 * s * b]); }
    paint(pts, { wash: SOFT.white, ink: PAL.ink, sw: clamp(s / 60, .35, .8), curv: .3 });
    const g = o.graze || 0, hx = .95 * s, hy = (-.55 + .5 * g) * s;
    paint(ellPts(hx, hy, .3 * s, .38 * s, 14, 0, .4 + .6 * g), { wash: '#4E4450', ink: null });
    paint(ellPts(hx - .25 * s, hy - .22 * s, .16 * s, .08 * s, 8, 0, -.4), { wash: '#4E4450', ink: null });
    if (s > 16) paint(ellPts(hx + .08 * s, hy - .08 * s, .06 * s, .06 * s, 6), { wash: PAL.cream, ink: null });
    pop();
  }
  // a dry-stone wall: a grey band with its stones drawn in as short curved strokes (many tiny painted polygons made
  // p5.brush lose its WebGL context on this machine, so the stones are ink, not paint)
  function wall(pts, h, id) {
    boilSeed('wall' + id);
    const C = through(pts, 4), top = C.map(([x, y]) => [x, y - h]);
    paint(top.concat(C.slice().reverse()), { wash: SOFT.stone, ink: null });
    const col = mixCol(SOFT.stoneDk, PAL.ink, .35);
    for (let r = 0; r < 2; r++) for (let i = r; i < C.length - 1; i += 2) {
      const [x, y] = C[i], [x2, y2] = C[i + 1], yy = -h * (.18 + .5 * r);
      inkLine([[x + 2, y + yy], [(x + x2) / 2, y + yy + h * .14], [x2 - 2, y2 + yy]], .45, col, 'inkfine', .6);
    }
    inkLine(top, .7, mixCol(SOFT.stoneDk, PAL.ink, .45), 'inkfine', .5);
  }
  function hillside() {
    boilSeed('hill');
    paint(HILL.concat([[2800, 2100], [560, 2100]]), { wash: SOFT.hillMid, ink: null });
    for (const [x, y, rx, ry] of [[1150, 700, 170, 60], [1700, 470, 220, 70], [1500, 820, 240, 60], [2100, 560, 200, 60]])   // soft patches of meadow
      paint(ellPts(x, y, rx, ry, 18, 6), { fill: SOFT.meadow, fillOp: 80, bleed: .2, tex: .6, ink: null });
    inkLine(HILL, .8, mixCol(SOFT.hillMid, PAL.ink, .45), 'ink', .5);
  }
  // the rock Dewi hides behind. wob = a small rock back and forth, around its base.
  function rock(t, wob = 0) {
    boilSeed('rock');
    push(); translate(RX, RY + 95); rotate(wob); translate(-RX, -(RY + 95));
    const pts = []; for (let i = 0; i < 30; i++) { const a = i / 30 * TAU, r = 1 + .07 * Math.sin(a * 3 + 1) + .04 * Math.sin(a * 7); pts.push([RX + Math.cos(a) * 170 * r, RY + Math.min(.88, Math.sin(a)) * 105 * r]); }
    paint(pts, { wash: SOFT.stone, ink: null, curv: .3 });
    paint(ellPts(RX + 30, RY + 50, 150, 45, 18), { fill: SOFT.stoneDk, fillOp: 110, bleed: .12, tex: .6, ink: null });
    paint(ellPts(RX - 60, RY - 55, 70, 26, 14, 0, -.2), { fill: SOFT.white, fillOp: 70, bleed: .15, ink: null });
    paint(ellPts(RX - 20, RY - 88, 90, 22, 16), { fill: SOFT.meadow, fillOp: 120, bleed: .15, tex: .5, ink: null });   // moss on top
    paint(pts, { ink: PAL.ink, sw: .9, curv: .3 });
    inkLine([[RX + 50, RY - 40], [RX + 70, RY], [RX + 58, RY + 30]], .6, SOFT.stoneDk, 'inkfine', .4);
    pop();
    boilSeed('rock tufts');
    for (let i = 0; i < 7; i++) { const x = RX - 180 + i * 60, y = RY + 92 + 6 * hash(i + 3), s = wob * 60; inkLine([[x, y], [x - 4 + s + wob * 30, y - 20 - 8 * hash(i)]], .6, SOFT.meadow, 'inkfine', .3); inkLine([[x + 8, y], [x + 12 + s, y - 16]], .6, SOFT.grass, 'inkfine', .3); }
  }
  // a daffodil (the Welsh national flower), swaying
  function daffodil(x, y, s, t, i) {
    boilSeed('daff' + i);
    const sway = Math.sin(t * 1.3 + i * 1.7) * .12, hx = x + Math.sin(sway) * s * 2.2, hy = y - s * 2.2;
    inkLine([[x, y], [x + (hx - x) * .5, (y + hy) / 2], [hx, hy]], clamp(s / 14, .4, 1), '#5E9E4E', 'ink', .5);
    inkLine([[x, y], [x - s * .5, y - s * 1.2]], clamp(s / 16, .35, .8), '#6FB25A', 'ink', .4);
    paint(starPts(hx, hy, s * .75, .55, 6, sway), { wash: SOFT.flowerY, ink: mixCol(PAL.ochre, PAL.ink, .3), sw: clamp(s / 30, .3, .6) });
    paint(ellPts(hx + s * .1, hy + s * .05, s * .28, s * .28, 10), { wash: '#F5A93C', ink: mixCol(PAL.ochre, PAL.ink, .4), sw: clamp(s / 36, .25, .5) });
  }
  const DAFF_BACK = [[-80, 895], [120, 890], [330, 900], [520, 905], [880, 915], [1060, 925]];
  const DAFF_FRONT = [[-60, 1030], [150, 1060], [380, 1020], [600, 1075], [900, 1040], [1150, 1070], [1400, 1030], [1650, 1060], [1900, 1045]];
  function foreground(t) {
    boilSeed('ground');
    paint(through([[-1400, 905], [0, 880], [600, 900], [1200, 925], [1800, 950], [3200, 975]]).concat([[3200, 2200], [-1400, 2200]]),
      { wash: SOFT.grass, ink: null });
    inkLine(through([[-1400, 905], [0, 880], [600, 900], [1200, 925], [1800, 950], [3200, 975]]), .7, mixCol(SOFT.grass, PAL.ink, .45), 'ink', .5);
    boilSeed('path');
    paint(ribbon([[-1400, 950], [-200, 948], [500, 944], [1000, 950], [1500, 985]], 70, 20), { wash: SOFT.path, ink: null });
    for (let i = 0; i < 8; i++) inkLine([[-300 + i * 190, 952 + 12 * (hash(i) - .5)], [-250 + i * 190, 950 + 12 * (hash(i + 4) - .5)]], .5, SOFT.earth, 'inkfine', 0);
    DAFF_BACK.forEach(([x, y], i) => daffodil(x, y, 11, t, i));
  }
  function frontFlowers(t) {
    DAFF_FRONT.forEach(([x, y], i) => daffodil(x, y, 22, t, 20 + i));
    boilSeed('tufts');
    for (let i = 0; i < 14; i++) { const x = -300 + i * 170 + 40 * hash(i), y = 1000 + 90 * hash(i + 5), sw = Math.sin(t * 1.1 + i) * 5; for (const k of [-1, 0, 1]) inkLine([[x + k * 8, y], [x + k * 12 + sw, y - 26 - 10 * hash(i + k)]], .8, mixCol(SOFT.meadow, PAL.ink, .15), 'inkfine', .4); }
  }

  // ---------- the cast, as functions of video time ----------
  // Dewi: hidden behind the rock → horns peek → eyes peek, blink, look at Cara → dip, hop onto the rock → wave →
  // watch → hop for joy → blow a heart. Returns null while hidden; onTop = draw him in front of the rock.
  function dewiAt(t) {
    if (t < 10.6) return null;
    const o = { turn: -.6, lookX: -1, lookY: .2, mouth: 'smile', wag: Math.sin(t * 2.6), flap: .25 + .1 * Math.sin(t * 2), boilKey: 'dewi' };
    let x = RX + 15, y, onTop = false;
    if (t < 11.6) {                                 // peeking
      y = kf(t, [[10.6, 700], [10.95, 600], [11.15, 600], [11.4, 578]]);
      o.lookX = t < 11.33 ? .2 : -1; o.turn = t < 11.33 ? 0 : -.6;
      if (t > 11.2 && t < 11.28) o.eyes = 'closed';
    } else if (t < 11.75) {                         // anticipation: a little duck down
      y = 578 + 12 * ease(seg(t, 11.6, 11.75)); o.sq = .2 * ease(seg(t, 11.6, 11.75));
    } else if (t < 12.15) {                         // the hop onto the rock
      const k = seg(t, 11.75, 12.15), p = arcPt([RX + 15, 590], [RX + 5, PERCH], 55, k);
      x = p[0]; y = p[1]; o.sq = -.14 * Math.sin(k * Math.PI); o.aL = o.aR = .7; o.eyes = 'happy'; o.mouth = 'open'; o.flap = .9;
      onTop = k > .45;
    } else {                                        // on the rock
      x = RX + 5; y = PERCH; onTop = true;
      const land = t - 12.15; o.sq = .2 * Math.exp(-land * 7) * Math.cos(land * 18);
      o.eyes = 'happy'; o.mouth = 'grin';
      const settle = ease(seg(t, 12.15, 12.4));    // arms and wings ease down from the hop instead of snapping
      o.aL = o.aR = lerp(.7, -.9, settle); o.flap = lerp(.9, o.flap, settle);
      if (t > 12.3 && t < 16.2) {                   // waving at Cara, wings fluttering
        const w = Math.sin((t - 12.3) * TAU * 1.5), k = ease(seg(t, 12.3, 12.55)) * (1 - ease(seg(t, 15.9, 16.2)));
        o.aL = lerp(o.aL, 1.25 + .45 * w, k); o.flap = lerp(o.flap, .35 + .45 * (.5 + .5 * w), k); o.rot = .03 * w * k;
      }
      if (t > 16.2) { o.eyes = t < 17.2 ? 'normal' : 'happy'; o.lookX = -.9; }
      const j = jump(t, 17.3, 17.75, 2.2);           // a hop for joy
      o.dy = j.dy; o.sq += j.sq; if (t > 17.15 && t < 17.9) { o.aL = o.aR = .8; o.flap = .9; }
      if (t > 17.95 && t < 18.25) { o.mouth = 'O'; o.eyes = 'closed'; }   // blowing the heart
    }
    return { x, y, o, onTop };
  }
  function drawDewi(t, d) { if (d) dragon(d.x, d.y, DU, d.o); }
  function smoke(t) {
    boilSeed('smoke');
    puff(RX + 40, RY - 70, 26, seg(t, 9.6, 11.0), { col: '#F4ECEE', rise: 170 });
    puff(RX + 10, RY - 80, 17, seg(t, 9.95, 11.2), { col: '#F4ECEE', rise: 150 });
  }
  function heart(t) {
    boilSeed('heart');
    puff(RX - 20, PERCH - 78, 30, seg(t, 18.0, 19.7), { heart: true, rise: 150 });
  }
  function rockWob(t) { const k = seg(t, 8.6, 9.6); return .045 * Math.sin(k * Math.PI) * Math.sin(k * TAU * 2); }

  // Cara, shot by shot. Her whole performance lives here so the shots below only stage it.
  function caraAt(t) {
    if (t < 7.6) {
      const w = caraWalk(t, 1.2, 4.4, -240, STOP, U), walking = t > 1.2 && t < 4.4;
      const mood = caraActs(t, [[0, 'happy'], [4.45, 'idle'], [4.95, 'happy'], [6.3, 'curious', { lookX: .8, lookY: -.8 }]]);
      if (walking) { mood.dy *= .2; delete mood.aL; delete mood.aR; delete mood.rot; }
      const turn = t > 4.4 && t < 4.65 ? caraTurn(t, 4.4, 4.65, .125, 0) : {};
      return { x: w.x, o: mixPose(mood, walking ? w : { walk: null }, turn, talk(t, LINES), { boilKey: 'cara' }) };
    }
    const mood = caraActs(t, [[13.6, 'idle', { lookX: .7, lookY: -.6 }], [14.8, 'surprised', { lookX: .7, lookY: -.6 }], [15.6, 'happy'],
                              [16.3, 'wave', { lookX: .6, lookY: -.5 }], [18.0, 'happy', { lookX: .5, lookY: -.7 }], [18.85, 'wave', { lookX: .3, lookY: -.2 }]]);
    return { x: STOP, o: mixPose(mood, talk(t, LINES), { boilKey: 'cara' }) };
  }

  // ---------- shots ----------
  // Every shot paints the whole world in the same order: sky, far land, hillside, walls, sheep, Dewi (behind the rock),
  // the rock, Dewi (on top of it), the foreground, Cara, and the flowers in front of her.
  function world(t, o = {}) {
    camera(t);
    sky(t); mountains(); cottage(260, 700, 34, t);
    wall([[-900, 790], [-300, 770], [300, 760], [700, 780]], 14, 1);
    hillside();
    wall([[760, 905], [1100, 825], [1500, 768], [1900, 730], [2600, 710]], 26, 2);
    const g = t > 8.8 && t < 10.6 ? 0 : .5 + .5 * Math.sin(t * 2.2);    // the sheep by the rock looks up when it wobbles
    sheep(1650, 690, 34, t, 1, { graze: g, flip: true });
    sheep(1080, 720, 26, t, 2, { graze: .5 + .5 * Math.sin(t * 1.7 + 2) });
    sheep(540, 770, 18, t, 3, { graze: .5 + .5 * Math.sin(t * 1.3 + 4) });
    sheep(1880, 560, 24, t, 4, { graze: .5 + .5 * Math.sin(t * 1.9 + 1), flip: true });
    const d = dewiAt(t);
    if (!(d && d.onTop)) drawDewi(t, d);
    smoke(t);
    rock(t, rockWob(t));
    if (d && d.onTop) drawDewi(t, d);
    heart(t);
    foreground(t);
    if (o.cara !== false) { const c = caraAt(t); cara(c.x, GROUND, U, c.o); }
    frontFlowers(t);
    const eye = toScreen(o.irisAt ? o.irisAt[0] : STOP, o.irisAt ? o.irisAt[1] : GROUND - 6 * U);
    camEnd();
    return eye;
  }

  function shotArrive(t, lt, dur) {
    world(t);
    boilSeed('transition');
    if (t < 1.2) { const [ex, ey] = toScreen(150, 900, { ...LAST_CAM }); iris(ex, ey, lerp(0, 2300, ease(t / 1.2)), PAL.paper); }
  }
  function shotReveal(t, lt, dur) {
    world(t, { cara: false });   // she's out of frame here; skip her
  }
  function shotWaveBack(t, lt, dur) {
    const eye = world(t);
    boilSeed('transition');
    if (t > 18.9) {   // iris in on Cara, hold, then shut to paper
      const r = t < 19.5 ? lerp(2300, 330, ease(seg(t, 18.9, 19.5))) : t < 19.7 ? lerp(330, 310, seg(t, 19.5, 19.7)) : lerp(310, 0, easeIn(seg(t, 19.7, 19.95)));
      iris(eye[0], eye[1], r * fmt(1, .9), PAL.paper);
    }
  }

  shots([[0, shotArrive], [7.6, shotReveal], [13.6, shotWaveBack]]);
})();
