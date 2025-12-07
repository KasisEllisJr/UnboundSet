// Override date used for "LAST PROGRAMMED" banner.
// If null, we auto-detect based on file last-modified dates.
const LAST_PROGRAMMED_RAW = null;

// Typing & animation speeds (in ms per character / step)
const TYPE_SPEED = 25;
const DOT_SPEED = 120;
const START_DELAY = 200;

// Global volumes for different sound effects
const TYPING_VOLUME = 0.25;
const FLASH_VOLUME = 0.18;
const BOOT_VOLUME = 0.3;
const WHOOSH_VOLUME = 0.35;

// Character-width scale used for progress bars in calibration
const CH_SCALE = 0.9375;

// Simple async sleep helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Format a given Date (or timestamp) as DD.MM.YYYY
function formatDateDDMMYYYY(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');

  // NOTE: Adds 200 to the year; this is intentionally lore-y (year 2225 etc)
  const yyyy = d.getFullYear() + 200;

  return `${dd}.${mm}.${yyyy}`;
}

// Perform a HEAD/GET request and read the "Last-Modified" header for a file
async function headLastModified(url) {
  try {
    let res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
    let lm = res.headers.get('last-modified');
    if (lm) return new Date(lm);

    // Fallback: GET if HEAD didn't return the header
    res = await fetch(url, { method: 'GET', cache: 'no-cache' });
    lm = res.headers.get('last-modified');
    if (lm) return new Date(lm);
  } catch (e) {}
  return null;
}

// Try to detect the "newest" edit date among document and key files
async function detectLatestEditedDate() {
  const candidates = [];

  // 1) Document itself
  if (document.lastModified) {
    const docDate = new Date(document.lastModified);
    if (!isNaN(+docDate)) candidates.push(docDate);
  }

  // 2) Core assets: CSS, boot JS, status JS
  const [cssDate, jsBoot, jsStatus, jsHome] = await Promise.all([
    headLastModified('styles.css'),
    headLastModified('boot-sequence.js'),
    headLastModified('status-update.js'),
    headLastModified('home-page.js'),
  ]);
  if (cssDate) candidates.push(cssDate);
  if (jsBoot) candidates.push(jsBoot);
  if (jsStatus) candidates.push(jsStatus);
  if (jsHome) candidates.push(jsHome);

  // 3) Pick the latest; fallback to "now" if nothing found
  if (candidates.length) {
    candidates.sort((a, b) => b - a);
    return candidates[0];
  }
  return new Date();
}

// Main helper to decide which date string to show as "LATEST VERSION"
async function resolveProgrammedDate() {
  if (LAST_PROGRAMMED_RAW) return formatDateDDMMYYYY(LAST_PROGRAMMED_RAW);
  const latest = await detectLatestEditedDate();
  return formatDateDDMMYYYY(latest);
}

// IDs of <audio> elements used for keyboard-click sounds
const TYPING_SOUND_IDS = [
  'type-sound-1',
  'type-sound-2',
  'type-sound-3',
  'type-sound-4',
];

let typingSoundEls = null;

// Grab and cache audio elements for typing sounds
function getTypingSounds() {
  if (!typingSoundEls) {
    typingSoundEls = TYPING_SOUND_IDS.map((id) =>
      document.getElementById(id)
    ).filter(Boolean);
  }
  return typingSoundEls;
}

// Unlock typing audio the first time the user clicks/taps or presses a key
window.addEventListener('pointerdown', unlockTypingAudioOnce, { once: true });
window.addEventListener('keydown', unlockTypingAudioOnce, { once: true });

// Attempt to "unlock" audio once by playing & pausing on first user interaction
// (needed because browsers block autoplay without user gesture)
function unlockTypingAudioOnce() {
  const pool = getTypingSounds();
  pool.forEach((a) => {
    try {
      a.play()
        .then(() => {
          a.pause();
          a.currentTime = 0;
        })
        .catch(() => {});
    } catch (_) {}
  });
}

