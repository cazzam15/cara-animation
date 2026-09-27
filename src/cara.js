// cara.js: Cara the Capybara, painted in wash and ink. A friendly, upright capybara in pink sunglasses, a straw hat and
// a pink spotty swimsuit. `u` is her size unit: she is about 6u wide and 12u tall with her hat. (x, y) is the point on the
// ground between her feet.
//
// Body-local coordinates in the front view (for the o.draw / o.armL / o.armR hooks), in u, y up is negative:
//   feet y 0; body centre (0, -3.75), 2.9u × 2.6u; swimsuit from y -5 down to about -1.3; head -10.75..-5.05;
//   eyes (±1.3, -8.75); nose (0, -7.3); mouth (0, -5.95); hat brim y -10.4, crown top y -12.3.
//   Arms hang from shoulders at (±2.45, -4.6) and are 2.6u long. o.armL / o.armR are called at the paw, in arm space
//   (+x runs outward along the arm), so a held prop draws around (0, 0).
//
// Everything here draws one frame; motion comes from what you pass in. The poses are:
//   idle, happy, curious, surprised, excited, wave, talk   → caraPose(name, t) or acted changes with caraActs(t, keys)
//   walk                                                   → caraWalk(t, t0, t1, x0, x1, u)
//   happy jump                                             → caraHop(t, t0, t1, h)
//   talking (mouth open/closed for lip-sync)               → talk(t, lines) or talk(t, 'trackName')
// Combine them with mixPose(...), which adds up the fields that stack (dx, dy, sq, rot) instead of overwriting them.

const CARA = {
  fur: '#BF8A57', furDk: '#94663F', furLt: '#E2B98A', muzzle: '#E6C49A', nose: '#6A4532', ink: '#3A2E3A',
  suit: '#F27FA6', suitDk: '#DA6690', dot: '#FFF0F5',
  frame: '#E9559A', lens: '#FFB3D1', straw: '#EFCD80', strawDk: '#C99E4E', band: '#F27FA6',
  cheek: '#F6A0B6', mouth: '#5A2A33', tongue: '#F28CA0',
};

