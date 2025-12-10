# UNBOUND SET // Boot Sequence + Hub

A cyber-terminal intro sequence that “boots” into an interactive personal hub for **UNBOUND SET // Kasi Ellis**. The experience simulates a system startup, fake calibration, and glitchy transport before docking into a multi-panel portfolio/homepage.

---

## 1. Project Overview

When a user lands on the page:

1. They see a **PRESS ANY KEY TO BOOT** gate overlay.  
2. On keypress, a terminal-style **boot sequence** runs with audio, progress bars, and a fake calibration routine.   
3. Depending on user input, the site either:
   - Skips straight to a **Status Update** screen, or  
   - Runs a full **Recalibration** sequence (jokes, cursor path, flashbang, etc.).
4. A **STATUS UPDATE** screen appears with fake machine info, then three columns of scrolling “UNBOUND SET” C++-style code. Eventually the terminal melts down into a glitchy transport + glyph flood.
5. The flood resolves into a **WELCOME / UNBOUND SET** title, then the interface slides into the main **Home Hub** with panels for **Home**, **About**, **For Fun**, and **Settings**.   

The hub layer includes a floating glyph background, multi-panel content, image gallery, game references, and theme presets with custom audio.   

---

## 2. File Structure

- **`index.html`**  
  - Declares audio elements (boot sounds, typing SFX, flash, hub music for each preset, glitch/error sounds).  
  - Contains the **boot gate** overlay, the **CRT terminal** container, and an empty `#home-root` div where the hub UI is injected by JavaScript.  
  - Loads `styles.css`, `boot-sequence.js`, `status-update.js`, and `home-page.js`.

- **`styles.css`**  
  - Global styling (VCR OSD Mono font, CRT text, caret, reduced-motion handling).  
  - Boot gate overlay, **transport banner**, **white flood**, and **main hub title** styles.
  - Full **home hub styling**: layered background, glyph animation, dark overlay, nav bar, hamburger menu, panel cards, photo gallery grid, responsive layout for mobile/tablet/desktop.   

- **`boot-sequence.js`**  
  - Core boot config (typing speeds, volumes, “last programmed” date detection from file headers).
  - Utility helpers: `sleep`, `typeText`, ellipsis typing, line creation, Y/N input handling, auto-scroll.   
  - **Boot flow**:  
    - “BOOT UP SEQUENCE … READY”  
    - `FIRMWARE` & `LATEST VERSION (dd.mm.yyyy)` based on most recently edited local file.  
    - `CALIBRATION RECENTLY UPDATED`  
    - Prompt: `PERFORM RECALIBRATION? (Y/N)` which branches to calibration or status page.   
  - **Calibration routine** (`runUserCalibration`): fake diagnostics (CPU, RAM, sketchy websites, personal files, search history, brightness test) with progress bars, fake cursor path, and flash overlay.   
  - Boot gate handler (`setupBootGate`) that:
    - Waits for any key, tries fullscreen,
    - Plays boot audio,
    - Shows a pre-boot caret,
    - Then kicks off `runBootSequence()`. 

- **`status-update.js`**  
  - Clears CRT and prints **STATUS UPDATE** with:
    - Fake MACHINE ID (mapped from browser + OS),
    - Random public-looking IP,
    - CURRENT OBJECTIVE: `GENERATE THE MAIN HUB`. 
  - Builds **three code columns** with scrolling C++-style “null_tunnel” / `UNBOUND SET` code, including simple syntax highlighting or plain-text mode depending on version.
  - Handles the **transport banner**:
    - `BEGINNING TRANSPORTATION` / `TRANSPORTING...` text, whoosh audio, dot animation.  
    - Glitch effect with scrambled characters and ghost echoes of the message.   
  - **Error / meltdown mode**:
    - Swaps to red `ERROR: TRANSPORT LINK DESTABILIZED` text.  
    - Spawns multiple on-screen “error ghost” messages and plays large/small error SFX.  
    - Performs a glyph flood (first black + glyphs, then full red/white transition) and finally displays a **WELCOME / UNBOUND SET** title overlay.  
    - After the title animation, dock the title, fade out the flood, remove the overlay, and call `initHomePage()` to build the hub.   