// Play a random typing sound from the pool
function playTypingSound() {
  const pool = getTypingSounds();
  if (!pool.length) return;

  const i = Math.floor(Math.random() * pool.length);
  const audio = pool[i];
  if (!audio) return;

  try {
    audio.currentTime = 0;
    audio.volume = TYPING_VOLUME;
    audio.play().catch(() => {});
  } catch (_) {}
}

// Core typewriter routine used across boot / calibration / status
async function typeText(node, text, speed = TYPE_SPEED) {
  // Emit one character at a time with optional sound
  for (const ch of text) {
    node.appendChild(document.createTextNode(ch));

    if (ch.trim() !== '') {
      playTypingSound();
    }

    await sleep(speed);
  }
}

// Scrolls the screen down to keep a given element in view
function autoScroll(el) {
  try {
    // Smooth scroll in modern browsers
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    window.scrollBy({ top: 32, behavior: 'smooth' });
  } catch {
    // Fallback if scrollIntoView options are not supported
    const doc = document.documentElement;
    const body = document.body;
    const maxScroll = (doc.scrollHeight || body.scrollHeight) + 32;
    window.scrollTo({ top: maxScroll, behavior: 'smooth' });
  }
}

// Type a label, then animate "..." cycles after it (like "LOADING...")
// Used for BOOT UP SEQUENCE, FIRMWARE, CALIBRATION, etc.
async function typeWithEllipses(
  labelNode,
  baseText,
  { resetAfter = false } = {}
) {
  // Type the base text first
  await typeText(labelNode, baseText);

  // Run 3 cycles of dot animations
  for (let cycle = 0; cycle < 3; cycle++) {
  labelNode.textContent = baseText;

  // Add three dots with a fixed delay
  for (let i = 0; i < 3; i++) {
    labelNode.textContent += '.';
    await sleep(DOT_SPEED);
  }

  // Small pause before the next cycle
  await sleep(DOT_SPEED * 1.2);
}

  // Optionally reset the label back to the base text (no dots)
  if (resetAfter) {
    labelNode.textContent = baseText;
  }
}

// Create a new terminal-style line at the bottom of the CRT
function newLine(parent) {
  const line = document.createElement('div');
  line.className = 'line';
  parent.appendChild(line);
  autoScroll(line);
  return line;
}

// Insert a vertical gap between blocks of text
function gap(parent, h) {
  const el = document.createElement('div');
  el.className = 'gap';
  el.textContent = ' ';
  if (h) el.style.height = h;
  parent.appendChild(el);
  autoScroll(el);
  return el;
}

// Wait for a Y or N keypress, then resolve a Promise with "Y" or "N"
function waitForYN() {
  return new Promise((resolve) => {
    const crt = document.getElementById('crt') || document.body;

    // Create a blinking caret line to show we're waiting for input
    const caretLine = newLine(crt);
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.textContent = '';
    caret.style.color = '#FFFFFF';
    caretLine.appendChild(caret);
    autoScroll(caretLine);

    let done = false;

    // Key handler: watch for 'y' or 'n'
    function onKeyUp(e) {
      if (done) return;
      const k = (e.key || '').toLowerCase();
      if (k === 'y' || k === 'n') {
        done = true;
        window.removeEventListener('keyup', onKeyUp);
        caretLine.remove();
        resolve(k.toUpperCase());
      }
    }

    window.addEventListener('keyup', onKeyUp, { passive: true });
  });
}

