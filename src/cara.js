// cara.js: Cara the Capybara, painted in wash and ink, drawn to match her turnaround sheet: a friendly, upright capybara
// with a big round head, two white buck teeth, large pink glasses, a straw boater with a pink band, a red-and-green
// tartan scarf, a sleeveless pink dress with a gathered skirt, dark-brown paws and big dark-brown feet.
// `u` is her size unit: she is about 6.5u wide and 12.3u tall with her hat (she's modelled 15 units tall and drawn at
// 0.82 scale, so scenes keep the same sizes as before). (x, y) is the point on the ground between her feet.
//
// Body-local coordinates in the front view (model units, before the 0.82 scale; y up is negative):
//   feet y 0; skirt hem y -1.8, waist -4.6; scarf -7.1; head -13.3..-7.3; eyes (±1.35, -10.9); nose (0, -9.9);
//   mouth (0, -8.55); hat brim y -13. Arms hang from shoulders at (±2.55, -6.5) and are 3u long. o.armL / o.armR are
//   called at the paw in arm space (+x runs outward along the arm), so a held prop draws around (0, 0).
//
// Everything here draws one frame; motion comes from what you pass in. The poses are:
//   idle, happy, curious, surprised, excited, wave, talk   → caraPose(name, t) or acted changes with caraActs(t, keys)
//   walk                                                   → caraWalk(t, t0, t1, x0, x1, u)
//   happy jump                                             → caraHop(t, t0, t1, h)
//   talking (mouth open/closed for lip-sync)               → talk(t, lines) or talk(t, 'trackName')
// Combine them with mixPose(...), which adds up the fields that stack (dx, dy, sq, rot) instead of overwriting them.

const CARA = {
  fur: '#B7804F', furDk: '#8E5E38', furLt: '#D9A878', muzzle: '#D8AE80', nose: '#5E4036', paw: '#5B3F36', ink: '#3A2E3A',
  dress: '#EC4F9A', dressDk: '#C73C80', dressLt: '#F47DB5',
  frame: '#EC4F9A', lens: '#EDE6F2', straw: '#D9B178', strawDk: '#A88452', band: '#E64592',
  scarfR: '#C63A3F', scarfG: '#2F7B4A', scarfW: '#F3E9DC',
  iris: '#6E4128', teeth: '#FFFBF2', cheek: '#F2A0A8', mouth: '#5A2A33', tongue: '#F28CA0',
};
const CARA_SCALE = .82;

// ---------- views ----------
// Drawn key views, never a 3D rotation. q and side face screen-right; flip: true mirrors them to face left.
//   head: outline points.  body: [cx, rx].  dress: [x offset, width scale].  eyes: [x, y, scale] screen-left → right.
//   muzzle / nose: [x, y, rx, ry].  mouth: [x, y].  cheeks / ears: [[x, y], ...].  hat: [x offset, width scale].
//   arms: [shoulder x, dir (-1 left, 1 right, 0 forward), 'L' | 'R', layer (0 behind the body, 1 in front)].
//   legs: [x, x].  lensX: how wide the lenses look (1 = facing us).  scarf: x of the hanging end.
const CARA_VIEWS = {
  front: {
    head: [[-2.6, -12.9], [0, -13.3], [2.6, -12.9], [3.1, -11.6], [3.15, -9.9], [2.8, -8.4], [1.9, -7.55], [0, -7.3], [-1.9, -7.55], [-2.8, -8.4], [-3.15, -9.9], [-3.1, -11.6]],
    body: [0, 2.95], dress: [0, 1], eyes: [[-1.4, -11.1, 1], [1.4, -11.1, 1]], muzzle: [0, -8.85, 1.95, 1.35], nose: [0, -9.6, 1.08, .6],
    mouth: [0, -8.55], cheeks: [[-2.2, -9.2], [2.2, -9.2]], ears: [], hat: [.2, 1], scarf: .7,
    arms: [[-2.55, -1, 'L', 1], [2.55, 1, 'R', 1]], legs: [-1.05, 1.05], lensX: 1,
  },
  q: {
    head: [[-2.5, -12.8], [.3, -13.3], [2.6, -12.9], [3.4, -11.9], [3.9, -10.6], [4.15, -9.5], [3.85, -8.4], [2.8, -7.7], [1.0, -7.4], [-1.2, -7.5], [-2.6, -8.4], [-3.0, -10.0], [-2.95, -11.6]],
    body: [.1, 2.8], dress: [.15, .95], eyes: [[.1, -11.1, .82], [2.05, -11.15, 1]], muzzle: [2.35, -8.9, 1.8, 1.3], nose: [3.15, -9.65, .95, .58],
    mouth: [2.5, -8.55], cheeks: [[.7, -9.25]], ears: [[-2.85, -11.8]], hat: [.1, 1], scarf: 1.3,
    arms: [[2.45, 1, 'R', 0], [-2.35, -1, 'L', 1]], legs: [-.9, 1.2], lensX: .85,
  },
  side: {
    head: [[-2.4, -12.6], [.6, -13.2], [2.4, -12.8], [3.6, -11.7], [4.4, -10.6], [4.75, -9.6], [4.55, -8.7], [3.6, -8.0], [1.4, -7.6], [-1.0, -7.7], [-2.5, -8.6], [-2.9, -10.2], [-2.9, -11.6]],
    body: [.2, 2.5], dress: [.25, .85], eyes: [[1.2, -11.15, 1]], muzzle: [3.35, -9.0, 1.45, 1.25], nose: [4.3, -9.75, .45, .5],
    mouth: [3.4, -8.6], cheeks: [[1.6, -9.3]], ears: [[-2.6, -11.9]], hat: [-.1, .88], scarf: 1.9,
    arms: [[.9, 0, 'R', 0], [.5, 0, 'L', 1]], legs: [-.5, .9], lensX: .45,
  },
};
// Heading in turns: 0 = front, .125 = 3/4 right, .25 = side right; negative headings face left.
function caraView(a) {
  const K = [['front', 0], ['q', 0], ['side', 0]], i = clamp(Math.round(Math.abs(a) * 8), 0, 2);
  return { view: K[i][0], flip: a < 0 && i > 0 };
}
// A drawn turn from heading a0 to a1 between t0 and t1, stepping through the key views with a soft smear.
function caraTurn(t, t0, t1, a0, a1) {
  const k = ease(seg(t, t0, t1));
  return { ...caraView(lerp(a0, a1, k)), smear: t > t0 && t < t1 ? .35 * Math.sin(k * Math.PI) : 0 };
}

