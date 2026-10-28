# Moony Journey

**An Adventure Beyond Earth** — a colorful browser game for young space explorers.

The Moon's navigation beacon has gone dark. Join Captain Nova and the witty ship AI, PIX, to uncover Commander Glitch's plan, bring back the moonlight, and find a safe way home.

## Play locally

Open this project folder in your editor, then open **index.html** with **Live Preview**. No terminal command, installation, account, build step, or backend is needed. Use the preview's web address rather than opening a `file://` URL so the browser can load the question bank and music.

The same files also work on an ordinary static web host, including GitHub Pages.

## The adventure

- Five chapters cover launch preparation, asteroid defense, ship repairs, alien drones, Commander Glitch's boss battle, and the Moon landing.
- Five short flight legs connect the chapters with radio calls, safe waypoint piloting, and route scans.
- Original local pixel art, animated spacecraft and effects, character dialogue, and a downloaded space-music loop bring the journey to life.
- A replaceable bank of **320 Grade 1 math questions** powers **49 correct-answer checks across 29 challenge objects**.
- Mouse and touch controls, responsive layouts, fullscreen, pause, reduced-motion support, and automatic saves keep the mission accessible.

A first journey is designed to take about **15 minutes**; reading and answer speed affect playtime.

## Controls and rules

1. Choose **New game** or **Continue game**. The mission enters fullscreen where supported; the header control switches back. Embedded previews expand within the preview if fullscreen is unavailable.
2. Tap a glowing system, asteroid, or enemy once to begin its task. Some tasks need one answer; others present several questions consecutively. The radio needs one check, while engine ignition needs two.
3. Choose one of four answers within **30 seconds**. Correct answers power an action. Continue through the same task's next question without selecting its object again.
4. A wrong answer or timeout costs **one heart**. Continue with a fresh question for that task while hearts remain. Three mistakes fail the round; **Retry round** restores three hearts and preserves your question history.
5. Repair tasks finish with three highlighted connections. Flight legs use the radio, waypoint, and scan controls without a question timer or heart penalty.

Each new round restores three hearts. The boss fight and landing share the final round's hearts. Use **Pause** or **Escape** to take a break; inactive browser tabs pause the mission. Dialogue's **Show message**, **Next**, and **Skip transmission** controls let you set the reading pace.

## Music and audio

Open **Audio settings** in the header, **Music & sound** on the main menu, or **Music & sound settings** while paused. The master volume and master mute control every sound, with separate controls for music, action effects, and character voices.

| Default control | Volume |
| --- | ---: |
| Master | 80% |
| Music | 40% |
| Sound effects | 65% |
| Character voices | 75% |

Choose **Quiet**, **Balanced**, or **Cinematic**, or adjust each slider. Sliders give finer control at quieter levels. **Test** previews a channel, and **Restore defaults** restores the balanced mix. Existing audio preferences are preserved and new choices are remembered. Music softens during questions and dialogue and pauses with the mission.

The locally stored **Outer Space Loop** MP3 plays without contacting an external music service. Short effects, scene ambience, and talking sounds are synthesized with the Web Audio API after a player interaction.

## Saves and questions

Progress, flight steps, displayed question IDs, statistics, and audio preferences use the browser's `localStorage`. Continue in the same browser and at the same site address. Clearing site data or changing the preview address can make a save unavailable.

Questions never repeat during a journey, including after failed attempts, round retries, and saved-game resumes. Interrupted questions resume from a safe checkpoint and remain marked as seen. **New game** starts fresh. An exhausted bank shows recovery options instead of repeating questions.

Replace the `questions` array in `questions.json` using this format:

```json
{
  "questions": [
    {
      "id": 1,
      "question": "What is 3 + 4?",
      "answers": ["5", "6", "7", "8"],
      "correctAnswer": 2,
      "explanation": "Three plus four makes seven."
    }
  ]
}
```

Each question needs a unique ID, nonempty text, four distinct nonempty answer strings, and a zero-based `correctAnswer` index from 0 to 3. `explanation` is optional. Include at least 120 questions for the repository checks, keep IDs stable for existing saves, and verify replacement questions' answers. Questions are independent of the scene and require no gameplay-code changes.

## GitHub and optional publishing

Upload or push this folder to your own GitHub repository. The **Validate game** workflow checks pushes and pull requests; it can also be run manually in **Actions**. It checks JavaScript syntax, the question schema, the three primary code files, local asset paths with exact letter case, and the downloaded music file. Node.js is used by CI only and is not needed to play.

Publishing is manual:

1. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
2. Open **Actions → Publish GitHub Pages → Run workflow** on the branch you want to publish.
3. The workflow validates the game, packages only its static game files and assets, and publishes through the `github-pages` environment. Its run displays the resulting site address.

Pushes do not publish the game automatically. Repository environment rules may require review before deployment. The workflow follows [GitHub's Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and uses official GitHub actions.

## Project structure

```text
Moony-Journey/
├── index.html
├── style.css
├── script.js
├── questions.json
├── README.md
├── .gitignore
├── .gitattributes
├── .nojekyll
├── .github/workflows/
│   ├── validate.yml
│   └── pages.yml
└── assets/
    ├── audio/          Downloaded MP3 and credits
    ├── backgrounds/
    ├── characters/
    ├── spaceship/
    ├── enemies/
    ├── effects/
    └── ui/
```

The game keeps exactly three primary code files and has no runtime dependencies. Text files use LF line endings; audio files are stored as binary. The 1.6 MB MP3 can be tracked normally without Git LFS.

## Validation

The latest Chromium checks passed for the master slider, perceptual volume response, exact zero/mute, channel balance, all three presets, saved preferences and legacy-setting migration, question/timer restoration, and phone/tablet layouts. The game and its media also loaded correctly under a GitHub Pages-style project subfolder URL. The exact inline CI validator passed locally for 320 questions and 15 referenced assets.

Chromium browser checks have completed the full journey and covered consecutive questions, repairs, flight controls, the boss, landing, retries, no-repeat question history, save recovery, fullscreen, and responsive layouts. Audio checks covered the downloaded loop, voices, channel previews, mute behavior, and saved preferences. The question bank passed arithmetic and schema checks.

Safari, Firefox, and physical touch devices have not been tested. The 15-minute duration is a pacing target rather than a timed user-study result. The GitHub workflows must run in the destination repository to verify its Actions and Pages settings.

## Credits

**Outer Space Loop** by **wipics** is released under **CC0 1.0 Universal**. The unmodified downloaded file, source, and license details are recorded in [assets/audio/CREDITS.md](assets/audio/CREDITS.md). All game graphics are original local artwork.

The repository does not yet declare a license for the game code or original artwork; that choice belongs to the project owner.