- **`home-page.js`**  
  - Exposes `window.initHomePage()` which:
    - Hides the CRT area once the hub activates.  
    - Marks `<body>` with `.home-active` and populates `#home-root` with:
      - A white background layer, glyph layer, dark overlay, and scrollable content wrapper.   
    - Builds nav with logo and **hamburger menu** for mobile, plus node buttons: Home, About, For Fun, Settings.  
    - Constructs individual **panels** using a `makePanel(id, title, bodyHtml)` helper, then appends them into a central `.home-panels` wrapper.   

  - **Home node**: lore logbook, design philosophy, and “what this hub is for” copy. 

  - **About node**: profile, capabilities, education, contact section (panels like “Profile”, “Capabilities”, etc.). 

  - **For Fun node**:
    - “Sandbox” panel describing the code/visual experiments.  
    - **Media panel** with a YouTube playlist embed (focus playlist).  
    - **Gaming node** listing influential games.  
    - **Photo gallery**: clickable thumbnails that open large images in new tabs (Terraria, Ultrakill, Deltarune, Hades II, Risk of Rain 2).   

  - **Settings node**:
    - **Display presets** for hub visuals:  
      - DEFAULT // WHITE NOISE  
      - V1 // THE WAR MACHINE  
      - DARK FOUNTAIN // DELTARUNE  
      - THE FORECAST // RISK OF RAIN  
      - HADES // PATH OF THE PRINCE   
    - `<select id="hub-theme-select">` that toggles CSS variables / classes via `applyHubTheme(...)`.  
    - A **Hub Music Volume** slider (`#home-volume-slider`) that updates a text value and sets the `home-theme` audio element volume via `setHomeThemeVolume`.   
    - Note: presets and volume are intended to be local to the browser session.

  - **Navigation + panel logic**:
    - `setActiveNode(nodeId)` marks the matching nav item as `.is-active` and toggles `.is-hidden` on panels.  
    - Hamburger button toggles visibility of the nav items container on small screens.   

  - **Footer**: “UNBOUND SET // PERSONAL HUB OF KASI ELLIS” with the current year injected at runtime. 

---

## 3. How to Run

1. Place all files and the `assets/` folder in the same directory.
2. Open **`index.html`** in a modern browser (Chrome, Edge, Firefox, Opera, Safari). 
3. Press any key to start the boot sequence.
4. When prompted `PERFORM RECALIBRATION? (Y/N)`:
   - Press **Y** for the full calibration gag, or  
   - Press **N** to skip straight to the status update and transport.
5. After the transport + glyph sequence, you’ll land in the hub. Use the top nav (or hamburger on mobile) to switch between **Home**, **About**, **For Fun**, and **Settings**.   

> **Note:** All audio requires user interaction due to browser autoplay rules. The boot gate keypress and pointer/keydown events unlock the typing SFX/audio pools. 

---

## 4. Controls & Interactions

- **Boot gate:** Press any key.
- **Recalibration prompt:** Press **Y** or **N** (keys only, not clicking).   
- **Calibration:** Just watch; cursor movement, flash, and bars are automated.
- **Hub navigation:**
  - Click node buttons (Home / About / For Fun / Settings).
  - On small screens, tap the hamburger icon to show/hide nav items.   
- **Settings:**
  - Change preset theme via dropdown.  
  - Adjust hub music volume via slider (0–100%).   
- **Gallery:** Click any thumbnail to open a full-size image in a new tab.  
- **Playlist:** Hit play inside the embedded YouTube playlist; hub music volume slider only affects the local `home-theme` audio, not YouTube. 

---

## 5. Responsive Design & Accessibility

- Uses **CSS media queries** to:
  - Switch nav into a stacked layout with a hamburger toggle on smaller viewports.
  - Keep panels at readable widths (max-width 960px) and adjust padding/gaps.   
- Honors `prefers-reduced-motion`:
  - Disables typing animations and per-char SFX when the user prefers reduced motion. 
- Maintains readable contrast (light panels on dark overlay or dark panels on light background depending on theme).   

---

## 6. Customization Notes

If you’re modifying the project:

- **Assets:**  
  - Replace audio files in `assets/` (boot, whoosh, typing, flash, error, hub themes) with your own while keeping IDs in `index.html`. 
- **Themes:**  
  - Update preset descriptions and color logic in `home-page.js` and associated CSS variables/classes in `styles.css`.   
- **Content:**  
  - Edit panel copy, gallery images, and game listings directly in `home-page.js` or refactor into separate HTML fragments if preferred.   
- **Boot / Status behavior:**  
  - Change calibration jokes, timings, or fake machine info in `boot-sequence.js` and `status-update.js`.   

---

## 7. Credits

- **Concept, writing, and hub content:** Kasi Ellis / UNBOUND SET. 
- **Code & design:** Single-page HTML/CSS/JS implementation using custom VCR OSD Mono aesthetic, glitch effects, and layered backgrounds.   

This README is meant to accompany the full project submission for the **UNBOUND SET** boot-sequence + hub website.