// ---------- Cara ----------
// Options (all optional):
//   pose:  dx, dy (in u; negative dy = up), sq (squash; negative stretches), rot (pivots at the feet), flip,
//          aL, aR (arm angles: 0 = straight out, + up, - down; about -1.2 hangs by the skirt), bL, bR (elbow bend, -1..1),
//          walk (leg phase; the legs step), noShadow
//   view:  front | q | side (see CARA_VIEWS). smear 0..1 for fast turns
//   face:  eyes (normal, happy, wide, shine, closed, look), mouth (smile, grin, open, openS, O, small, flat),
//          lookX / lookY (-1..1), squint 0..1, blush 0..1, seed (blink timing), noGlasses
//   hat:   hatDy, hatRot (follow-through from caraHop), noHat
//   extras: emote + emoteK + emoteAge (see emotes.js), draw(u, sw), armL(u, sw), armR(u, sw)
//   boil:  boilKey (a stable id for her boil seeds; defaults to call order)
let CARA_N = 0;
function cara(x, y, U, o = {}) {
  const id = o.boilKey ?? 'c' + (++CARA_N), rs = part => boilSeed(`cara ${id} ${part}`);
  const V = CARA_VIEWS[o.view] || CARA_VIEWS.front, C = CARA, u = U * CARA_SCALE;
  x += (o.dx || 0) * U;
  const dy = (o.dy || 0) * U, sq = o.sq || 0, sm = clamp(o.smear || 0);
  const sw = clamp(U / 16, .4, 2.2) * .85, J = u * .04;
  const P = pts => pts.map(([a, b]) => [a * u, b * u]);

  rs('shadow');
  if (!o.noShadow) {
    const f = 1 - Math.min(.5, Math.abs(o.dy || 0) * .08);
    paint(ellPts(x, y + U * .12, U * 3.3 * f, U * .65 * f, 22), { fill: C.ink, fillOp: 60, bleed: .2, tex: .3, border: .1, ink: null });
  }
  if (sm > .05) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {   // soft smear streaks on a quick turn
    const yy = y + dy - (9 - i * 2.4) * U;
    inkLine([[x + s * 2.8 * U, yy], [x + s * (2.8 + 2.4 * sm) * U, yy + jit(U * .1)]], 1.6 * sm, C.furLt, 'dry', .3);
  }

  push();
  translate(x, y + dy);
  if (o.rot) rotate(o.rot);
  scale((o.flip ? -1 : 1) * (1 + sq * .5) * (1 + sm * .2), 1 - sq);

  const arm = ([sx, dir, which, layer]) => {
    rs('arm' + which);
    const a = which === 'L' ? (o.aL ?? -1.2) : (o.aR ?? -1.2), bend = which === 'L' ? (o.bL ?? .15) : (o.bR ?? .15);
    const hook = which === 'L' ? o.armL : o.armR, d = dir === 0 ? 1 : dir, L = 3.0 * u;
    const x0 = sx * u, y0 = -6.5 * u;
    const ex = x0 + d * Math.cos(a) * L, ey = y0 - Math.sin(a) * L;
    const nx = -(ey - y0) / L, ny = (ex - x0) / L, m = [(x0 + ex) / 2 + nx * bend * u * d, (y0 + ey) / 2 + ny * bend * u * d];
    const col = layer === 0 ? mixCol(C.fur, C.furDk, .45) : C.fur, ang = Math.atan2(ey - m[1], ex - m[0]);
    paint(ribbon([[x0, y0], m, [ex, ey]], 1.45 * u, 1.15 * u), { wash: col, ink: C.ink, sw: sw * .8 });
    paint(ellPts(ex + Math.cos(ang) * .25 * u, ey + Math.sin(ang) * .25 * u, .7 * u, .6 * u, 14, J * .3, ang), { wash: layer === 0 ? mixCol(C.paw, C.ink, .2) : C.paw, ink: C.ink, sw: sw * .7 });
    if (hook) { push(); translate(ex, ey); rotate(ang); if (d < 0) scale(1, -1); hook(u, sw); pop(); }
  };

  // far arm, legs and feet, body, dress, scarf, head, hat, then near arms
  V.arms.filter(a => a[3] === 0).forEach(arm);
  V.legs.forEach((lx, i) => {
    rs('leg' + i);
    let lift = 0, sx = 0;
    if (o.walk != null) { const ph = (o.walk + (i ? .5 : 0)) * TAU; lift = Math.max(0, Math.sin(ph)) * .6; sx = Math.cos(ph) * (o.view === 'front' ? .1 : .5); }
    const far = V !== CARA_VIEWS.front && i === 0, fx = lx + sx, toe = V === CARA_VIEWS.front ? 0 : .45;
    paint(rrPts((fx - .65) * u, (-2.4 - lift) * u, 1.3 * u, 2.0 * u, .55 * u, J * .4), { wash: far ? mixCol(C.fur, C.furDk, .5) : C.fur, ink: C.ink, sw: sw * .8 });
    paint(ellPts((fx + toe) * u, (-.42 - lift) * u, (1.0 + toe * .4) * u, .48 * u, 16, J * .3), { wash: far ? mixCol(C.paw, C.ink, .2) : C.paw, ink: C.ink, sw: sw * .8 });
    for (const k of [-.45, 0, .45]) inkLine(P([[fx + toe + k * .9, -.15 - lift], [fx + toe + k * .9, -.45 - lift]]), sw * .4, C.ink, 'inkfine', 0);   // toes
  });

  rs('body');
  const [bcx, brx] = V.body;
  const body = ellPts(bcx * u, -5.3 * u, brx * u, 2.4 * u, 30, J);
  paint(body, { wash: C.fur, ink: C.ink, sw });

  // the dress: a fitted bodice and a gathered A-line skirt with a waist seam
  rs('dress');
  const [dx0, dw] = V.dress, D = pts => pts.map(([a, b]) => [(dx0 + a * dw) * u, b * u]);
  paint(D([[-2.15, -7.2], [2.15, -7.2], [2.35, -5.6], [2.5, -4.6], [-2.5, -4.6], [-2.35, -5.6]]), { wash: C.dress, ink: C.ink, sw: sw * .8 });
  const skirt = D([[-2.5, -4.65], [2.5, -4.65], [2.95, -3.3], [3.35, -1.85], [2.2, -1.65], [1.1, -1.8], [0, -1.65], [-1.1, -1.8], [-2.2, -1.65], [-3.35, -1.85], [-2.95, -3.3]]);
  paint(skirt, { wash: C.dress, ink: null, curv: .25 });
  paint(D([[-2.2, -4.2], [-1.2, -4.3], [-1.6, -2.2], [-2.8, -2.2]]), { fill: C.dressLt, fillOp: 80, bleed: .2, tex: .5, ink: null });   // soft light on the skirt
  paint(skirt, { ink: C.ink, sw: sw * .8, curv: .25 });
  for (const k of [-1.9, -.95, 0, .95, 1.9]) inkLine(D([[k * .95, -4.4], [k * 1.2, -2.0]]), sw * .45, C.dressDk, 'inkfine', .2);   // gathers
  inkLine(D([[-2.5, -4.62], [0, -4.55], [2.5, -4.62]]), sw * .6, C.dressDk, 'inkfine', .5);                                      // waist seam

  // the tartan scarf: a band round the neck and one fringed end hanging down the front
  rs('scarf');
  const sx0 = V.scarf, stripe = (pts, col, w) => inkLine(P(pts), sw * w, col, 'ink', 0);
  paint(ribbon(P([[sx0, -7.0], [sx0 + .25, -5.4], [sx0 + .45, -3.6]]), 1.1 * u, 1.05 * u), { wash: C.scarfR, ink: C.ink, sw: sw * .7 });
  paint(ribbon(P([[-2.7 + dx0, -7.15], [dx0, -6.75], [2.7 + dx0, -7.15]]), 1.25 * u, 1.25 * u), { wash: C.scarfR, ink: C.ink, sw: sw * .7 });
  for (const k of [-1.9, -.7, .5, 1.7]) stripe([[k + dx0, -7.6], [k + dx0 + .12, -6.7]], C.scarfG, 1.0);    // tartan: green bars
  stripe([[-2.5 + dx0, -7.05], [dx0, -6.7], [2.5 + dx0, -7.05]], C.scarfG, .9);
  stripe([[-2.5 + dx0, -7.3], [dx0, -6.95], [2.5 + dx0, -7.3]], C.scarfW, .35);
  for (const yy of [-6.2, -5.1, -4.1]) stripe([[sx0 - .3 + (yy + 7) * .12, yy], [sx0 + .78 + (yy + 7) * .12, yy]], C.scarfG, 1.0);
  stripe([[sx0 + .2, -6.9], [sx0 + .6, -3.75]], C.scarfG, .8);
  stripe([[sx0 - .05, -5.6], [sx0 + 1.05, -5.6]], C.scarfW, .35); stripe([[sx0 + .45, -6.9], [sx0 + .82, -3.75]], C.scarfW, .3);
  for (let i = 0; i < 6; i++) { const fx = sx0 + .02 + i * .19; stripe([[fx, -3.6], [fx + .02 + .03 * Math.sin(T * 3 + i), -2.95]], i % 2 ? C.scarfG : C.scarfR, .6); }   // fringe

  rs('head');
  push(); translate(0, (o.headDy || 0) * u); translate(0, -7.4 * u); scale(1.22, 1.14); translate(0, 7.4 * u);   // her head is big and broad
  for (const [ex, ey] of V.ears) {
    paint(ellPts(ex * u, ey * u, .55 * u, .6 * u, 14, J * .4), { wash: C.furDk, ink: C.ink, sw: sw * .8 });
    paint(ellPts(ex * u, (ey + .1) * u, .25 * u, .3 * u, 10), { wash: C.paw, ink: null });
  }
  const head = P(V.head);
  paint(head, { wash: C.fur, ink: null, curv: .6 });
  paint(ellPts((V.eyes[V.eyes.length - 1][0] - 1.2) * u, -12.5 * u, 1.9 * u, .6 * u, 16, 0, -.1), { fill: C.furLt, fillOp: 100, bleed: .18, tex: .7, border: .7, ink: null });
  const [mx, my, mrx, mry] = V.muzzle;
  paint(ellPts(mx * u, my * u, mrx * u, mry * u, 22, J * .3), { wash: C.muzzle, ink: null });
  paint(head, { ink: C.ink, sw, curv: .6 });
  const bl = clamp(o.blush ?? .35);
  if (bl > .02) for (const [cx, cy] of V.cheeks) paint(ellPts(cx * u, cy * u, .6 * u, .32 * u, 12), { fill: C.cheek, fillOp: 70 + 110 * bl, bleed: .2, ink: null });
  rs('whiskers');
  for (const s of V === CARA_VIEWS.front ? [-1, 1] : [1]) for (const k of [-.2, .15, .5]) {
    const x0 = mx + s * mrx * .7, y0 = my + k * .5;
    inkLine(P([[x0, y0], [x0 + s * 1.1, y0 - .15 + k * .35]]), sw * .3, mixCol(C.ink, C.muzzle, .3), 'inkfine', .4);
  }
  rs('mouth');
  caraMouth(u, o.mouth ?? 'smile', sw, V.mouth[0], V.mouth[1], V === CARA_VIEWS.front ? 1 : V === CARA_VIEWS.q ? .85 : .6);
  rs('nose');   // a big, soft, dark capybara nose with a shine, sitting on top of the muzzle
  const [nx0, ny0, nrx, nry] = V.nose;
  paint(ellPts(nx0 * u, ny0 * u, nrx * u, nry * u, 18, J * .15), { wash: C.nose, ink: C.ink, sw: sw * .6, curv: .4 });
  paint(ellPts((nx0 - nrx * .3) * u, (ny0 - nry * .4) * u, nrx * .3 * u, nry * .25 * u, 8), { wash: C.muzzle, ink: null });
  inkLine(P([[nx0, ny0 + nry], [V.mouth[0], V.mouth[1] - .2]]), sw * .5, C.ink, 'inkfine', 0);
  rs('eyes');
  caraEyes(u, o, sw, V);
  if (!o.noGlasses) { rs('glasses'); caraGlasses(u, o, sw, V); }
  if (!o.noHat) {
    rs('hat');
    push(); translate(V.hat[0] * u, (-13.05 + (o.hatDy || 0)) * u); rotate(-.1 + (o.hatRot || 0)); scale(V.hat[1], 1); strawHat(u, sw); pop();
  }
  pop();

  V.arms.filter(a => a[3] === 1).forEach(arm);
  rs('draw'); if (o.draw) o.draw(u, sw);
  pop();

  rs('emote');
  if (o.emote) {
    const dir = o.flip ? -1 : 1, top = EMOTE_TOP.includes(o.emote);
    emote(o.emote, x + dir * (top ? 0 : 4.3) * U, y + dy - (top ? 14.2 : 12) * U * (1 - sq), U * .8, o.emoteK ?? 1, o.emoteAge ?? T);
  }
  rs('after');
}

