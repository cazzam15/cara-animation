// sheets.js: model sheets for the cast, as standalone loops. They're reference for you (and the model), not part of a
// video, so they're the one place labels are fine. Scrub them at studio.html?loop=cara or ?loop=dragon, or render:
//   node render.mjs --loop=cara --sheet=1 --cols=1 --w=1920 --out=docs/cara_poses.jpg
(() => {
  const label = (txt, x, y, size = 22) => letter(txt, x, y, size, PAL.ink, { ink: false, alpha: .8 });
  const floor = (y, x0 = 0, x1 = W) => inkLine([[x0 + 40, y + 6], [W / 2, y + 4], [x1 - 40, y + 7]], .6, mixCol(PAL.paper, PAL.ink, .35), 'inkfine', .5);

  // Cara: the three key views, then every pose (walk, wave, happy jump, surprised, talking...), all alive.
  LOOPS.cara = t => {
    const u = 23, y1 = 470;
    [['front', {}], ['q (3/4)', { view: 'q' }], ['side', { view: 'side' }], ['q, flipped', { view: 'q', flip: true }]].forEach(([name, v], i) => {
      const x = 330 + i * 420; cara(x, y1, u, { ...caraPose('idle', t, { seed: i }), ...v }); label(name, x, y1 + 40);
    });
    floor(y1);
    const y2 = 1000, u2 = 19, k = t % 2;
    const row = [
      ['idle', x => cara(x, y2, u2, caraPose('idle', t))],
      ['walk', x => { const w = caraWalk(t, -1, 99, 0, 3.2 * u2 * 1.2 * 100, u2); cara(x, y2, u2, { ...caraPose('idle', t), ...w, x: undefined }); }],
      ['wave', x => cara(x, y2, u2, caraPose('wave', t))],
      ['happy jump', x => cara(x, y2, u2, mixPose(caraPose('happy', t), caraHop(k, .4, 1.05, 2.4)))],
      ['surprised', x => cara(x, y2, u2, caraActs(k, [[0, 'idle'], [.5, 'surprised']]))],
      ['talking', x => cara(x, y2, u2, mixPose(caraPose('talk', t), talk(t, [[0, 99]])))],
      ['curious', x => cara(x, y2, u2, caraPose('curious', t))],
    ];
    row.forEach(([name, f], i) => { const x = 150 + i * 270; f(x); label(name, x, y2 + 36); });
    floor(y2);
  };
  LOOPS.cara.len = 4;
})();

// Dewi the Welsh dragon: looks, face turns, the wave, a hop and the smoke puffs.
LOOPS.dragon = t => {
  const y = 700, u = 34;
  [['front', {}], ['turn left', { turn: -1, lookX: -1 }], ['wave', { eyes: 'happy', mouth: 'grin', aR: 1.2 + .4 * Math.sin(t * TAU * 1.6), flap: .6 + .4 * Math.sin(t * TAU * 1.6) }],
   ['hop', { ...jump(t % 1.6, .5, 1.05, 2.5), eyes: 'happy', mouth: 'open', aL: .6, aR: .6 }], ['peek', { eyes: 'wide', lookX: -.6, mouth: 'O' }]].forEach(([name, v], i) => {
    const x = 220 + i * 370; dragon(x, y, u, { wag: Math.sin(t * 3 + i), ...v });
    letter(name, x, y + 50, 24, PAL.ink, { ink: false, alpha: .8 });
  });
  puff(1500, 300, 40, (t % 2) / 2); puff(1700, 300, 40, (t % 2) / 2, { heart: true });
};
LOOPS.dragon.len = 4;
