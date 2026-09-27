// dragon.js: Dewi, a small, friendly Welsh dragon (the red dragon of the Welsh flag, made round and cuddly). About 5u
// wide and 8.5u tall. (x, y) is the ground point between the feet; u is the size unit, as for cara().
//
// Body-local coordinates (front view, in u): feet y 0; tummy centre (0, -2.9); head centre (0, -6.4); eyes (±.95, -6.7);
// snout (0, -5.7); horns at (±1.2, -8.2); wings from the shoulders (±1.5, -4.2); the tail curls out to screen-right.
//
// Options: dx, dy, sq, rot, flip, aL / aR (arm angles as for cara), eyes (normal, happy, wide, closed),
//          mouth (smile, grin, open, O), lookX / lookY, turn (-1..1: slides the face toward a side, a drawn 3/4 look),
//          flap (0..1 wing spread), wag (tail swing, -1..1), blush, seed, noShadow, emote / emoteK / emoteAge, boilKey
const DEWI = {
  red: '#E4574F', redDk: '#B93E3E', redLt: '#F38A78', belly: '#FFE3BA', wing: '#F59A86', wingDk: '#D9665C',
  horn: '#FFF1D6', ink: '#3A2E3A', cheek: '#FFB0B8', mouth: '#5A2A33', tongue: '#F48FA0',
};
let DEWI_N = 0;
function dragon(x, y, u, o = {}) {
  const id = o.boilKey ?? 'd' + (++DEWI_N), rs = part => boilSeed(`dewi ${id} ${part}`), C = DEWI;
  x += (o.dx || 0) * u;
  const dy = (o.dy || 0) * u, sq = o.sq || 0, sw = clamp(u / 16, .35, 2) * .85, J = u * .05, tr = clamp(o.turn || 0, -1, 1);
  const P = pts => pts.map(([a, b]) => [a * u, b * u]);

  rs('shadow');
  if (!o.noShadow) paint(ellPts(x, y + u * .1, u * 2.8, u * .55, 20), { fill: C.ink, fillOp: 60, bleed: .2, tex: .3, border: .1, ink: null });

  push(); translate(x, y + dy); if (o.rot) rotate(o.rot); scale((o.flip ? -1 : 1) * (1 + sq * .5), 1 - sq);

  // tail: one tapered ribbon curling out and up, with the Welsh dragon's arrowhead tip, wagging
  rs('tail');
  const wg = o.wag || 0, tail = [[1.2, -1.2], [2.9, -1.0 + .2 * wg], [4.1, -1.9 + .3 * wg], [4.5 + .5 * wg, -3.3], [4.0 + .9 * wg, -4.3]];
  paint(ribbon(P(tail), .95 * u, .3 * u), { wash: C.red, ink: C.ink, sw: sw * .8 });
  const [tx, ty] = tail[4], [px, py] = tail[3], ang = Math.atan2(ty - py, tx - px);
  push(); translate(tx * u, ty * u); rotate(ang);
  paint(P([[-.1, 0], [-.35, -.55], [.75, 0], [-.35, .55]]), { wash: C.redDk, ink: C.ink, sw: sw * .7 });
  pop();

  // wings behind the body: little bat wings that flap
  rs('wings');
  const fl = o.flap ?? .3;
  for (const s of [-1, 1]) {
    push(); translate(s * 1.4 * u, -4.3 * u); rotate(s * (-.25 - .55 * fl)); scale(s, 1);
    const wpts = P([[0, 0], [.6, -1.9], [1.9, -2.7], [2.2, -1.9], [2.85, -1.55], [2.3, -.9], [2.6, -.3], [1.2, .15]]);
    paint(wpts, { wash: C.wing, ink: C.ink, sw: sw * .75, curv: .2 });
    for (const [a, b] of [[[.3, -.3], [1.9, -2.6]], [[.4, -.1], [2.7, -1.5]]]) inkLine(P([a, b]), sw * .45, C.wingDk, 'inkfine', .3);
    pop();
  }

  // legs
  for (const s of [-1, 1]) {
    rs('leg' + s);
    paint(rrPts((s * 1.05 - .6) * u, -1.4 * u, 1.2 * u, 1.45 * u, .5 * u, J * .3), { wash: C.redDk, ink: C.ink, sw: sw * .8 });
    for (const k of [-1, 0, 1]) paint(ellPts((s * 1.05 + k * .33) * u, -.08 * u, .12 * u, .1 * u, 6), { wash: C.horn, ink: null });   // claws
  }

  // body and tummy
  rs('body');
  const body = ellPts(0, -2.9 * u, 2.2 * u, 2.25 * u, 28, J);
  paint(body, { wash: C.red, ink: null });
  paint(ellPts(-.8 * u, -3.8 * u, .9 * u, .6 * u, 12, 0, -.4), { fill: C.redLt, fillOp: 90, bleed: .15, ink: null });
  paint(ellPts(.1 * tr * u, -2.6 * u, 1.35 * u, 1.65 * u, 22, J * .5), { wash: C.belly, ink: C.ink, sw: sw * .5 });
  for (let i = 0; i < 3; i++) { const yy = -3.4 + i * .65, w = 1.05 - Math.abs(i - 1) * .12; inkLine(P([[.1 * tr - w, yy], [.1 * tr, yy + .15], [.1 * tr + w, yy]]), sw * .4, mixCol(C.belly, C.redDk, .5), 'inkfine', .5); }
  paint(body, { ink: C.ink, sw });

  // head: round, with little horns and a crest of soft spikes, big friendly eyes and a round snout
  rs('head');
  push(); translate(0, (o.headDy || 0) * u);
  for (const s of [-1, 1]) paint(P([[s * .8, -7.8], [s * 1.45, -9.1], [s * 1.55, -7.5]]), { wash: C.horn, ink: C.ink, sw: sw * .7, curv: .3 });
  for (const [cx, h] of [[-.55, .75], [.05, .95], [.65, .75]]) paint(P([[cx - .32, -8.1], [cx + tr * .1, -8.1 - h], [cx + .32, -8.1]]), { wash: C.redDk, ink: C.ink, sw: sw * .6 });
  const head = ellPts(0, -6.35 * u, 2.3 * u, 1.95 * u, 30, J);
  paint(head, { wash: C.red, ink: null });
  paint(ellPts(-.7 * u, -7.4 * u, 1.1 * u, .55 * u, 12, 0, -.2), { fill: C.redLt, fillOp: 100, bleed: .15, ink: null });
  const fx = tr * .5;   // the face slides toward where it's looking (a drawn 3/4)
  paint(ellPts(fx * 1.2 * u, -5.55 * u, 1.35 * u, .95 * u, 20, J * .3), { wash: C.redLt, ink: null });
  paint(head, { ink: C.ink, sw });
  for (const s of [-1, 1]) paint(ellPts((fx * 1.25 + s * .45) * u, -5.8 * u, .13 * u, .1 * u, 6), { wash: C.redDk, ink: null });   // nostrils
  const bl = clamp(o.blush ?? .6);
  for (const s of [-1, 1]) paint(ellPts((fx + s * 1.55) * u, -5.9 * u, .45 * u, .26 * u, 10), { fill: C.cheek, fillOp: 90 + 110 * bl, bleed: .2, ink: null });
  // mouth
  rs('mouth');
  const mx = fx * 1.2, m = o.mouth || 'smile', line = (pts, k = .8) => inkLine(P(pts), sw * k, C.ink, 'ink', .6);
  if (m === 'grin' || m === 'open') {
    paint(P([[mx - .75, -5.35], [mx + .75, -5.35], [mx + .4, -4.85], [mx, -4.7], [mx - .4, -4.85]]), { wash: C.mouth, ink: C.ink, sw: sw * .6, curv: .5 });
    paint(ellPts(mx * u, -4.9 * u, .35 * u, .13 * u, 8), { wash: C.tongue, ink: null });
  } else if (m === 'O') paint(ellPts(mx * u, -5.05 * u, .3 * u, .36 * u, 10), { wash: C.mouth, ink: C.ink, sw: sw * .6 });
  else line([[mx - .65, -5.3], [mx, -4.95], [mx + .65, -5.3]]);
  // eyes
  rs('eyes');
  const lx = (o.lookX || 0) * .25, ly = (o.lookY || 0) * .2;
  const blink = (o.eyes || 'normal') === 'normal' && ((T * .7 + (o.seed || 3) * 1.1) % 3.1) < .12;
  for (const s of [-1, 1]) {
    const ex = fx + s * .95 * (1 - Math.abs(tr) * .15 * (s === Math.sign(tr) ? -1 : 1)), ey = -6.75, sc = 1 - .15 * Math.abs(tr) * (s === -Math.sign(tr) ? 1 : 0);
    push(); translate(ex * u, ey * u); scale(sc, 1);
    const e = blink ? 'closed' : o.eyes || 'normal', el = pts => inkLine(pts.map(([a, b]) => [a * u, b * u]), sw * 1.1, C.ink, 'ink', .5);
    if (e === 'happy') el([[-.45, .2], [0, -.25], [.45, .2]]);
    else if (e === 'closed') el([[-.45, 0], [0, .25], [.45, 0]]);
    else {
      const r = e === 'wide' ? 1.15 : 1;
      paint(ellPts(0, 0, .5 * r * u, .62 * r * u, 16), { wash: PAL.cream, ink: C.ink, sw: sw * .6 });
      paint(ellPts(lx * u, (ly + .08) * u, .32 * r * u, .42 * r * u, 12), { wash: C.ink, ink: null });
      paint(ellPts((lx - .1) * u, (ly - .1) * u, .12 * u, .14 * u, 8), { wash: PAL.cream, ink: null });
    }
    pop();
  }
  pop();

  // arms: little stubby arms in front of the tummy
  for (const [s, a] of [[-1, o.aL ?? -.9], [1, o.aR ?? -.9]]) {
    rs('arm' + s);
    const x0 = s * 1.75 * u, y0 = -3.6 * u, L = 1.95 * u, ex = x0 + s * Math.cos(a) * L, ey = y0 - Math.sin(a) * L;
    paint(ribbon([[x0, y0], [(x0 + ex) / 2 + s * .1 * u, (y0 + ey) / 2 + .15 * u], [ex, ey]], .8 * u, .6 * u), { wash: C.red, ink: C.ink, sw: sw * .75 });
    paint(ellPts(ex, ey, .38 * u, .35 * u, 10), { wash: C.redDk, ink: C.ink, sw: sw * .6 });
  }
  pop();

  rs('emote');
  if (o.emote) emote(o.emote, x + (o.flip ? -1 : 1) * 3.2 * u, y + dy - 9.5 * u * (1 - sq), u * .75, o.emoteK ?? 1, o.emoteAge ?? T);
  rs('after');
}

// A soft, round puff of dragon smoke (never fire: this is a gentle show). k = 0..1 through its life: it pops up, drifts,
// grows and fades. heart: true makes it a heart-shaped puff (Dewi's way of saying "I like you").
function puff(x, y, r, k, o = {}) {
  if (k <= 0 || k >= 1) return;
  const g = backOut(clamp(k * 4)), fade = 1 - seg(k, .55, 1), rr = r * g * (1 + .5 * k), col = o.col || '#FBEFF2';
  const yy = y - k * (o.rise ?? r * 2.5), xx = x + Math.sin(k * 5) * r * .25;
  if (o.heart) { paint(heartPts(xx, yy, rr * 1.15), { wash: o.heartCol || '#F7A6BF', washOp: 255 * fade, ink: fade > .45 ? DEWI.ink : null, sw: .7 }); return; }
  const pts = []; for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, b = 1 + .18 * Math.abs(Math.sin(a * 2.5)); pts.push([xx + Math.cos(a) * rr * b, yy + Math.sin(a) * rr * .85 * b]); }
  paint(pts, { wash: col, washOp: 255 * fade, ink: fade > .45 ? DEWI.ink : null, sw: .6 });
}
