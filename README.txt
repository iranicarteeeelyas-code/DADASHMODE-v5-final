═══════════════════════════════════════════════════════════════════
  DADASHMODE v5 Ultimate — Complete Professional Show Engine
═══════════════════════════════════════════════════════════════════

QUICK START:

1. ON COMPUTER (Local Server):
   
   python -m http.server 8000
   
   OR
   
   npx http-server . -p 8000 -c-1

2. ON PHONE:
   
   Open Chrome/Firefox/Samsung Internet
   Go to: http://<YOUR-COMPUTER-IP>:8000
   
   (Find your IP: ipconfig on Windows, ifconfig on Mac/Linux)

3. ADD TO HOME SCREEN (Optional PWA Install):
   
   Browser menu → Install / Add to Home Screen
   App now runs like a native app

═══════════════════════════════════════════════════════════════════

WHAT'S INSIDE:

✓ Phase 1: Persistent Memory (auto-save, backup, undo, recovery)
✓ Phase 2: Live Graphics (dynamic score banners, real winners)
✓ Phase 3: Director Assistant (shot lists, props checklist, HUD)
✓ Phase 4: Voice Capture (Gemini script, auto-segment, mapping)
✓ Phase 5: Cinematic Looks (5 styles, chroma keying, dual export)

ENTIRELY OFFLINE — No internet needed after loading

═══════════════════════════════════════════════════════════════════

WORKFLOW FOR SHOOTING AT LOCATIONS:

Before:
  1. Load your project (episodes.json)
  2. Create a backup
  3. Set Gemini API key (if voice capture)
  4. Test Director, Cinema exports

During:
  1. Open Director tab → auto-shot list
  2. Check props and cue sheet
  3. Record on phone camera
  4. Render as Chroma (for CapCut) + Full Screen
  5. Tap Memory button to backup

After:
  1. Move videos to computer
  2. In CapCut: composite chroma video over raw footage
  3. Layer full-screen renders as effects
  4. Edit and export

═══════════════════════════════════════════════════════════════════

FILE STRUCTURE:

index.html              — Main app entry point
manifest.webmanifest   — PWA configuration
sw.js                  — Service Worker (offline caching)

js/
  p345-core.js         — Shared core (persistence, UI)
  p3-director.js       — Director Assistant (shots, props)
  p4-voicecapture.js   — Voice capture & Gemini
  p5-cinema.js         — Cinematic looks & export
  p5-three.js          — 3D studio (includes three.js)

ANDROID_SETUP_FA.md    — Full setup guide in Persian
README.txt             — This file

═══════════════════════════════════════════════════════════════════

FEATURES AT A GLANCE:

PERSISTENCE (Phase 1):
  - Auto-save on every change
  - Undo/redo
  - 25-version history + daily snapshots
  - Full backup/restore
  - No data lost on crash

LIVE GRAPHICS (Phase 2):
  - 11 dynamic score banners (comebacks, streaks, time warnings, etc.)
  - Real winner detection (not fake)
  - Conditional dialogue (picks right "winner is X" audio)
  - Speed adjustable 0.25x–2x (gameplay stays real-time)

DIRECTOR ASSISTANT (Phase 3):
  - Auto-generate shot list from segment type/game/rules
  - Prop detection from keywords & rules
  - Live cue sheet (never recorded)
  - Printable call sheet for crew
  - Coverage report

VOICE CAPTURE (Phase 4):
  - Auto-silence detection (find segment boundaries)
  - Gemini script sheets (two modes)
  - Line-by-line recording + stitching
  - Session persistence (resume interrupted recording)
  - Auto-remap to correct segments
  - Manual fallback (record anything, map anywhere)

CINEMATIC LOOKS (Phase 5):
  - 5 professional styles (Cinema/Arena/Broadcast/Noir/Studio3D)
  - Auto-chroma detect (green/blue, clash detection)
  - Post-FX: camera motion, transitions, flare, grain, vignette, color grade
  - Dual output per take:
    • Chroma version (for CapCut green-screen composite)
    • Full-screen version (ready-to-broadcast animated)
  - 3D studio (three.js PBR, reflective floor, hero objects, bloom)

═══════════════════════════════════════════════════════════════════

TROUBLESHOOTING:

Q: Blank screen?
A: Open DevTools (F12 or Ctrl+Shift+I), check Console for errors.
   Reload page. Check browser version (Chrome 90+, Firefox 88+ required).

Q: No sound?
A: Phone muted? App blocked permissions? Voice segment recorded?
   Check Voice Tab → Playback. Rebuild audio if needed.

Q: Video won't export?
A: Storage permission granted? Enough space? Try different format.

Q: Gemini API failing?
A: Check key. If API rejects text, record manually instead.

Q: Wrong chroma color?
A: Cinema Settings → Override Chroma Color → pick manually.

═══════════════════════════════════════════════════════════════════

TECHNICAL SPECS:

Browser:        Chrome 90+, Firefox 88+, Samsung Internet 14+
Cache Size:     ~50 MB (includes three.js bundle)
Offline:        Entire app works without internet after first load
Storage:        IndexedDB (25 versions + daily snapshots)
Exports:        MP4 (H.264), WebM
Memory:         Works on 2GB+ devices

═══════════════════════════════════════════════════════════════════

For detailed Farsi setup guide, see: ANDROID_SETUP_FA.md

Build date: 2026-09-24
Version: v5 Ultimate (Phases 1-5 Complete)

═══════════════════════════════════════════════════════════════════
