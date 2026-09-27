# Cara in Wales (test scene): storyboard

20 seconds, 30 fps, 1920×1080 with a 1080×1920 Shorts version. Silent for now; the voiceover slot is described at the end.

```
Logline:  Cara wants to explore Wales, but something is hiding behind a rock on the hillside, so she makes a new
          friend: a little Welsh dragon who waves hello.
World:    a Welsh valley on a bright spring morning. Soft green hills, a pale lilac mountain, a white cottage with a
          slate roof, dry-stone walls, three sheep, daffodils along the path. SOFT palette (sky, grass, meadow, hillMid,
          hillFar, mountain, stone, path, flowerY). The sky warms a touch towards gold as the friendship lands.
Motif:    the puff of smoke. First a mystery (a round puff rising from behind the rock), then the payoff (Dewi puffs a
          pink heart at Cara). The iris opens on Cara arriving and closes on Cara waving: same place, happier.
Cara's arc:  happy (arriving) → curious → surprised (gently) → delighted → waving.
Dewi's arc:  hidden → peeking → pops up happy → waving → heart puff.
World layout (one continuous set; every shot is the same place with the camera moved):
          path along y≈940; Cara stops at x≈720. Hillside rises to the right; the rock sits on it at (1380, 600)
          and Dewi stands behind it, then on top of it at (1380, 525).
```

## Shots

```
A  0.0–7.6   [in: an iris opens from paper, centred where Cara will walk in]
   Wide on the valley. Cara walks in from the left along the path, stops, is delighted to be here, then notices
   something up the hill. EVENT: she arrives, then something catches her eye.
   Camera: wide (zoom 1), drifting gently right with her; from 6.9 it starts gliding up the hillside to the rock.
   reads:  0.0–1.2  the place: green Welsh hills, mountain, cottage, sheep (the iris opens, nothing else moves much)
           1.2–4.4  Cara walks in from the left, hat bobbing (the only big mover, so the eye finds her)
           4.4–5.0  she stops and turns to face us
           5.0–6.3  she's happy to be here: happy face, little bounce, says "Wales!" (talk 5.2–6.0)
           6.3–7.6  she notices something: head tilt, "?" pops, she looks up and to the right, and the camera
                    follows her look (the eye goes where she looks)

B  7.6–13.6  [transition: the camera move from A carries straight through, no cut]
   Close on the hillside and the big rock. Something behind it wobbles it, puffs smoke, peeks, then pops up: a small
   red Welsh dragon, smiling. He waves. EVENT: the hidden thing is revealed as a friend.
   Camera: settles at zoom 2 on the rock by 8.6, then a very slow push in.
   reads:  7.6–8.6   the rock on the hillside, a sheep grazing beside it (hold: let the eye arrive)
           8.6–9.6   the rock wobbles twice (the sheep looks up at it)
           9.6–10.6  a round puff of smoke floats up from behind it
           10.6–11.6 horns, then two big friendly eyes peek over the top, blink, look left towards Cara
           11.6–12.3 anticipation dip, then he hops up onto the rock and lands with a squash: a little dragon!
           12.3–13.6 he waves at Cara (off-screen left), wings fluttering, tail wagging
   [transition out: the camera pulls back continuously into C]

C  13.6–20.0 [in: the continuing pull-back from B]
   Two-shot: Cara in the foreground on the left, Dewi on his rock up the hill on the right. She sees him, is
   surprised, then delighted, and waves back. He hops for joy and puffs a pink heart. EVENT: the wave is answered.
   Camera: pulls back and down to the two-shot (13.6–14.8), then a slow drift in.
   reads:  13.6–14.8 both of them in one frame; Dewi still waving (the eye moves from him down to her)
           14.8–15.6 Cara's reaction: a gentle surprised take and a "!" (cause first, then reaction)
           15.6–16.3 surprise melts into delight
           16.3–18.0 she waves back and says "Helo!" (talk 16.4–17.1); Dewi hops for joy (17.2–17.7)
           18.0–18.9 Dewi puffs a pink heart; it floats up (the motif pays off; Cara just watches it, happy)
           18.9–20.0 the iris closes on Cara, holds a moment on her waving, and shuts by 19.95
   [transition out: iris to paper]
```

## Checks

- An event in every shot: arrives and notices (A), the reveal (B), the wave is answered (C).
- One read at a time: in B nothing else moves while each clue lands; in C, Cara reacts only after the two-shot has
  settled, and the heart puff has the screen to itself before the iris.
- Transitions at every seam: iris in, a continuous camera move A→B and B→C, iris out. No hard cuts.
- No text anywhere. The "!" and "?" are painted emotes; the lines are for the voiceover, not the screen.
- The ending rhymes with the opening: the iris opens on Cara arriving and closes on Cara waving, happier.
- Child-safe pacing: slow camera moves only, no flashes, no shake. The dragon's reveal is built up over three gentle
  clues and he is smiling from the first peek, so it reads as a friend, not a fright.

## Voiceover slot (for the ElevenLabs audio later)

The scene's `LINES` constant holds placeholder talking spans, `[[5.2, 6.0], [16.4, 17.1]]` ("Wales!" and "Helo!").
When the real audio exists: put it in `assets/audio/`, set `PROJECT.audio`, run `tools/mouth_track.mjs` on Cara's
voice track, and swap `LINES` for the track's name, so her mouth follows the real recording (see README.md, "Audio").
