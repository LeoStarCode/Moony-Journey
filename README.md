# Moony Journey

**An Adventure Beyond Earth** — a browser game for young space explorers.

The Moon's navigation beacon has gone dark. Join Captain Nova and the ship AI, PIX, to uncover Commander Glitch's plan, restore the moonlight, and find a safe way home.

## Run the game

Serve the project folder with any static web server. For example, if Python is installed, run this command from the project folder:

```sh
python -m http.server 8000
```

Open [localhost:8000](http://localhost:8000) in your browser. Opening `index.html` directly through a `file://` URL can prevent the question bank and music from loading.

The game also runs on static hosts such as GitHub Pages. It has no build step, package installation, backend, or runtime libraries.

## The adventure

- Five chapters cover launch preparation, asteroid defense, ship repairs, alien drones, and Commander Glitch's boss battle, followed by the Moon landing.
- Five flight legs connect the stages with radio calls, waypoint piloting, and route scans.
- **34 Artemis-themed questions** power **34 question checks across 29 challenge objects** in a complete journey without retries or interruptions.
- Local pixel art, animated spacecraft, character dialogue, music, and synthesized sound effects bring the mission to life.
- Mouse and touch controls, fullscreen, pause, reduced-motion support, and automatic saves are included.

A journey targets about **15 minutes**; reading and answer speed affect playtime.

## Controls and rules

1. Choose **New game** or **Continue game**. The mission enters fullscreen where supported. Use the header control to toggle fullscreen; a layout that fills the window is used when native fullscreen is unavailable.
2. Tap a glowing system, asteroid, or enemy to begin its task. Most tasks need one answer; the main challenge in each stage needs two checks. The boss needs three checks in total.
3. Choose one of four answers within **30 seconds**. Every answer completes a check. Multi-question tasks continue without selecting the object again.
4. A wrong answer or timeout costs **one heart** and still completes the check. Losing the last heart fails the round, even on its final check. **Retry round** restores three hearts and resets that round's objectives while keeping question history and statistics.
5. Repairs finish with three numbered connections. Flight legs use radio, waypoint, and scan controls without a question timer or heart penalty.

Each new round restores three hearts. The boss and landing share the final round's hearts; retrying that round returns to the boss. Use **Pause** or **Escape** to take a break. Switching to another browser tab pauses active gameplay. Dialogue has **Show message**, **Next**, and **Skip transmission** controls.

| Stage | Main challenge | Total question checks |
| --- | --- | ---: |
| Launch | Engine ignition: 2 checks | 6 |
| Asteroids | Iron giant: 2 checks | 7 |
| Repairs | Oxygen regulator: 2 checks | 5 |
| Drones | Final armored drone: 2 checks | 7 |
| Boss | Shield, weapons, and core: 1 check each | 3 |
| Landing | Final descent: 2 checks | 6 |

## Music and audio

Open **Audio settings** in the header or **Music & sound** in the menu. Master volume and mute control every sound, with separate music, sound-effect, and character-voice controls.

| Default control | Volume |
| --- | ---: |
| Master | 80% |
| Music | 40% |
| Sound effects | 65% |
| Character voices | 75% |

Choose **Quiet**, **Balanced**, or **Cinematic**, or adjust the sliders. Presets keep mute choices; **Restore defaults** enables every channel and restores the balanced mix. **Test** plays a channel or the complete mix. Audio preferences are saved automatically.

The local **Outer Space Loop** MP3 plays without an external music service. Music softens during questions and dialogue and pauses with the mission. Effects, ambience, and character talking sounds use the Web Audio API after a player interaction.

## Saves and questions

Progress, flight steps, question history, statistics, and audio preferences use browser `localStorage`. Continue in the same browser at the same site address. Clearing site data or changing the address or port can make an existing save unavailable. A new game replaces the saved mission.

Questions are chosen randomly without repeats within each pass through the bank. **After all 34 have been drawn, another randomized pass begins**, so retries and interrupted questions can eventually lead to repeats. Question history survives retries and saved-game resumes. An interrupted question is counted as drawn; continuing resumes from a safe checkpoint rather than restoring that question's timer.

To change the content, replace the `questions` array in `questions.json`:

```json
{
  "questions": [
    {
      "id": 1,
      "question": "What was the name of the spacecraft used in Artemis I?",
      "answers": ["Orion", "Apollo", "Voyager", "Hubble"],
      "correctAnswer": 0,
      "explanation": "Orion is the spacecraft that flew on Artemis I."
    }
  ]
}
```

Each question needs a unique nonempty string or finite numeric ID, nonempty text, four distinct nonempty answer strings, and a zero-based `correctAnswer` index from 0 to 3. `explanation` is optional. The repository validator requires **at least 34 questions**. Keep IDs stable for saved games, verify the answers, and start a new journey after changing the bank to begin a fresh question cycle.

## Validation and publishing

The **Validate game** GitHub Actions workflow runs on pushes and pull requests and can be run manually. It checks JavaScript syntax, question schema and minimum count, the three primary code files, local asset paths with exact letter case, and the music file. Node.js 24 is used by CI.

The **Publish GitHub Pages** workflow validates and deploys **automatically on pushes to `main`**. It can also be started manually:

1. In the repository's **Settings → Pages**, select **GitHub Actions** as the source.
2. Push to `main`, or select **Actions → Publish GitHub Pages → Run workflow** for the desired branch.
3. After validation, the workflow packages the static game files and assets and deploys through the `github-pages` environment. The deployment displays the site address.

Repository environment rules may require approval before deployment.

Browser checks cover a complete 34-check journey, deliberate wrong answers, timeouts, retries, save migration, boss health, pause behavior, and reduced motion. Desktop 1280 × 900 and phone 390 × 844 layouts were checked in Chromium without horizontal overflow or browser exceptions. Safari, Firefox, and physical touch devices have not been tested.

## Project structure

```text
Moony-Journey/
├── index.html              Page structure and controls
├── style.css               Responsive interface
├── script.js               Game, rendering, audio, and saves
├── questions.json          Artemis question bank
├── README.md
├── .nojekyll
├── .github/workflows/
│   ├── validate.yml
│   └── pages.yml
└── assets/
    ├── audio/              Local MP3 and credits
    ├── backgrounds/
    ├── characters/
    ├── spaceship/
    ├── enemies/
    ├── effects/
    └── ui/
```

Keep the three primary code files at the project root. Text files use LF line endings; audio files are stored as binary.

## Credits

**Outer Space Loop** by **wipics** is released under **CC0 1.0 Universal**. Source and license details are recorded in [assets/audio/CREDITS.md](assets/audio/CREDITS.md). All game graphics are original local artwork.

The repository does not yet declare a license for the game code or original artwork.
