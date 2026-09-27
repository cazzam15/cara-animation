// config.js: project settings.
//   name:     the episode's file name: renders go to out/<name>.mp4 and out/<name>-vertical.mp4.
//   duration: the video's length in seconds.
//   fps:      frames per second (30 for YouTube).
//   bpm:      the gentle pulse that idles, bobs and pulse() follow. If there's music, set this to the song's tempo, and set
//             offset to the time in seconds of its first downbeat.
//   audio:    null for a silent render, a path ('assets/audio/ep01.mp3'), or a list of tracks mixed together:
//             [{ src: 'assets/audio/ep01-vo.mp3', at: 0.5 }, { src: 'assets/audio/theme.mp3', gain: 0.35 }]
//             (at = start time in the video in seconds, gain = volume). See "Audio" in README.md.
const PROJECT = { name: 'cara-wales-test', duration: 20, fps: 30, bpm: 90, offset: 0, audio: null };