// ---------- views ----------
// Drawn key views, never a 3D rotation. q and side face screen-right; flip: true mirrors them to face left.
//   head: outline points.  body: [cx, rx].  eyes: [x, y, scale] from screen-left to screen-right.
//   muzzle / nose: [x, y, rx, ry].  mouth: [x, y].  cheeks / ears: [[x, y], ...].  hat: [x offset, width scale].
//   arms: [shoulder x, dir (-1 left, 1 right, 0 forward), 'L' | 'R', layer (0 behind the body, 1 in front)].
//   legs: [x, x] for the two legs.  lensX: how round the lenses look (1 = facing us).
const CARA_VIEWS = {
  front: {
    head: [[-2.3, -10.6], [0, -10.8], [2.3, -10.6], [2.65, -9.3], [2.8, -7.4], [2.85, -6.0], [2.2, -5.15], [0, -4.95], [-2.2, -5.15], [-2.85, -6.0], [-2.8, -7.4], [-2.65, -9.3]],
    body: [0, 2.9], eyes: [[-1.3, -8.75, 1], [1.3, -8.75, 1]], muzzle: [0, -6.25, 2.35, 1.35], nose: [0, -7.1, 1.35, .5],
    mouth: [0, -5.95], cheeks: [[-2.05, -7.35], [2.05, -7.35]], ears: [[-2.75, -10.95], [2.75, -10.95]], hat: [0, 1],
    arms: [[-2.45, -1, 'L', 1], [2.45, 1, 'R', 1]], legs: [-1.3, 1.3], lensX: 1,
  },
  q: {
    head: [[-2.2, -10.5], [.4, -10.75], [2.5, -10.4], [3.5, -9.4], [3.95, -8.0], [4.0, -6.5], [3.6, -5.5], [2.2, -5.05], [0, -5.05], [-1.8, -5.4], [-2.5, -6.9], [-2.65, -9.0]],
    body: [.1, 2.75], eyes: [[.15, -8.8, .8], [1.95, -8.85, 1]], muzzle: [2.5, -6.35, 1.6, 1.3], nose: [3.2, -7.25, 1.0, .45],
    mouth: [2.8, -5.85], cheeks: [[.9, -7.15]], ears: [[-2.35, -10.9], [2.95, -10.95]], hat: [.35, 1],
    arms: [[2.4, 1, 'R', 0], [-2.25, -1, 'L', 1]], legs: [-1.15, 1.35], lensX: .82,
  },
  side: {
    head: [[-1.9, -10.2], [.8, -10.45], [2.6, -10.05], [3.85, -9.05], [4.35, -7.8], [4.35, -6.4], [3.9, -5.55], [2.4, -5.25], [.4, -5.35], [-1.6, -5.9], [-2.3, -7.6], [-2.3, -9.0]],
    body: [0, 2.4], eyes: [[1.35, -8.85, 1]], muzzle: [3.05, -6.45, 1.35, 1.2], nose: [4.05, -7.45, .42, .5],
    mouth: [3.65, -5.95], cheeks: [[1.95, -7.1]], ears: [[-1.85, -10.85]], hat: [.5, .85],
    arms: [[.55, 0, 'R', 0], [.2, 0, 'L', 1]], legs: [-.8, .8], lensX: .6,
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
//          aL, aR (arm angles: 0 = straight out, + up, - down; about -1.1 hangs relaxed), bL, bR (elbow bend, -1..1),
//          walk (leg phase; the legs step), noShadow
//   view:  front | q | side (see CARA_VIEWS). smear 0..1 for fast turns
//   face:  eyes (normal, happy, wide, shine, closed, look), mouth (smile, grin, open, openS, O, small, flat),
//          lookX / lookY (-1..1), squint 0..1, blush 0..1, seed (blink timing), noGlasses
//   hat:   hatDy, hatRot (follow-through from caraHop), noHat
//   extras: emote + emoteK + emoteAge (see emotes.js), draw(u, sw), armL(u, sw), armR(u, sw)
//   boil:  boilKey (a stable id for her boil seeds; defaults to call order)
let CARA_N = 0;
function cara(x, y, u, o = {}) {
  const id = o.boilKey ?? 'c' + (++CARA_N), rs = part => boilSeed(`cara ${id} ${part}`);
  const V = CARA_VIEWS[o.view] || CARA_VIEWS.front, C = CARA;
  x += (o.dx || 0) * u;
  const dy = (o.dy || 0) * u, sq = o.sq || 0, sm = clamp(o.smear || 0);
  const sw = clamp(u / 16, .4, 2.2) * .85, J = u * .05;
  const P = pts => pts.map(([a, b]) => [a * u, b * u]);

  rs('shadow');
  if (!o.noShadow) {
    const f = 1 - Math.min(.5, Math.abs(o.dy || 0) * .08);
    paint(ellPts(x, y + u * .12, u * 3.4 * f, u * .7 * f, 22), { fill: C.ink, fillOp: 60, bleed: .2, tex: .3, border: .1, ink: null });
  }
  if (sm > .05) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {   // soft smear streaks on a quick turn
    const yy = y + dy - (8.5 - i * 2.2) * u;
    inkLine([[x + s * 2.6 * u, yy], [x + s * (2.6 + 2.4 * sm) * u, yy + jit(u * .1)]], 1.6 * sm, C.furLt, 'dry', .3);
  }

  push();
  translate(x, y + dy);
  if (o.rot) rotate(o.rot);
  scale((o.flip ? -1 : 1) * (1 + sq * .5) * (1 + sm * .2), 1 - sq);

  const arm = ([sx, dir, which, layer]) => {
    rs('arm' + which);
    const a = which === 'L' ? (o.aL ?? -1.1) : (o.aR ?? -1.1), bend = which === 'L' ? (o.bL ?? .15) : (o.bR ?? .15);
    const hook = which === 'L' ? o.armL : o.armR, d = dir === 0 ? 1 : dir, L = 2.6 * u;
    const x0 = sx * u, y0 = -4.6 * u, ang = dir === 0 ? a : a;   // side view: 0 = straight forward
    const ex = x0 + d * Math.cos(ang) * L, ey = y0 - Math.sin(ang) * L;
    const nx = -(ey - y0) / L, ny = (ex - x0) / L, m = [(x0 + ex) / 2 + nx * bend * u * d, (y0 + ey) / 2 + ny * bend * u * d];
    const col = layer === 0 ? mixCol(C.fur, C.furDk, .45) : C.fur;
    paint(ribbon([[x0, y0], m, [ex, ey]], 1.05 * u, .85 * u), { wash: col, ink: C.ink, sw: sw * .8 });
    paint(ellPts(ex, ey, .55 * u, .5 * u, 12, J * .3, Math.atan2(ey - m[1], ex - m[0])), { wash: layer === 0 ? mixCol(C.furDk, C.ink, .15) : C.furDk, ink: C.ink, sw: sw * .7 });
    if (hook) { push(); translate(ex, ey); rotate(Math.atan2(ey - m[1], ex - m[0])); if (d < 0) scale(1, -1); hook(u, sw); pop(); }
  };

  // far arms, legs, body and swimsuit, head, hat, then near arms
  V.arms.filter(a => a[3] === 0).forEach(arm);
  V.legs.forEach((lx, i) => {
    rs('leg' + i);
    let lift = 0, sx = 0;
    if (o.walk != null) { const ph = (o.walk + (i ? .5 : 0)) * TAU; lift = Math.max(0, Math.sin(ph)) * .55; sx = Math.cos(ph) * (o.view === 'front' ? .1 : .45); }
    const far = V !== CARA_VIEWS.front && i === 0;
    paint(rrPts((lx + sx - .72) * u, -2.3 * u, 1.44 * u, (2.3 - lift) * u, .62 * u, J * .4), { wash: far ? mixCol(C.furDk, C.ink, .15) : C.furDk, ink: C.ink, sw: sw * .8 });
    for (const k of [-1, 0, 1]) inkLine(P([[lx + sx + k * .38, -lift - .05], [lx + sx + k * .38, -lift - .38]]), sw * .4, C.ink, 'inkfine', 0);   // toes
  });

  rs('body');
  const [bcx, brx] = V.body, bcy = -3.75, bry = 2.6;
  const body = ellPts(bcx * u, bcy * u, brx * u, bry * u, 30, J);
  paint(body, { wash: C.fur, ink: null });
  // swimsuit: the body shape cut by a gently curved neckline above and leg openings below
  const nx = x => clamp((x / u - bcx) / brx, -1, 1);
  const suit = ellPts(bcx * u, bcy * u, brx * u * .995, bry * u * .995, 36).map(([px, py]) =>
    [px, clamp(py, (-5.0 + .35 * nx(px) ** 2) * u, (-1.25 - .95 * nx(px) ** 2) * u)]);
  paint(suit, { wash: C.suit, ink: null });
  paint(ellPts((bcx - .8) * u, -4.1 * u, 1.2 * u, .7 * u, 14, 0, -.3), { fill: C.dot, fillOp: 70, bleed: .15, tex: .6, ink: null });   // sheen
  const dots = [[-1.5, -3.2], [.1, -4.3], [1.5, -3.0], [-.4, -2.3], [1.0, -4.1], [-1.9, -4.2], [.6, -2.2]];
  dots.forEach(([dx0, dy0], i) => {
    const px = bcx + dx0 * brx / 2.9;
    if (Math.abs(px - bcx) < brx * .82) paint(ellPts(px * u, dy0 * u, .27 * u, .27 * u, 10), { wash: C.dot, ink: null });
  });
  paint(suit, { ink: mixCol(C.suitDk, C.ink, .3), sw: sw * .7 });
  for (const s of V === CARA_VIEWS.side ? [1] : [-1, 1]) {   // straps over the shoulders
    const sx = bcx + s * 1.35 * brx / 2.9;
    paint(ribbon(P([[sx, -4.75], [sx + s * .1, -5.3], [sx + s * .25, -5.8]]), .5 * u, .42 * u), { wash: C.suit, ink: mixCol(C.suitDk, C.ink, .3), sw: sw * .6 });
  }
  paint(body, { ink: C.ink, sw });

  rs('head');
  push(); translate(0, (o.headDy || 0) * u);
  for (const [ex, ey] of V.ears) {
    paint(ellPts(ex * u, ey * u, .5 * u, .55 * u, 14, J * .4), { wash: C.furDk, ink: C.ink, sw: sw * .8 });
    paint(ellPts(ex * u, (ey + .1) * u, .24 * u, .28 * u, 10), { wash: C.cheek, ink: null });
  }
  const head = P(V.head);
  paint(head, { wash: C.fur, ink: null, curv: .6 });
  paint(ellPts((V.eyes[V.eyes.length - 1][0] - 1.1) * u, -9.6 * u, 1.9 * u, .7 * u, 16, 0, -.1), { fill: C.furLt, fillOp: 110, bleed: .18, tex: .7, border: .7, ink: null });
  const [mx, my, mrx, mry] = V.muzzle;
  paint(ellPts(mx * u, my * u, mrx * u, mry * u, 22, J * .3), { wash: mixCol(C.fur, C.muzzle, .4), ink: null });   // subtle: capybaras have no bear-style pale muzzle
  paint(head, { ink: C.ink, sw, curv: .6 });
  // cheeks
  const bl = clamp(o.blush ?? .35);
  if (bl > .02) for (const [cx, cy] of V.cheeks) paint(ellPts(cx * u, cy * u, .55 * u, .32 * u, 12), { fill: C.cheek, fillOp: 90 + 110 * bl, bleed: .2, ink: null });
  // nose: a broad, soft capybara nose with a shine
  rs('nose');
  const [nx0, ny0, nrx, nry] = V.nose;
  paint(rrPts((nx0 - nrx) * u, (ny0 - nry) * u, 2 * nrx * u, 2 * nry * u, nry * .9 * u, J * .15), { wash: C.nose, ink: C.ink, sw: sw * .6 });   // broad, flat capybara nose
  paint(ellPts((nx0 - nrx * .35) * u, (ny0 - nry * .35) * u, nrx * .25 * u, nry * .28 * u, 8), { wash: C.muzzle, ink: null });
  for (const s of V === CARA_VIEWS.side ? [1] : [-1, 1]) inkLine(P([[nx0 + s * nrx * .45 - .1, ny0 + nry * .05], [nx0 + s * nrx * .45 + .1 * s, ny0 + nry * .45]]), sw * .5, C.ink, 'inkfine', 0);
  inkLine(P([[nx0, ny0 + nry], [V.mouth[0], V.mouth[1] - .25]]), sw * .55, C.ink, 'inkfine', 0);
  rs('mouth');
  caraMouth(u, o.mouth ?? 'smile', sw, V.mouth[0], V.mouth[1], V === CARA_VIEWS.front ? 1 : .8);
  rs('eyes');
  caraEyes(u, o, sw, V);
  if (!o.noGlasses) { rs('glasses'); caraGlasses(u, o, sw, V); }
  if (!o.noHat) {
    rs('hat');
    push(); translate(V.hat[0] * u, (-10.4 + (o.hatDy || 0)) * u); rotate(-.06 + (o.hatRot || 0)); scale(V.hat[1], 1); strawHat(u, sw); pop();
  }
  pop();

  V.arms.filter(a => a[3] === 1).forEach(arm);
  rs('draw'); if (o.draw) o.draw(u, sw);
  pop();

  rs('emote');
  if (o.emote) {
    const dir = o.flip ? -1 : 1, top = EMOTE_TOP.includes(o.emote);
    emote(o.emote, x + dir * (top ? 0 : 4.3) * u, y + dy - (top ? 14.2 : 12) * u * (1 - sq), u * .8, o.emoteK ?? 1, o.emoteAge ?? T);
  }
  rs('after');
}

// ---------- face ----------
function caraEyes(u, o, sw, V) {
  const C = CARA, lx = (o.lookX || 0) * .28, ly = (o.lookY || 0) * .22, sqz = clamp(o.squint || 0);
  const blink = ['normal', 'look', 'wide', 'shine'].includes(o.eyes || 'normal') && ((T * .8 + (o.seed || 0) * 1.3) % 3.7) < .12;
  for (const [ex, ey, s] of V.eyes) {
    push(); translate(ex * u, ey * u); scale(s * V.lensX + (1 - V.lensX) * .6, s);
    const kind = sqz > .8 || blink ? 'closed' : o.eyes || 'normal';
    const line = (pts, w = 1) => inkLine(pts.map(([a, b]) => [a * u, b * u]), sw * w, C.ink, 'ink', .5);
    switch (kind) {
      case 'happy': line([[-.45, .2], [0, -.25], [.45, .2]], 1.1); break;                  // ∩ smiling eyes
      case 'closed': line([[-.45, 0], [0, .25], [.45, 0]], 1.1); break;                   // ∪ shut
      case 'wide':
        paint(ellPts(lx * u, ly * u, .44 * u, .58 * (1 - sqz) * u, 14), { wash: C.ink, ink: null });
        paint(ellPts((lx - .14) * u, (ly - .2) * u, .15 * u, .18 * u, 8), { wash: PAL.cream, ink: null });
        paint(ellPts((lx + .14) * u, (ly + .2) * u, .07 * u, .07 * u, 6), { wash: PAL.cream, ink: null });
        break;
      case 'shine':   // delighted: big glossy eyes with a star glint
        paint(ellPts(lx * u, ly * u, .42 * u, .54 * (1 - sqz) * u, 14), { wash: C.ink, ink: null });
        paint(starPts((lx - .1) * u, (ly - .15) * u, .24 * u, .4, 4), { wash: PAL.cream, ink: null });
        paint(ellPts((lx + .16) * u, (ly + .22) * u, .07 * u, .07 * u, 6), { wash: PAL.cream, ink: null });
        break;
      default:        // normal / look
        paint(ellPts(lx * u, ly * u, .33 * u, .44 * (1 - sqz) * u, 12), { wash: C.ink, ink: null });
        paint(ellPts((lx - .1) * u, (ly - .15) * u, .12 * u, .14 * u, 8), { wash: PAL.cream, ink: null });
    }
    pop();
  }
}
// Pink sunglasses: round frames with a pale pink tint, so her eyes still read through them (small children read faces).
function caraGlasses(u, o, sw, V) {
  const C = CARA, L = V.eyes.map(([ex, ey, s]) => [ex * u, ey * u, .98 * s * u]);
  for (const [ex, ey, r] of L) {
    paint(ellPts(ex, ey, r * V.lensX, r, 22), { wash: C.lens, washOp: 95, ink: C.frame, sw: sw * 1.5 });
    inkLine([[ex - r * .5 * V.lensX, ey - r * .15], [ex - r * .15 * V.lensX, ey - r * .55]], sw * .5, PAL.cream, 'inkfine', 0);   // glint
  }
  if (L.length > 1) inkLine([[L[0][0] + L[0][2] * V.lensX, L[0][1] - .1 * u], [(L[0][0] + L[1][0]) / 2, L[0][1] - .3 * u], [L[1][0] - L[1][2] * V.lensX, L[1][1] - .1 * u]], sw * 1.1, C.frame, 'ink', .5);
  const back = L[0];   // the arm runs back from the rearmost lens toward the ear
  if (V !== CARA_VIEWS.front) inkLine([[back[0] - back[2] * V.lensX, back[1] - .2 * u], [back[0] - (V === CARA_VIEWS.side ? 3.0 : 1.9) * u, back[1] - .45 * u]], sw * 1.1, C.frame, 'ink', 0);
  else for (const s of [-1, 1]) inkLine([[s * 2.25 * u, -8.9 * u], [s * 2.75 * u, -9.05 * u]], sw * 1.1, C.frame, 'ink', 0);
}
// Mouths: smile (closed, the resting face), grin, open (talking), openS (small open, talking), O (surprised), small, flat
function caraMouth(u, m, sw, mx, my, w = 1) {
  const C = CARA, P = pts => pts.map(([a, b]) => [(mx + a * w) * u, (my + b) * u]);
  const line = (pts, k = .8) => inkLine(P(pts), sw * k, C.ink, 'ink', .6);
  switch (m) {
    case 'grin':
      paint(P([[-.8, -.15], [.8, -.15], [.45, .45], [0, .6], [-.45, .45]]), { wash: C.mouth, ink: C.ink, sw: sw * .6, curv: .5 });
      paint(ellPts(mx * u, (my + .38) * u, .38 * w * u, .15 * u, 10), { wash: C.tongue, ink: null }); break;
    case 'open':
      paint(ellPts(mx * u, (my + .1) * u, .5 * w * u, .45 * u, 14), { wash: C.mouth, ink: C.ink, sw: sw * .6 });
      paint(ellPts(mx * u, (my + .32) * u, .3 * w * u, .14 * u, 10), { wash: C.tongue, ink: null }); break;
    case 'openS':
      paint(ellPts(mx * u, my * u, .38 * w * u, .24 * u, 12), { wash: C.mouth, ink: C.ink, sw: sw * .55 }); break;
    case 'O':
      paint(ellPts(mx * u, (my + .1) * u, .36 * w * u, .46 * u, 12), { wash: C.mouth, ink: C.ink, sw: sw * .6 }); break;
    case 'small': paint(ellPts(mx * u, my * u, .18 * w * u, .16 * u, 8), { wash: C.mouth, ink: null }); break;
    case 'flat': line([[-.4, 0], [.4, 0]]); break;
    default: line([[-.7, -.2], [0, .2], [.7, -.2]]);   // smile
  }
}
// The straw hat, drawn around the brim centre: brim, crown, a pink band and a little flower.
function strawHat(u, sw) {
  const C = CARA, P = pts => pts.map(([a, b]) => [a * u, b * u]);
  paint(ellPts(0, 0, 4.1 * u, .78 * u, 30, u * .03), { wash: C.straw, ink: C.ink, sw: sw * .9 });
  inkLine(P([[-3.3, .1], [0, .45], [3.3, .1]]), sw * .45, C.strawDk, 'inkfine', .5);   // woven rings
  inkLine(P([[-2.6, -.05], [0, .22], [2.6, -.05]]), sw * .4, C.strawDk, 'inkfine', .5);
  const crown = P([[-2.15, .05], [-2.05, -1.35], [-1.3, -1.9], [1.3, -1.9], [2.05, -1.35], [2.15, .05]]);
  paint(crown, { wash: C.straw, ink: C.ink, sw: sw * .9, curv: .4 });
  paint(ellPts(-.7 * u, -1.25 * u, .9 * u, .35 * u, 12), { fill: PAL.cream, fillOp: 90, bleed: .15, ink: null });
  paint(P([[-2.12, -.1], [2.12, -.1], [2.08, -.62], [-2.08, -.62]]), { wash: C.band, ink: C.ink, sw: sw * .6 });
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + .4; paint(ellPts((1.45 + Math.cos(a) * .32) * u, (-.4 + Math.sin(a) * .32) * u, .26 * u, .26 * u, 8), { wash: PAL.cream, ink: C.ink, sw: sw * .35 }); }
  paint(ellPts(1.45 * u, -.4 * u, .18 * u, .18 * u, 8), { wash: SOFT.flowerY, ink: null });
}

// ---------- poses ----------
// Each pose is a face AND a way of moving, gently locked to the beat. take = how big the reaction is on switching INTO
// it (kept soft for young viewers). fade = the emote is a one-off that fades.
const _cb = t => { const bp = bpOf(t), s1 = Math.sin(bp * Math.PI); return { bp, s1, ab: Math.abs(s1), hit: pulse(t, 5), s2: Math.sin(bp * TAU) }; };
const CARA_POSES = {
  idle:      { eyes: 'normal', mouth: 'smile', blush: .35, take: .25, body: t => { const b = _cb(t), br = Math.sin(t * TAU * .4); return { dy: -.12 * b.ab, sq: .02 * br, aL: -1.12 + .04 * br, aR: -1.08 - .04 * br, bL: .15, bR: .2 }; } },
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