// ---------- face ----------
// Big friendly eyes: white, a warm brown iris, a dark pupil and two highlights. Happy / closed are ink arcs.
function caraEyes(u, o, sw, V) {
  const C = CARA, lx = (o.lookX || 0) * .22, ly = (o.lookY || 0) * .18, sqz = clamp(o.squint || 0);
  const blink = ['normal', 'look', 'wide', 'shine'].includes(o.eyes || 'normal') && ((T * .8 + (o.seed || 0) * 1.3) % 3.7) < .12;
  for (const [ex, ey, s] of V.eyes) {
    push(); translate(ex * u, ey * u); scale(s * (V.lensX * .7 + .3), s);
    const kind = sqz > .8 || blink ? 'closed' : o.eyes || 'normal';
    const line = (pts, w = 1) => inkLine(pts.map(([a, b]) => [a * u, b * u]), sw * w, C.ink, 'ink', .5);
    if (kind === 'happy') line([[-.55, .2], [0, -.3], [.55, .2]], 1.3);          // ∩ smiling eyes
    else if (kind === 'closed') line([[-.55, 0], [0, .3], [.55, 0]], 1.3);       // ∪ shut
    else {
      const big = kind === 'wide' ? 1.15 : kind === 'shine' ? 1.08 : 1, h = 1 - sqz;
      paint(ellPts(0, 0, .62 * big * u, .64 * big * h * u, 18), { wash: C.teeth, ink: C.ink, sw: sw * .6 });
      paint(ellPts(lx * u, ly * u, .44 * big * u, .46 * big * h * u, 16), { wash: C.iris, ink: null });
      paint(ellPts(lx * u, ly * u, .24 * big * u, .26 * big * h * u, 12), { wash: C.ink, ink: null });
      if (kind === 'shine') paint(starPts((lx - .15) * u, (ly - .15) * u, .24 * u, .4, 4), { wash: C.teeth, ink: null });
      else paint(ellPts((lx - .15) * u, (ly - .17) * u, .14 * u, .15 * u, 8), { wash: C.teeth, ink: null });
      paint(ellPts((lx + .17) * u, (ly + .17) * u, .06 * u, .06 * u, 6), { wash: C.teeth, ink: null });
    }
    pop();
  }
}
// Her big pink glasses: rounded-square frames with clear lenses (children read faces, so her eyes always show).
function caraGlasses(u, o, sw, V) {
  const C = CARA, L = V.eyes.map(([ex, ey, s]) => ({ x: ex * u, y: ey * u, w: 2.65 * s * V.lensX * u, h: 1.95 * s * u }));
  for (const l of L) {
    paint(rrPts(l.x - l.w / 2, l.y - l.h / 2, l.w, l.h, Math.min(l.w, l.h) * .38), { wash: C.lens, washOp: 15, ink: C.frame, sw: sw * 1.35 });
    inkLine([[l.x - l.w * .28, l.y - l.h * .05], [l.x - l.w * .1, l.y - l.h * .3]], sw * .6, C.teeth, 'inkfine', 0);   // glint
  }
  if (L.length > 1) inkLine([[L[0].x + L[0].w / 2, L[0].y - .25 * u], [(L[0].x + L[1].x) / 2, L[0].y - .45 * u], [L[1].x - L[1].w / 2, L[1].y - .25 * u]], sw * 1.2, C.frame, 'ink', .5);
  const back = L[0];   // the arm runs back from the rearmost lens toward the ear
  if (V !== CARA_VIEWS.front) inkLine([[back.x - back.w / 2, back.y - .3 * u], [back.x - back.w / 2 - (V === CARA_VIEWS.side ? 3.0 : 2.0) * u, back.y - .6 * u]], sw * 1.2, C.frame, 'ink', 0);
  else for (const s of [-1, 1]) inkLine([[s * 2.7 * u, -11.35 * u], [s * 3.1 * u, -11.5 * u]], sw * 1.2, C.frame, 'ink', 0);
}
// Mouths, all with her two white buck teeth: smile (the resting face: closed, teeth peeking), grin (her signature open
// smile), open and openS (talking), O (surprised), small, flat.
function caraMouth(u, m, sw, mx, my, w = 1) {
  const C = CARA, P = pts => pts.map(([a, b]) => [(mx + a * w) * u, (my + b) * u]);
  const teeth = (top, h) => { for (const s of [-1, 1]) paint(P([[s * .04, top], [s * .5, top], [s * .5, top + h], [s * .04, top + h]]), { wash: C.teeth, ink: C.ink, sw: sw * .45 }); };
  const open = (pts, tongueY, tongueW) => {
    paint(P(pts), { wash: C.mouth, ink: C.ink, sw: sw * .7, curv: .5 });
    if (tongueW) paint(ellPts(mx * u, (my + tongueY) * u, tongueW * w * u, .22 * u, 12), { wash: C.tongue, ink: null });
  };
  switch (m) {
    case 'grin': open([[-1.1, -.1], [0, .05], [1.1, -.1], [.8, .7], [0, 1.0], [-.8, .7]], .72, .55); teeth(-.02, .5); break;
    case 'open': open([[-.8, -.05], [0, .05], [.8, -.05], [.55, .6], [0, .8], [-.55, .6]], .58, .4); teeth(0, .42); break;
    case 'openS': open([[-.6, 0], [0, .05], [.6, 0], [.4, .38], [0, .5], [-.4, .38]], 0, 0); teeth(.02, .32); break;
    case 'O': open([[-.45, 0], [0, -.05], [.45, 0], [.45, .6], [0, .8], [-.45, .6]], 0, 0); teeth(0, .3); break;
    case 'small': teeth(.02, .38); inkLine(P([[-.4, .05], [0, .12], [.4, .05]]), sw * .6, C.ink, 'ink', .5); break;
    case 'flat': teeth(.02, .38); inkLine(P([[-.6, .02], [.6, .02]]), sw * .7, C.ink, 'ink', 0); break;
    default: teeth(.02, .45); inkLine(P([[-1.0, -.2], [-.5, .08], [0, .05], [.5, .08], [1.0, -.2]]), sw * .8, C.ink, 'ink', .6);   // smile
  }
}
// The straw boater, drawn around the brim centre: a wide brim, a low crown and a pink band.
function strawHat(u, sw) {
  const C = CARA, P = pts => pts.map(([a, b]) => [a * u, b * u]);
  paint(ellPts(0, 0, 4.1 * u, 1.05 * u, 32, u * .03), { wash: C.straw, ink: C.ink, sw: sw * .9 });
  for (const [rx, ry] of [[3.5, .78], [2.9, .5]]) inkLine(P([[-rx, .05], [-rx * .5, ry * .95], [0, ry], [rx * .5, ry * .95], [rx, .05]]), sw * .4, C.strawDk, 'inkfine', .5);   // woven rings
  const crown = P([[-2.35, .1], [-2.3, -1.2], [-1.6, -1.75], [1.6, -1.75], [2.3, -1.2], [2.35, .1]]);
  paint(crown, { wash: C.straw, ink: C.ink, sw: sw * .9, curv: .4 });
  paint(ellPts(-.8 * u, -1.25 * u, .9 * u, .3 * u, 12), { fill: PAL.cream, fillOp: 80, bleed: .15, ink: null });
  paint(P([[-2.35, 0], [2.35, 0], [2.32, -.62], [-2.32, -.62]]), { wash: C.band, ink: C.ink, sw: sw * .6 });
  inkLine(P([[-2.1, -1.0], [0, -1.1], [2.1, -1.0]]), sw * .4, C.strawDk, 'inkfine', .5);
}