// All the steps that happen once the boot gate is triggered
async function runBootSequence() {
  const screen = document.getElementById('screen');
  const crt = document.getElementById('crt');

  // Ensure window has focus for keyboard input right away
  window.focus();

  // Fade in the "screen" container after a brief delay
  await sleep(START_DELAY);
  screen.style.opacity = '1';

  // Initial line with a blinking caret before text appears
  const l1 = newLine(crt);
  const preBootCaret = document.createElement('span');
  preBootCaret.className = 'caret';
  preBootCaret.style.color = '#FFFFFF';
  l1.appendChild(preBootCaret);
  autoScroll(l1);
  await sleep(1500);
  preBootCaret.remove();

  // Show "BOOT UP SEQUENCE..." with animated dots
  await typeWithEllipses(l1, 'BOOT UP SEQUENCE', { resetAfter: true });

  // Then finalize that line as "BOOT UP SEQUENCE READY"
  l1.textContent = 'BOOT UP SEQUENCE ';
  await typeText(l1, 'READY');

  // FIRMWARE line and "LATEST VERSION (DATE)" read from files
  gap(crt);
  const l2 = newLine(crt);
  await typeWithEllipses(l2, 'FIRMWARE', { resetAfter: true });

  const resolvedDate = await resolveProgrammedDate();
  const l3 = newLine(crt);
  l3.classList.add('accent');
  await typeText(l3, ` LATEST VERSION (${resolvedDate})`);

  // CALIBRATION status block
  gap(crt);
  const lCal = newLine(crt);
  await typeWithEllipses(lCal, 'CALIBRATION', { resetAfter: true });

  const lRU = newLine(crt);
  lRU.classList.add('accent');
  await typeText(lRU, ' RECENTLY UPDATED');

  // Prompt user whether to run the fun calibration sequence
  gap(crt);
  const lQ = newLine(crt);
  await typeText(lQ, 'PERFORM RECALIBRATION?');

  const lYN = newLine(crt);
  await typeText(lYN, 'Y/N');

  // Wait for user pressing Y or N
  const choice = await waitForYN();

  gap(crt);
  if (choice === 'N') {
    // Skip calibration and jump straight into STATUS UPDATE sequence
    await showStatusPage();
  } else {
    // Run calibration routine if available
    if (window.runUserCalibration) {
      await window.runUserCalibration();
    }
  }
}

