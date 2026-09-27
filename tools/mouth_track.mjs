// mouth_track.mjs: turn a voiceover (e.g. an ElevenLabs MP3 of Cara's lines) into a mouth track for talk().
//
//   node tools/mouth_track.mjs assets/audio/ep01-cara.mp3 [--name=ep01-cara] [--at=0] [--fps=30]
//
// It measures how loud the voice is in every video frame and writes src/audio/<name>.mouth.js, one digit per frame
// (0 = closed … 9 = wide open). Add that file to studio.html before your scene, then in the scene:
//   cara(x, y, u, mixPose(caraActs(t, keys), talk(t, 'ep01-cara')))
// --at is where the clip starts in the video, in seconds (the same as its `at` in PROJECT.audio).
// Use a voice-only track: music under the voice would keep her mouth moving.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const file = process.argv.slice(2).find(a => !a.startsWith('--'));
if (!file || !existsSync(file)) { console.error('usage: node tools/mouth_track.mjs <audio file> [--name=x] [--at=0] [--fps=30]'); process.exit(1); }
const CFG = new Function(readFileSync('src/config.js', 'utf8') + '\nreturn PROJECT;')();
const fps = +(args.fps || CFG.fps || 30), rate = 16000, name = args.name || basename(file, extname(file)), at = +(args.at || 0);

// decode to mono 16-bit PCM with ffmpeg
const pcm = await new Promise((ok, bad) => {
  const p = spawn('ffmpeg', ['-loglevel', 'error', '-i', file, '-ac', '1', '-ar', String(rate), '-f', 's16le', '-']), chunks = [];
  p.stdout.on('data', c => chunks.push(c)); p.stderr.pipe(process.stderr);
  p.on('close', c => c ? bad(new Error('ffmpeg exited ' + c)) : ok(Buffer.concat(chunks)));
});
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1), per = rate / fps;

// loudness (RMS) per frame, normalised to the loud end of the clip so quiet and loud recordings both work
const rms = [];
for (let f = 0; f * per < samples.length; f++) {
  let s = 0, n = 0; for (let i = Math.floor(f * per); i < Math.min(samples.length, Math.floor((f + 1) * per)); i++, n++) s += (samples[i] / 32768) ** 2;
  rms.push(Math.sqrt(s / Math.max(1, n)));
}
const loud = rms.slice().sort((a, b) => a - b)[Math.floor(rms.length * .95)] || 1, gate = loud * .12;
let v = rms.map(r => r < gate ? 0 : Math.min(9, Math.round(9 * (r - gate) / (loud - gate))));
// no single-frame flickers: a mouth shape holds for at least two frames
v = v.map((x, i) => (i > 0 && i < v.length - 1 && v[i - 1] === v[i + 1] && x !== v[i - 1]) ? v[i - 1] : x);

mkdirSync('src/audio', { recursive: true });
const out = `src/audio/${name}.mouth.js`;
writeFileSync(out, `// Mouth track for talk(t, '${name}'), made by tools/mouth_track.mjs from ${file}. One digit per frame, 0 closed … 9 open.\n` +
  `MOUTH['${name}'] = { fps: ${fps}, at: ${at}, v: '${v.join('')}' };\n`);
console.log(`${out}: ${v.length} frames (${(v.length / fps).toFixed(1)} s), talking in ${v.filter(x => x > 0).length}`);
console.log(`add <script src="${out}"></script> to studio.html before your scene, then use talk(t, '${name}')`);