// ---------- poses ----------
// Each pose is a face AND a way of moving, gently locked to the beat. take = how big the reaction is on switching INTO
// it (kept soft for young viewers). fade = the emote is a one-off that fades.
const _cb = t => { const bp = bpOf(t), s1 = Math.sin(bp * Math.PI); return { bp, s1, ab: Math.abs(s1), hit: pulse(t, 5), s2: Math.sin(bp * TAU) }; };
const CARA_POSES = {
  idle:      { eyes: 'normal', mouth: 'smile', blush: .35, take: .25, body: t => { const b = _cb(t), br = Math.sin(t * TAU * .4); return { dy: -.12 * b.ab, sq: .02 * br, aL: -1.25 + .04 * br, aR: -1.22 - .04 * br, bL: .15, bR: .2 }; } },
  happy:     { eyes: 'happy', mouth: 'grin', blush: .7, take: .5, body: t => { const b = _cb(t); return { dy: -.55 * b.ab, sq: .05 * b.hit, rot: .025 * b.s1, aL: -.75 + .2 * b.s1, aR: -.75 - .2 * b.s1 }; } },
  curious:   { eyes: 'look', mouth: 'small', blush: .3, emote: '?', take: .35, body: t => { const b = _cb(t); return { rot: .07 + .015 * b.s1, dy: -.08 * b.ab, lookX: .6, lookY: -.6, aL: -1.1, aR: -.55, bR: .6 }; } },
  surprised: { eyes: 'wide', mouth: 'O', blush: .3, emote: '!', fade: true, take: .8, body: t => { const b = _cb(t); return { sq: -.06, dy: -.15 - .08 * b.ab, aL: .15, aR: .15, bL: -.3, bR: -.3 }; } },
  excited:   { eyes: 'shine', mouth: 'open', blush: .8, emote: 'spark', take: .6, body: t => { const b = _cb(t), h = Math.abs(b.s2); return { dy: -.9 * h, sq: .08 * pulse2(t) - .03 * h, aL: .4 + .3 * Math.sin(b.bp * TAU), aR: .4 - .3 * Math.sin(b.bp * TAU) }; } },
  wave:      { eyes: 'happy', mouth: 'grin', blush: .6, take: .35, body: t => { const w = Math.sin(t * TAU * 1.6); return { dy: -.1 * Math.abs(w), rot: -.02 * w, aR: 1.15 + .28 * w, bR: -.55 * Math.sin(t * TAU * 1.6 + .9), aL: -1.1 }; } },
  talk:      { eyes: 'normal', mouth: 'smile', blush: .45, take: .2, body: t => { const b = _cb(t); return { dy: -.1 * b.ab, rot: .02 * Math.sin(t * 2.1), aL: -1 + .12 * Math.sin(t * 3.1), aR: -.6 + .25 * Math.sin(t * 2.3), bR: .5 }; } },
};
// One pose, alive at time t. Spread it into cara(): cara(x, y, u, caraPose('happy', t, { view: 'q' }))
function caraPose(name, t, over = {}) {
  const E = CARA_POSES[name] || CARA_POSES.idle;
  return { eyes: E.eyes, mouth: E.mouth, blush: E.blush ?? .35, emote: E.emote, ...(E.body ? E.body(t) : {}), ...over };
}
// Acted changes between poses: keys = [[t0, 'idle'], [t1, 'surprised'], [t2, 'happy', { lookX: .5 }]]. Around each
// change she blinks (the face swaps while her eyes are shut), gives a soft squash-stretch take the size of the new
// pose's `take`, and eases into its motion with a little overshoot. The new emote pops in. o.take scales every take.
function caraActs(t, keys, o = {}) {
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const [tc, name, over] = keys[i], age = t - tc, cur = caraPose(name, t, over), E = CARA_POSES[name] || CARA_POSES.idle;
  const tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity, tk = o.take ?? 1;
  let squint = cur.squint || 0;
  if (tn - t < .08) squint = Math.max(squint, 1 - (tn - t) / .08);
  if (i > 0 && age < .12) squint = Math.max(squint, 1 - age / .12);
  const prev = i > 0 ? caraPose(keys[i - 1][1], t, keys[i - 1][2]) : null;
  if (prev && age < .6) {
    const base = { dy: 0, sq: 0, aL: -1.1, aR: -1.1, bL: .15, bR: .15, rot: 0, dx: 0, lookX: 0, lookY: 0 }, k = backOut(seg(age, 0, .5)), kc = ease(seg(age, 0, .35));
    for (const f in base) cur[f] = lerp(prev[f] ?? base[f], cur[f] ?? base[f], k);
    cur.blush = lerp(prev.blush || 0, cur.blush || 0, kc);
  }
  const t1 = prev ? take(t, tc, (E.take ?? .4) * tk * .7) : { sq: 0, dy: 0 };
  const En = i + 1 < keys.length ? CARA_POSES[keys[i + 1][1]] || CARA_POSES.idle : null, t2 = En ? take(t, tn, (En.take ?? .4) * tk * .7) : { sq: 0, dy: 0 };
  cur.sq = (cur.sq || 0) + t1.sq + t2.sq; cur.dy = (cur.dy || 0) + t1.dy + t2.dy; cur.squint = squint;
  const same = prev && prev.emote === cur.emote;
  cur.emoteK = same ? 1 : seg(age, .08, .35) * (E.fade && !(over && over.emote) ? 1 - seg(age, 1.6, 2.1) : 1);
  cur.emoteAge = age;
  return cur;
}
// Walk from x0 to x1 (px) between t0 and t1: eases in and out, faces the way she's going in 3/4 view, with a bob,
// swinging arms and a hat that lags. Returns { x, walk, view, flip, dy, aL, aR, hatRot } (spread it, and use .x).
function caraWalk(t, t0, t1, x0, x1, u) {
  const k = ease(seg(t, t0, t1)), x = lerp(x0, x1, k), d = Math.abs(x - x0) / (3.2 * u), moving = t > t0 && t < t1;
  const sw = Math.sin(d * TAU) * (moving ? 1 : 0), bob = moving ? -Math.abs(Math.sin(d * Math.PI * 2)) * .35 : 0;
  return { x, walk: moving ? d : null, view: moving ? 'q' : 'front', flip: x1 < x0 && moving, dy: bob, rot: moving ? .03 * sw : 0,
           aL: -1.05 + .4 * sw, aR: -1.05 - .4 * sw, bL: .3, bR: .3, hatRot: moving ? -.03 * Math.cos(d * TAU * 2) : 0 };
}
// A happy jump that takes off at t0 and lands at t1, h units high: crouch, stretch, arms up, squash on landing, and the
// hat lifting off her head a little and settling back (follow-through). Returns { dy, sq, aL, aR, hatDy, hatRot }.
function caraHop(t, t0, t1, h = 2.5) {
  const j = jump(t, t0, t1, h), air = seg(t, t0, t1) > 0 && t < t1 + .3;
  const up = t < t0 - .12 ? 0 : t < t1 ? Math.sin(Math.PI * seg(t, t0 - .12, t1)) : Math.exp(-(t - t1) * 6) * .3;
  const lag = t > t0 ? spring(t, t0, 5, 14) * .6 : 0;
  return { dy: j.dy, sq: j.sq, aL: lerp(-1.1, 1.0, up), aR: lerp(-1.1, 1.0, up), bL: -.3 * up, bR: -.3 * up,
           hatDy: air ? -.5 * Math.sin(Math.PI * seg(t, t0, t1 + .15)) : 0, hatRot: lag * .15 };
}
// Talking: returns { mouth } while she's speaking, and {} otherwise (so the pose's own mouth shows).
//   talk(t, [[5.2, 6.0], [16.1, 17.0]])  flaps the mouth over those spans (placeholder timing before the audio exists)
//   talk(t, 'ep01-cara')                  follows a mouth track made from the real voiceover by tools/mouth_track.mjs
const MOUTH = {};
function talk(t, src, o = {}) {
  if (typeof src === 'string') {
    const m = MOUTH[src]; if (!m) return {};
    const i = Math.floor((t - (m.at || 0)) * m.fps), v = i >= 0 && i < m.v.length ? +m.v[i] : 0;
    return v >= 6 ? { mouth: 'open' } : v >= 3 ? { mouth: 'openS' } : v >= 1 ? { mouth: 'small' } : (i >= 0 && i < m.v.length ? { mouth: 'smile' } : {});
  }
  const span = (src || []).find(([a, b]) => t >= a && t < b); if (!span) return {};
  const rate = o.rate ?? 6.5, p = (t - span[0]) * rate, syl = Math.floor(p), seed = span[0] * 13.1;
  if (t > span[1] - .08 || frac(p) > .7 || hash(syl + seed) < .18) return { mouth: 'smile' };   // closed between syllables
  return { mouth: hash(syl * 3.7 + seed) > .72 ? 'O' : hash(syl * 1.9 + seed) > .4 ? 'open' : 'openS' };
}
// Combine pose pieces: later pieces win, except dx, dy, sq and rot, which add up.
//   cara(x, y, u, mixPose(caraActs(t, keys), caraHop(t, 3, 3.5), talk(t, LINES), { view: 'q' }))
function mixPose(...parts) {
  const out = {};
  for (const p of parts) for (const k in p) out[k] = ['dx', 'dy', 'sq', 'rot', 'hatDy', 'hatRot'].includes(k) && out[k] != null ? out[k] + (p[k] || 0) : p[k];
  return out;
}