// Calibration routine: fake steps with animated bars, titles, and side effects
(function () {
  // Colors & constants for calibration bars
  const ACCENT = '#00FF41';
  const ERROR_RED = '#FF1744';
  const BAR_W = 28;          // width in "blocks" for progress bars
  const DURATION_MS = 1500;  // animation length
  const BLOCK = '█';

  // Local sleep to avoid clashing with global sleep name
  const sleepLocal = (ms) => new Promise((r) => setTimeout(r, ms));

  // Create a new "section" block for calibration logs
  function section(crt) {
    const s = document.createElement('div');
    s.className = 'section';
    s.style.margin = '14px 0';
    crt.appendChild(s);
    autoScroll(s);
    return s;
  }

  // Create a generic line inside a section, optionally with text & class
  function line(parent, text = '', className = '') {
    const el = document.createElement('div');
    if (className) el.className = className;
    if (text) el.appendChild(document.createTextNode(text));
    parent.appendChild(el);
    autoScroll(el);
    return el;
  }

  // Type a title line inside a section (large green/white text)
  async function typeTitle(container, text, color) {
    const el = line(container, '', 'title');
    el.style.marginBottom = '8px';
    if (color) el.style.color = color;

    // Try to reuse global typeText if available; fallback to a simple typer
    if (typeof window.typeText === 'function') {
      await window.typeText(el, text);
    } else {
      for (const ch of text) {
        el.appendChild(document.createTextNode(ch));
        await sleepLocal(18);
      }
    }
    autoScroll(el);
    return el;
  }

  // Type a subtext line (smaller text), with optional indent and color
  async function typeSub(container, text, color, indent = true) {
    const el = line(container, '', 'subtext');
    el.style.marginTop = '4px';
    el.style.color = color;

    const shifted = (indent ? ' ' : '') + text;

    if (typeof window.typeText === 'function') {
      await window.typeText(el, shifted);
    } else {
      for (const ch of shifted) {
        el.appendChild(document.createTextNode(ch));
        await sleepLocal(16);
      }
    }
    autoScroll(el);
    return el;
  }

  // Markup for the progress bar skeleton ( [████      ] )
  function barHTML() {
    return (
      `<span class="bar-bracket" style="color:#fff">[</span>` +
      `<span class="bar-track"><span class="bar-fill"></span><span class="bar-pad"></span></span>` +
      `<span class="bar-bracket" style="color:#fff">]</span>`
    );
  }

  // Ensure a given line has the inner pieces for animation (fill/pad)
  function ensureBarStructure(lineEl, widthCh, color) {
    if (!lineEl._barRefs) {
      lineEl.innerHTML = barHTML();
      const track = lineEl.querySelector('.bar-track');
      const fill = lineEl.querySelector('.bar-fill');
      const pad = lineEl.querySelector('.bar-pad');
      track.style.setProperty('--bar-w', widthCh * CH_SCALE);
      lineEl._barRefs = { track, fill, pad };
    }
    const { fill, pad } = lineEl._barRefs;
    fill.style.color = color;
    return lineEl._barRefs;
  }

  // Animate filling a bar from 0 -> finalCount blocks
  async function animateBar(lineEl, finalCount, color, totalMs) {
    const { fill, pad } = ensureBarStructure(lineEl, BAR_W, color);

    // Apply text + widths for current fill level
    const applyWidths = (n) => {
      const remaining = BAR_W - n;
      fill.textContent = BLOCK.repeat(n);
      fill.style.width = n * CH_SCALE + 'ch';

      if (remaining <= 0) {
        pad.style.width = '0';
        pad.style.display = 'none';
      } else {
        pad.style.display = 'inline-block';
        pad.style.width = remaining * CH_SCALE + 'ch';
      }
    };

    // Step-wise fill animation
    const steps = Math.max(1, finalCount);
    const stepDelay = Math.max(1, Math.floor(totalMs / steps));
    let filled = 0;
    while (filled < finalCount) {
      filled++;
      applyWidths(filled);
      autoScroll(lineEl);
      await sleepLocal(stepDelay);
    }
  }

  // Success bar: fill all the way across
  async function successBar(container) {
    const barLine = line(container, '', 'barline');
    barLine.style.marginBottom = '6px';
    await animateBar(barLine, BAR_W, ACCENT, DURATION_MS);
    return barLine;
  }

  // Error bar: partially fill in green, then flip color to ERROR_RED
  async function errorBar(container) {
    const barLine = line(container, '', 'barline');
    barLine.style.marginBottom = '6px';

    // Random "fail point" somewhere between 40%–60% of the bar
    const stopAt = Math.max(
      3,
      Math.min(BAR_W - 4, Math.floor(BAR_W * (0.4 + Math.random() * 0.2)))
    );
    await animateBar(barLine, stopAt, ACCENT, DURATION_MS);

    // Then recolor the filled part to red
    const { fill, pad } = ensureBarStructure(barLine, BAR_W, ERROR_RED);
    const remaining = BAR_W - stopAt;
    fill.textContent = BLOCK.repeat(stopAt);
    fill.style.width = stopAt * CH_SCALE + 'ch';
    fill.style.color = ERROR_RED;

    if (remaining <= 0) {
      pad.style.width = '0';
      pad.style.display = 'none';
    } else {
      pad.style.display = 'inline-block';
      pad.style.width = remaining * CH_SCALE + 'ch';
    }

    return barLine;
  }

  // Ensure the fake cursor element exists (used in "TESTING CURSOR MOVEMENT" step)
  function ensureFakeCursor() {
    let fc = document.getElementById('fake-cursor');
    if (!fc) {
      fc = document.createElement('div');
      fc.id = 'fake-cursor';
      fc.className = 'fake-cursor';
      document.body.appendChild(fc);
    }
    return fc;
  }

  // Animate the fake cursor in an ellipse across the screen
  async function moveFakeCursor(duration = 2000) {
    const fc = ensureFakeCursor();
    fc.style.opacity = '1';

    const start = performance.now();
    const ww = window.innerWidth;
    const hh = window.innerHeight;

    // Center & radii for the cursor path
    let lastX = ww * 0.5;
    let lastY = hh * 0.5;

    // Keep moving the cursor until the allotted duration has passed
    while (true) {
      const now = performance.now();
      // If we've run longer than "duration" ms, stop the loop
      if (now - start >= duration) break;

      // Pick a random new target position within the window bounds
      const targetX = Math.random() * ww;
      const targetY = Math.random() * hh;

      // Number of small steps to move between the last and target positions
      const steps = 5;

      // Smoothly interpolate from the last position to the new random target
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = lastX + (targetX - lastX) * t;
        const y = lastY + (targetY - lastY) * t;

        // Move the fake cursor to the interpolated position
        fc.style.transform = `translate(${x}px, ${y}px)`;

        // Wait 16ms before the next tiny move
        await sleepLocal(16);
      }

      // Update last position to the newly reached target
      lastX = targetX;
      lastY = targetY;
    }

  // Hide the cursor again after the animation is done
  fc.style.opacity = '0';
  }

  // White flash overlay + sound used in "TESTING MONITOR BRIGHTNESS"
  function whiteFlash() {
    let overlay = document.getElementById('white-flash');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'white-flash';
      overlay.className = 'white-flash';
      document.body.appendChild(overlay);
    }

    const audio = document.getElementById('flash-sound');
    if (audio) {
      audio.currentTime = 0;
      audio.volume = FLASH_VOLUME;
      audio.play().catch(() => {});
    }

    // Delay, then flash white, then fade back out and remove
    setTimeout(() => {
      overlay.style.transition = 'none';
      overlay.style.opacity = '1';

      setTimeout(() => {
        overlay.style.transition = 'opacity 0.6s ease';
        overlay.style.opacity = '0';

        setTimeout(() => overlay.remove(), 700);
      }, 1000);
    }, 1500);
  }

  // Main calibration script (runs after user chooses "Y")
  async function runUserCalibration() {
    // Guard against re-entry if user somehow triggers twice
    if (window.__calibratingActive) return;
    window.__calibratingActive = true;

    const crt = document.getElementById('crt') || document.body;
    document.body.classList.add('calibrating'); // hides cursor, etc.

    // --- STEP 1: BOTTLENECKING CPU (100% success) ---
    {
      const sec = section(crt);
      await typeTitle(sec, 'BOTTLENECKING CPU');
      await successBar(sec);
      await typeSub(sec, 'OK', ACCENT);
    }

    // --- STEP 2: TAKING UP MORE RAM (fails then installs more) ---
    {
      const sec = section(crt);
      await typeTitle(sec, 'TAKING UP MORE RAM');
      await errorBar(sec);
      await typeSub(sec, 'ERROR... INSUFFICIENT RAM', ERROR_RED);
      await typeSub(sec, 'INSTALLING MORE RAM', '#FFFFFF', false);
      await successBar(sec);
      await typeSub(sec, 'OK', ACCENT);
    }

    // --- STEP 3: SENDING DATA TO SKETCHY WEBSITES (successful) ---
    {
      const sec = section(crt);
      await typeTitle(sec, 'SENDING DATA TO SKETCHY WEBSITES');
      await successBar(sec);
      await typeSub(sec, 'OK', ACCENT);
    }

    // --- STEP 4: REVIEWING PERSONAL FILES (error for "too inappropriate") ---
    {
      const sec = section(crt);
      await typeTitle(sec, 'REVIEWING PERSONAL FILES');
      await errorBar(sec);
      await typeSub(sec, 'ERROR... FILES TOO INAPPROPRIATE', ERROR_RED);
    }

    // --- STEP 5: TESTING CURSOR MOVEMENT SPEED (moves fake cursor) ---
    {
      const sec = section(crt);
      await typeTitle(sec, 'TESTING CURSOR MOVEMENT SPEED');
      await Promise.all([successBar(sec), moveFakeCursor(2000)]);
      await typeSub(sec, 'OK', ACCENT);
    }

    // --- STEP 6: CHECKING SEARCH HISTORY (judgy side comment) ---
    {
      const sec = section(crt);
      await typeTitle(sec, 'CHECKING SEARCH HISTORY');
      await successBar(sec);
      await typeSub(sec, 'OK', ACCENT);
      await typeSub(sec, '...DISGUSTING...', ERROR_RED);
    }

    // --- STEP 7: TESTING MONITOR BRIGHTNESS (white flash + bar) ---
    {
      const sec = section(crt);
      await typeTitle(sec, 'TESTING MONITOR BRIGHTNESS');
      await typeSub(sec, 'PLEASE PREPARE OPTIC NERVES', '#FFFFFF');
      await Promise.all([successBar(sec), (async () => { whiteFlash(); })()]);
      await typeSub(sec, 'OK', ACCENT);
    }

    // Spacer gap before final completion messages
    gap(crt);

    // --- FINAL MESSAGES: CALIBRATION COMPLETE / ALL SYSTEMS OPERATIONAL ---
    {
      const sec = section(crt);
      await sleepLocal(1500);
      await typeTitle(sec, ' CALIBRATION COMPLETE', ACCENT);
      await sleepLocal(1500);
      await typeTitle(sec, ' ALL SYSTEMS OPERATIONAL', ACCENT);
    }

    // --- PROMPT: PRESS ENTER TO LOAD STATUS UPDATE ---
    {
      const sec = section(crt);
      const cont = await typeTitle(sec, 'PRESS ENTER TO LOAD STATUS UPDATE');
      cont.style.color = '#FFFFFF';

      // Blinking caret to show we’re waiting for Enter
      const caret = document.createElement('span');
      caret.className = 'caret';
      caret.style.color = '#FFFFFF';
      sec.appendChild(caret);
      if (typeof autoScroll === 'function') autoScroll(caret);

      // Attach one-time Enter listener to transition into STATUS UPDATE phase
      (function attachEnterContinue() {
        function onKeyUpEnterContinue(e) {
          if ((e.key || '').toLowerCase() === 'enter') {
            window.removeEventListener('keyup', onKeyUpEnterContinue);
            caret.remove();
            showStatusPage();
          }
        }
        window.addEventListener('keyup', onKeyUpEnterContinue, { passive: true });
      })();
    }

    // Clean up calibration state
    document.body.classList.remove('calibrating');
    window.__calibratingActive = false;
  }

  // Expose calibration function globally so boot sequence can call it
  window.runUserCalibration = runUserCalibration;
})();

function setupBootGate() {
  const gate = document.getElementById('boot-gate');
  const screen = document.getElementById('screen');

  // If there's no gate element, run the boot sequence immediately
  if (!gate) {
    runBootSequence();
    return;
  }

  let started = false;

  // Start sequence on first keypress
  function startBootFromInput() {
    if (started) return;
    started = true;

    const docEl = document.documentElement;

    // Try to request fullscreen (best-effort, ignore failures)
    if (!document.fullscreenElement) {
      try {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen();
        }
      } catch (e) {}
    }

    // Async IIFE: play boot audio, hide gate, fake caret, then run boot sequence
    (async () => {
      // Ensure typing audio is "unlocked"
      if (typeof unlockTypingAudioOnce === 'function') {
        unlockTypingAudioOnce();
      }

      // Play the boot-start sound once
      const bootAudio = document.getElementById('boot-start');
      if (bootAudio) {
        try {
          bootAudio.currentTime = 0;
          bootAudio.volume = BOOT_VOLUME;
          bootAudio.play().catch(() => {});
        } catch (_) {}
      }

      // Fade out / remove the "press any key" boot gate overlay
      gate.classList.add('boot-gate-hide');
      setTimeout(() => {
        gate.remove();
      }, 450);

      // Show a blinking caret line before the first boot text appears
      const crt = document.getElementById('crt');
      if (crt) {
        const line = document.createElement('div');
        line.className = 'line';

        const caret = document.createElement('span');
        caret.className = 'caret';
        caret.textContent = '';
        caret.style.color = '#FFFFFF';

        line.appendChild(caret);
        crt.appendChild(line);
        autoScroll(line);

        await sleep(1500);
        line.remove();
      }

      // Kick off the full boot sequence flow
      await runBootSequence();
    })();

    // After first keypress, we don't need the boot-gate listener anymore
    window.removeEventListener('keydown', onKey);
  }

  // Simple keydown listener: any key triggers the boot gate
  function onKey(e) {
    startBootFromInput();
  }

  window.addEventListener('keydown', onKey);
}

// Run setup after DOM is ready
document.addEventListener('DOMContentLoaded', setupBootGate);