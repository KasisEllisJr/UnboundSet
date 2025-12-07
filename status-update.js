// Main function that runs after calibration/boot to show the STATUS UPDATE
async function showStatusPage() {
  // CRT container (fallback to body if #crt isn't found)
  const crt = document.getElementById('crt') || document.body;

  // Clear any previous content in the CRT
  crt.innerHTML = '';
  // Make sure the "calibrating" visual state is removed
  document.body.classList.remove('calibrating');

  // Local sleep helper for this file (independent from global sleep)
  const sleepLocal = (ms) => new Promise((r) => setTimeout(r, ms));

  // Simple helper to create a new "terminal" line in the CRT
  function newLine(parent) {
    const line = document.createElement('div');
    line.className = 'line';
    parent.appendChild(line);
    autoScroll(line);
    return line;
  }

  // Local type helper
  // Uses the global window.typeText if it exists, otherwise types characters directly
  async function type(node, text, speed = 22) {
    if (typeof window.typeText === 'function') {
      await window.typeText(node, text);
      return;
    }
    for (const ch of text) {
      node.appendChild(document.createTextNode(ch));
      await sleepLocal(speed);
    }
  }

  // Map the user agent + platform into a "fake" OS label
  function detectOS(ua) {
    const platform = navigator.platform || '';

    if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'WINDOWS FENESTRATED CORE';
    if (/Mac/i.test(platform) || /Mac OS X/i.test(ua)) return 'MACOS ADAM KERNEL';
    if (/Linux/i.test(platform) && !/Android/i.test(ua)) return 'LINUX ARCTIC SHELL';
    if (/Android/i.test(ua)) return 'ANDROID MESH';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'IOS EVE KERNEL';

    // If nothing matches, return empty string (caller will pick a default)
    return '';
  }

  // Detect browser and OS, and map them to the lore-friendly names
  function detectBrowserAndOS() {
    const ua = navigator.userAgent || '';
    let browser = 'UNKNOWN';

    // Basic UA sniffing for major browsers
    if (/Edg\//.test(ua)) browser = 'MICROSOFT EDGE';
    else if (/OPR\//.test(ua) || /Opera/.test(ua)) browser = 'OPERA';
    else if (/Firefox\//.test(ua)) browser = 'MOZILLA FIREFOX';
    else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'GOOGLE CHROME';
    else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = 'SAFARI';
    else if (/Chromium/.test(ua)) browser = 'CHROMIUM';

    // Try to detect a "real" OS first
    let os = detectOS(ua);

    // If OS could not be derived, choose a lore OS based on browser
    if (!os) {
      switch (browser) {
        case 'MICROSOFT EDGE':
          os = 'FENESTRATED CORE SHELL';
          break;
        case 'OPERA':
          os = 'OPusOs';
          break;
        case 'MOZILLA FIREFOX':
          os = 'INFERNOUS FOX FRAMEWORK';
          break;
        case 'GOOGLE CHROME':
          os = 'PLEXNODE GRID';
          break;
        case 'SAFARI':
          os = 'NATURE KERNEL';
          break;
        case 'CHROMIUM':
          os = 'CHROMIUM MESH';
          break;
        default:
          os = 'SPECTRAL KERNEL';
          break;
      }
    }

    return { browser, os };
  }

  // Generate a random-looking public IP address (avoids private ranges)
  function randomIP() {
    function octet() {
      return Math.max(1, Math.min(254, Math.floor(Math.random() * 255)));
    }
    let a, b, c, d;
    while (true) {
      a = octet();
      b = octet();
      c = octet();
      d = octet();
      // Skip 10.x.x.x (private)
      if (a === 10) continue;
      // Skip 172.16–172.31.x.x (private)
      if (a === 172 && b >= 16 && b <= 31) continue;
      // Skip 192.168.x.x (private)
      if (a === 192 && b === 168) continue;
      break;
    }
    return `${a}.${b}.${c}.${d}`;
  }

  // Build aligned label/value text, e.g.:
  // "MACHINE ID:        BROWSER / OS"
  function buildAligned(label, value, colStart = 24) {
    const spaces = Math.max(1, colStart - label.length);
    return label + ' '.repeat(spaces) + value;
  }

  // STATUS UPDATE title line
  const l1 = newLine(crt);
  l1.style.color = '#FFFFFF';
  await type(l1, 'STATUS UPDATE:');

  // A visual gap line
  const gapEl = newLine(crt);
  gapEl.textContent = ' ';

  // Column where values start in the status lines
  const col = 24;
  const { browser, os } = detectBrowserAndOS();
  const ip = randomIP();
  const machineIdValue = `${browser} / ${os}`;

  // MACHINE ID status line
  const l2 = newLine(crt);
  l2.style.color = '#FFFFFF';
  await type(l2, buildAligned('MACHINE ID:', machineIdValue, col));

  // LOCATION status line (fake IP)
  const l3 = newLine(crt);
  l3.style.color = '#FFFFFF';
  await type(l3, buildAligned('LOCATION:', ip, col));

  // CURRENT OBJECTIVE status line
  const l4 = newLine(crt);
  l4.style.color = '#FFFFFF';
  await type(l4, buildAligned('CURRENT OBJECTIVE:', 'TRANSFER TO THE MAIN HUB', col));

  // Extra spacing before code columns
  const gap1 = newLine(crt);
  gap1.textContent = ' ';
  const gap2 = newLine(crt);
  gap2.textContent = ' ';

  // Wrapper for the three fake-code columns
  const codeWrapper = document.createElement('div');
  codeWrapper.className = 'code-columns';
  crt.appendChild(codeWrapper);

  // Adjust the height of the code wrapper so it fills from its top to bottom of viewport
  function resizeCodeWrapper() {
    requestAnimationFrame(() => {
      const rect = codeWrapper.getBoundingClientRect();
      const available = window.innerHeight - rect.top;
      if (available > 0) {
        codeWrapper.style.height = available + 'px';
      }
    });
  }

  // Set initial height and update on window resize
  resizeCodeWrapper();
  window.addEventListener('resize', resizeCodeWrapper);

  // Create three columns for code
  const colEl1 = document.createElement('div');
  const colEl2 = document.createElement('div');
  const colEl3 = document.createElement('div');
  colEl1.className = 'code-column';
  colEl2.className = 'code-column';
  colEl3.className = 'code-column';
  codeWrapper.appendChild(colEl1);
  codeWrapper.appendChild(colEl2);
  codeWrapper.appendChild(colEl3);

  // Maximum number of visible lines per column
  const MAX_CODE_LINES = 44;

  // Helper to create a new code line in a column,
  // removing old ones if we exceed MAX_CODE_LINES (scrolling effect)
  function newCodeLine(column) {
    const line = document.createElement('div');
    line.className = 'code-line';
    column.appendChild(line);

    while (column.childElementCount > MAX_CODE_LINES) {
      column.removeChild(column.firstElementChild);
    }
    return line;
  }

  // Render a line of text into a column, coloring only the first quoted string differently
  function renderLineWithColoredString(lineText, columnEl) {
    const lineEl = newCodeLine(columnEl);

    // Find the first quoted string
    const match = lineText.match(/"[^"\n]*"/);
    if (!match) {
      // If no quotes, just apply keyword colors on the whole line
      appendWithKeywordColoring(lineText, lineEl);
      return;
    }

    const quoted = match[0];
    const before = lineText.slice(0, match.index);
    const after = lineText.slice(match.index + quoted.length);

    // Render the part before the quoted string with keyword coloring
    appendWithKeywordColoring(before, lineEl);

    // Render the quoted string in special orange
    const span = document.createElement('span');
    span.style.color = '#ff0000ff';
    span.textContent = quoted;
    lineEl.appendChild(span);

    // Render the remaining text after the quoted string with keyword coloring
    appendWithKeywordColoring(after, lineEl);
  }

  // Mapping of keywords to their highlight colors
  const KEYWORD_COLORS = {
    void: '#ff3f3fff',
    bool: '#ff5555ff',
    int: '#c72222ff',
    double: '#ff4f4fff',
    coords: '#ff4747ff',
    log: '#ff4b4bff',
    log_event: '#ff4b4bff'
  };

  // Append text into parentEl, highlighting certain keywords using spans
  function appendWithKeywordColoring(text, parentEl) {
    if (!text) return;

    // Regex to find any of these keywords as whole words
    const regex = /\b(void|bool|coords|log_event|log|int|double)\b/g;
    let lastIndex = 0;
    let match;

    // Walk through all keyword matches in the text
    while ((match = regex.exec(text)) !== null) {
      const word = match[0];

      // Add any plain text from the last position up to this keyword
      if (match.index > lastIndex) {
        parentEl.appendChild(
          document.createTextNode(text.slice(lastIndex, match.index))
        );
      }

      // Add the keyword in color
      const span = document.createElement('span');
      span.style.color = KEYWORD_COLORS[word] || '#22c55e';
      span.textContent = word;
      parentEl.appendChild(span);

      lastIndex = regex.lastIndex;
    }

    // Append any remaining text after the last keyword match
    if (lastIndex < text.length) {
      parentEl.appendChild(
        document.createTextNode(text.slice(lastIndex))
      );
    }
  }

  // Escape HTML-sensitive characters (not heavily used here, but handy)
  function escapeHTML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ======== FAKE "C++" CODE FOR EACH COLUMN (LORE TEXT) ========
  const codeCol1 = `void log_event(const std::string& TAG, const std::string& MSG);
void log(const std::string& MSG);

struct BIODATA_PACKET {
    int     HEART_RATE;
    int     RESP_RATE;
    double  CORE_TEMP_C;
    double  EEG_ALPHA;
    double  EEG_BETA;
    double  EEG_GAMMA;
};

int      SAMPLE_INDEX          = 0;
int      HEART_RATE_SAMPLES[8] = { 72, 73, 74, 71, 69, 70, 72, 73 };
double   CORE_TEMP_SAMPLES[8]  = { 36.7, 36.8, 36.9, 36.8, 36.6, 36.7, 36.8, 36.8 };
double   EEG_ALPHA_SAMPLES[8]  = { 9.73, 9.81, 9.66, 9.77, 9.69, 9.72, 9.75, 9.71 };
double   EEG_BETA_SAMPLES[8]   = { 18.3, 18.1, 18.7, 18.5, 18.2, 18.4, 18.6, 18.3 };

BIODATA_PACKET ACTIVE_PACKET;

void DOWNLOAD_USER_BIODATA() {
    log("BIODATA DOWNLOAD REQUEST RECEIVED");
    log_event("BIODATA_DOWNLOAD", "SCANNING PHYSICAL SHELL SENSORS");

    for (SAMPLE_INDEX = 0; SAMPLE_INDEX < 8; ++SAMPLE_INDEX) {
        ACTIVE_PACKET.HEART_RATE  = HEART_RATE_SAMPLES[SAMPLE_INDEX];
        ACTIVE_PACKET.RESP_RATE   = 16 + (SAMPLE_INDEX % 3);
        ACTIVE_PACKET.CORE_TEMP_C = CORE_TEMP_SAMPLES[SAMPLE_INDEX];
        ACTIVE_PACKET.EEG_ALPHA   = EEG_ALPHA_SAMPLES[SAMPLE_INDEX];
        ACTIVE_PACKET.EEG_BETA    = EEG_BETA_SAMPLES[SAMPLE_INDEX];
        ACTIVE_PACKET.EEG_GAMMA   = 32.0 + (0.13 * SAMPLE_INDEX);

        log_event("BIODATA_FRAME",
                  "HR:" + std::to_string(ACTIVE_PACKET.HEART_RATE) +
                  " TEMP:" + std::to_string(ACTIVE_PACKET.CORE_TEMP_C) +
                  " A:" + std::to_string(ACTIVE_PACKET.EEG_ALPHA));

        log("CACHING BIODATA FRAME IN TEMPORARY MEMORY RING BUFFER");
    }

    log_event("BIODATA_DOWNLOAD_COMPLETE",
              "ALL VITALS CAPTURED AND SEALED FOR CYBER LINK CREATION");
}`;

  const codeCol2 = `bool    CYBER_LINK_READY      = false;
bool    CARRIER_LOCKED        = false;
double  LINK_LATENCY_MS       = 0.0;
double  PACKET_LOSS_PERCENT   = 0.0;
double  CARRIER_FREQ_GHZ      = 12.733;
double  PHASE_JITTER_DEGREES  = 0.0;
int     HANDSHAKE_RETRIES     = 0;

void CREATE_CYBER_LINK_TO_UNBOUND_SET() {
    log("INITIALIZING CYBER LINK TO UNBOUND SET");
    log_event("CYBER_LINK_INIT", "PROVISIONING NULL CHANNEL");

    LINK_LATENCY_MS      = 3.17;
    PACKET_LOSS_PERCENT  = 0.02;
    PHASE_JITTER_DEGREES = 4.5;

    log("MEASURED LINK LATENCY MS: " + std::to_string(LINK_LATENCY_MS));
    log("MEASURED PACKET LOSS PERCENT: " + std::to_string(PACKET_LOSS_PERCENT));
    log("MEASURED PHASE JITTER DEGREES: " + std::to_string(PHASE_JITTER_DEGREES));

    for (HANDSHAKE_RETRIES = 0; HANDSHAKE_RETRIES < 3; ++HANDSHAKE_RETRIES) {
        log_event("CYBER_LINK_HANDSHAKE",
                  "ATTEMPT " + std::to_string(HANDSHAKE_RETRIES + 1));
        if (PACKET_LOSS_PERCENT < 0.05 && PHASE_JITTER_DEGREES < 7.0) {
            CYBER_LINK_READY = true;
            CARRIER_LOCKED   = true;
            break;
        }

        PACKET_LOSS_PERCENT  *= 0.5;
        PHASE_JITTER_DEGREES *= 0.7;
    }

    if (!CYBER_LINK_READY) {
        log_event("CYBER_LINK_FAILURE",
                  "UNABLE TO STABILIZE NULL CHANNEL");
        return;
    }

    log_event("CYBER_LINK_STABLE",
              "CARRIER LOCK ACHIEVED AT " +
              std::to_string(CARRIER_FREQ_GHZ) + " GHZ");
    log("CYBERNETIC TETHER READY FOR BIODATA TRANSFER TO THE UNBOUND SET");
}`;

  const codeCol3 = `bool   PHYSICAL_SHELL_ONLINE   = true;
bool   TRANSFER_CONFIRMED      = false;
double MATTER_DISASSEMBLY_RATE = 0.0;
double ECHO_RESIDUAL_PERCENT   = 100.0;
int    SEGMENT_INDEX           = 0;
int    SEGMENTS_TOTAL          = 16;

void ERASE_PHYSICAL_SHELL() {
    log_event("PHYSICAL_SHELL_ERASURE",
              "CONFIRMING PHYSICAL SHELL DESTRUCTION");
    MATTER_DISASSEMBLY_RATE = 6.66;

    for (SEGMENT_INDEX = 0; SEGMENT_INDEX < SEGMENTS_TOTAL; ++SEGMENT_INDEX) {
        ECHO_RESIDUAL_PERCENT -= (100.0 / SEGMENTS_TOTAL);
        log("DISASSEMBLING SEGMENT " + std::to_string(SEGMENT_INDEX) +
            " ECHO REMAINING: " + std::to_string(ECHO_RESIDUAL_PERCENT) + " PCT");
    }

    PHYSICAL_SHELL_ONLINE = false;
    log_event("PHYSICAL_SHELL_DELETED",
              "BODILY MATTER SCHEDULED FOR RECYCLING");
}

void TRANSFER_BIODATA_TO_UNBOUND_SET() {
    if (PHYSICAL_SHELL_ONLINE) {
        log_event("TRANSFER_BLOCKED",
                  "PHYSICAL SHELL STILL ONLINE, ABORTING NULL TRANSFER");
        return;
    }

    log_event("BIODATA_TRANSFER_BEGIN",
              "STREAMING CACHED BIODATA OVER CYBER LINK");
    double TRANSFER_PROGRESS = 0.0;

    while (TRANSFER_PROGRESS < 100.0) {
        TRANSFER_PROGRESS += 12.5;
        log("BIODATA TRANSFER PROGRESS: " +
            std::to_string(TRANSFER_PROGRESS) + " PCT");
    }

    TRANSFER_CONFIRMED = true;
    log_event("BIODATA_TRANSFER_COMPLETE",
              "USER BIODATA SUCCESSFULLY PARKED IN THE UNBOUND SET");
}

int main() {
    DOWNLOAD_USER_BIODATA();
    CREATE_CYBER_LINK_TO_UNBOUND_SET();
    ERASE_PHYSICAL_SHELL();
    TRANSFER_BIODATA_TO_UNBOUND_SET();
    return 0;
}`;

  // Type the column once, line by line, with a delay between lines
  function typeColumnOnce(codeText, columnEl, delay = 40) {
    const lines = codeText.split('\n');
    (async () => {
      for (const lineText of lines) {
        renderLineWithColoredString(lineText, columnEl);
        await sleepLocal(delay);
      }
    })();
  }

  // Continuously loop through the codeText lines,
  // appending lines while control.running is true
  function startLoopingColumn(codeText, columnEl, delay, control) {
    const lines = codeText.split('\n');
    (async function loop() {
      while (control.running) {
        for (const lineText of lines) {
          if (!control.running) break;
          renderLineWithColoredString(lineText, columnEl);
          await sleepLocal(delay);
        }
      }
    })();
  }

  // Gradually clear all code lines from all columns
  async function clearCodeLines(columns, stepDelay = 15, batchSize = 3) {
    let hasLines = true;
    while (hasLines) {
      hasLines = false;

      for (const colEl of columns) {
        let removed = 0;
        // Remove a few lines (batchSize) from the top in each iteration
        while (colEl.firstElementChild && removed < batchSize) {
          colEl.removeChild(colEl.firstElementChild);
          removed++;
          hasLines = true;
        }
      }
      await sleepLocal(stepDelay);
    }
  }

  // Control objects to stop the infinite loops when we want
  const control1 = { running: true };
  const control2 = { running: true };
  const control3 = { running: true };

  // Used to detect when all three looping columns are started
  let loopsStartedCount = 0;
  let allLoopsStartedResolve;
  const allLoopsStarted = new Promise((res) => {
    allLoopsStartedResolve = res;
  });

  // Increment loop-start counter; resolve allLoopsStarted when all 3 are running
  function markLoopStarted() {
    loopsStartedCount += 1;
    if (loopsStartedCount === 3 && allLoopsStartedResolve) {
      allLoopsStartedResolve();
    }
  }

  // Start column 1: type once, then loop
  (async () => {
    await typeColumnOnce(codeCol1, colEl1, 40);
    startLoopingColumn(codeCol1, colEl1, 15, control1);
    markLoopStarted();
  })();

  // Start column 2: type once, then loop
  (async () => {
    await typeColumnOnce(codeCol2, colEl2, 40);
    startLoopingColumn(codeCol2, colEl2, 15, control2);
    markLoopStarted();
  })();

  // Start column 3: type once, then loop
  (async () => {
    await typeColumnOnce(codeCol3, colEl3, 40);
    startLoopingColumn(codeCol3, colEl3, 15, control3);
    markLoopStarted();
  })();

  // Orchestrate the status lines fade-out, transport banner, and transition
  (async () => {
    // Wait until all three code loops have started
    await allLoopsStarted;

    // In parallel: slowly remove the top status lines one by one
    (async () => {
      const statusLines = [l4, l3, l2, l1];
      for (const line of statusLines) {
        await sleepLocal(1000);
        if (line && line.parentNode) {
          line.parentNode.removeChild(line);
          resizeCodeWrapper();
        }
      }
    })();

    // Let the user watch the code for a bit
    await sleepLocal(2500);

    // Create the "BEGINNING TRANSPORTATION" overlay banner
    const transportOverlay = document.createElement('div');
    transportOverlay.id = 'transport-overlay';
    transportOverlay.className = 'transport-banner';

    const transportInner = document.createElement('div');
    transportInner.className = 'transport-banner-inner';

    const transportText = document.createElement('div');
    transportText.className = 'transport-banner-text';
    transportText.textContent = 'BEGINNING TRANSPORTATION';

    transportInner.appendChild(transportText);
    transportOverlay.appendChild(transportInner);
    document.body.appendChild(transportOverlay);

    // Wait briefly before switching to "TRANSPORTING..."
    await sleepLocal(2000);

    const baseLabel = 'TRANSPORTING';
    transportText.textContent = baseLabel + '...';

    // Play a whoosh sound as the transport begins
    const whoosh = document.getElementById('whoosh-sound');
    if (whoosh) {
      try {
        whoosh.currentTime = 0;
        whoosh.volume = WHOOSH_VOLUME;
        whoosh.play().catch(() => {});
      } catch (_) {}
    }

    // Stop all code loops
    control1.running = false;
    control2.running = false;
    control3.running = false;

    // Clear out all code lines from the columns
    await clearCodeLines([colEl1, colEl2, colEl3], 35);

    // Clear the CRT text
    crt.innerHTML = '';

    // Run the final "glitch / error / flood" transport sequence
    startTransportFinale(transportText);

    // Remove the code wrapper from DOM
    if (codeWrapper && codeWrapper.parentNode) {
      codeWrapper.parentNode.removeChild(codeWrapper);
    }

    // Ensure CRT is empty at the end
    crt.innerHTML = '';
  })();
}

// Plays a small error sound instance (clones the base <audio>)
function playErrorSound() {
  const base = document.getElementById('error-sound');
  if (!base) return;

  try {
    const inst = base.cloneNode();
    inst.volume = 0.4;
    inst.currentTime = 0;
    inst.play().catch(() => {});
  } catch (_) {}
}

// Base overlay reference for error ghosts
const overlay = document.getElementById('transport-overlay') || document.body;

// Generate a random line of glyph characters
function randomGlyphLine(width = 64) {
  const glyphs = '01#@%&+*=-/[]{}<>~';
  let out = '';
  for (let i = 0; i < width; i++) {
    out += glyphs[Math.floor(Math.random() * glyphs.length)];
  }
  return out;
}

// Predefined error ghost messages that appear during glitching
const ERROR_GHOST_MESSAGES = [
  'ERROR: BIODATA STREAM DESYNC',
  'ERROR: CYBERLINK OVERLOAD',
  'ERROR: NULL TUNNEL CHECKSUM FAIL',
  'ERROR: SHELL PERSISTENCE DETECTED',
  'ERROR: GHOST PACKET COLLISION',
  'ERROR: HEALTH EXPECTATION MISMATCH',
  'ERROR: EXPECTED IQ LEVEL NOT MET',
  'ERROR: PSYCHOSIS RISK LOW',
  'ERROR: IDIVIDUALITY INTACT',
  'ERROR: BODILY NUTRIENTS LACKING',
];

// Play the large, main error sound (e.g., big error event)
function playErrorLargeSound() {
  const base = document.getElementById('error-large-sound');
  if (!base) return;

  try {
    const inst = base.cloneNode();
    inst.volume = 0.5;
    inst.currentTime = 0;
    inst.play().catch(() => {});
  } catch (_) {}
}

// Play smaller error sounds, e.g., for each "ghost" error
function playErrorSmallSound() {
  const base = document.getElementById('error-sound');
  if (!base) return;

  try {
    const inst = base.cloneNode();
    inst.volume = 0.4;
    inst.currentTime = 0;
    inst.play().catch(() => {});
  } catch (_) {}
}

// Glitch effect applied to a text node, with optional error "ghosts"
async function runGlitchOnText(node, baseText, durationMs = 1700) {
  const start = performance.now();
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?/#';

  const isErrorBase = baseText.startsWith('ERROR');
  const overlay = document.getElementById('transport-overlay');

  // Schedule echo-ghost messages if this is an ERROR text
  const echoSchedule = [];
  if (isErrorBase) {
    // Decide how many ghost echos to spawn (5–10)
    const echoCount = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < echoCount; i++) {
      const t = 150 + Math.random() * (durationMs - 400);
      const side = i < Math.floor(echoCount / 2) ? 'left' : 'right';
      echoSchedule.push({ time: t, spawned: false, side });
    }
  }

  // Run the glitch animation for durationMs
  while (performance.now() - start < durationMs) {
    const elapsed = performance.now() - start;

    // Build a glitched version of the baseText (random characters swapped in)
    let glitched = '';
    for (const ch of baseText) {
      if (ch === ' ') {
        glitched += ' ';
      } else if (Math.random() < 0.32) {
        glitched += glyphs[Math.floor(Math.random() * glyphs.length)];
      } else {
        glitched += ch;
      }
    }
    node.textContent = glitched;

    // Apply slight jitter to the node position
    const jitterX = (Math.random() - 0.5) * 6;
    const jitterY = (Math.random() - 0.5) * 3;
    node.style.transform = `translate(${jitterX}px, ${jitterY}px)`;

    // If we have an overlay and error text, spawn ghost echoes at scheduled times
    if (overlay && isErrorBase) {
      echoSchedule.forEach((slot) => {
        if (!slot.spawned && elapsed >= slot.time) {
          slot.spawned = true;

          const ghost = document.createElement('div');
          ghost.className = node.className || 'transport-banner-text';

          let ghostLabel = baseText;
          if (isErrorBase && ERROR_GHOST_MESSAGES.length > 0) {
            ghostLabel =
              ERROR_GHOST_MESSAGES[
                Math.floor(Math.random() * ERROR_GHOST_MESSAGES.length)
              ];
          }

          ghost.textContent = ghostLabel;

          ghost.style.position = 'absolute';

          // randomized error position between 15% and 85% horizontally, 20%-80% vertically
          let x;
            x = 15 + Math.random() * 70;

          ghost.style.left = `${x}%`;
          ghost.style.top = `${20 + Math.random() * 60}%`;
          ghost.style.transform = 'translate(-50%, -50%) scale(0.8)';
          ghost.style.opacity = '1';

          overlay.appendChild(ghost);

          if (isErrorBase) {
            playErrorSmallSound();
          }

          // Quickly fade out and remove the ghost
          setTimeout(() => {
            ghost.style.transition = 'opacity 0.15s ease-out';
            ghost.style.opacity = '0';
            setTimeout(() => ghost.remove(), 180);
          }, 120);
        }
      });
    }

    await sleep(80);
  }

  // Reset transform and finalize the node text to "TEXT..."
  node.style.transform = 'translate(0, 0)';
  node.textContent = baseText + '...';
}

// Runs the red glyph flood + WELCOME screen + final title + transition to hub
async function runWhiteFloodAndTitle(finalTitle = 'UNBOUND SET') {
  // Full-screen flood container
  const flood = document.createElement('div');
  flood.className = 'white-flood';
  document.body.appendChild(flood);

  // Pre-formatted text field that shows the glyph grid
  const field = document.createElement('pre');
  field.className = 'white-flood-field';
  flood.appendChild(field);

  // Approximate character cell size (for a grid that fills the screen)
  const charWidthPx = 8;
  const charHeightPx = 14;

  // How many columns and rows the glyph grid has, based on window size
  const cols = Math.floor(window.innerWidth / charWidthPx);
  const rows = Math.floor(window.innerHeight / charHeightPx);

  // Each column tracks how many cells from the bottom are "filled"
  const heights = new Array(cols).fill(0);

  // Render the grid based on current column heights
  function renderGrid() {
    const lines = [];
    for (let r = 0; r < rows; r++) {
      let line = '';
      for (let c = 0; c < cols; c++) {
        const filledHeight = heights[c];
        const threshold = rows - filledHeight;
        if (r >= threshold) {
          const glyphs = '01#@%&+*=-/[]{}<>~';
          line += glyphs[Math.floor(Math.random() * glyphs.length)];
        } else {
          line += ' ';
        }
      }
      lines.push(line);
    }
    field.textContent = lines.join('\n');
  }

  // Animate the flood filling up from the bottom until every column is full
  while (Math.min(...heights) < rows) {
    // Target ~75 frames for the full fill
    const targetFrames = 75;
    const avgPicks = Math.round((rows * cols) / targetFrames);
    const jitter = Math.floor(avgPicks * 0.15);

    // Randomize how many cells get filled this frame
    const picks = avgPicks + (Math.floor(Math.random() * (2 * jitter + 1)) - jitter);

    for (let i = 0; i < picks; i++) {
      const col = Math.floor(Math.random() * cols);
      if (heights[col] < rows) {
        heights[col] += 1;
      }
    }

    renderGrid();
    await sleep(40);
  }

  // Switch the flood to solid red (error vibe)
  flood.style.transition = 'background-color 0.6s ease, color 0.6s ease';
  flood.style.backgroundColor = '#ff4b4b';
  flood.style.color = '#ff4b4b';

  // Title overlay container
  const titleOverlay = document.createElement('div');
  titleOverlay.className = 'main-hub-title';

  // "WELCOME TO..." line
  const line1 = document.createElement('div');
  line1.className = 'main-hub-title-text main-hub-title-line1';
  line1.textContent = 'WELCOME TO...';
  line1.style.color = '#ffb347';

  // "UNBOUND SET" line (or custom finalTitle), initially hidden
  const line2 = document.createElement('div');
  line2.className = 'main-hub-title-text main-hub-title-line2';
  line2.textContent = finalTitle || 'UNBOUND SET';
  line2.style.opacity = '0';

  titleOverlay.appendChild(line1);
  titleOverlay.appendChild(line2);
  document.body.appendChild(titleOverlay);

  // Immediately try to play the "welcome" glitch voice
  (function () {
    const welcomeAudio = document.getElementById('welcome-message-glitch');
    if (!welcomeAudio) return;
    try {
      welcomeAudio.currentTime = 0;
      welcomeAudio.volume = 0.9;
      welcomeAudio.play().catch(() => {});
    } catch (_) {}
  })();

  await sleep(700);

  // Fade flood color from red to white
  flood.style.backgroundColor = '#ffffff';
  flood.style.color = '#ffffff';

  // Transition the "WELCOME TO..." text from orange to black
  line1.style.transition = 'color 0.4s ease';
  line1.style.color = '#000000';

  await sleep(700);

  const fadeDurationMs = 800;

  // After a pause, fade in the UNBOUND SET text
  await sleep(1000);
  line2.style.transition = `opacity ${fadeDurationMs}ms ease`;
  line2.style.opacity = '1';

  // Schedule "Unbound Set" audio slightly offset to match the text fade
  (function () {
    const unboundAudio = document.getElementById('unbound-set-load');
    if (!unboundAudio) return;

    const offset = Math.max(0, fadeDurationMs - 500);

    try {
      setTimeout(() => {
        try {
          unboundAudio.currentTime = 0;
          unboundAudio.volume = 0.9;
          unboundAudio.play().catch(() => {});
        } catch (_) {}
      }, offset);
    } catch (_) {}
  })();

  await sleep(fadeDurationMs + 700);

  // Dock the title overlay to its final position (class handles CSS move)
  titleOverlay.classList.add('main-hub-title--docked');
  // Hide the "WELCOME TO..." line once docked
  line1.classList.add('main-hub-title-line1--hidden');

  // Initialize the actual home page content once the sequence ends
  if (window.initHomePage) {
    window.initHomePage();
  }

  // Fade out the flood overlay and then remove it
  flood.style.transition += ', opacity 0.8s ease';
  flood.style.opacity = '0';
  await sleep(900);
  flood.remove();
}

// Full transport finale that runs after code columns + banner
async function startTransportFinale(transportTextNode) {
  const baseTransport = 'TRANSPORTING';
  const errorBase = 'ERROR: TRANSPORT LINK DESTABILIZED';

  // Reset any transform before we begin
  transportTextNode.style.transform = 'translate(0, 0)';

  // How long to show the base "TRANSPORTING..." animation before glitch
  const holdDuration = 3000;
  const dotStepMs = 220;
  const frameMs = 80;

  const start = performance.now();

  // Simple dot-adding animation: TRANSPORTING., TRANSPORTING.., etc.
  while (performance.now() - start < holdDuration) {
    const elapsed = performance.now() - start;
    const dotPhase = Math.floor(elapsed / dotStepMs) % 4;
    const dots = '.'.repeat(dotPhase);
    transportTextNode.textContent = baseTransport + dots;

    await new Promise((r) => setTimeout(r, frameMs));
  }

  // Finalize text with three dots before glitching
  transportTextNode.textContent = baseTransport + '...';

  // Run glitch animation once on "TRANSPORTING"
  await runGlitchOnText(transportTextNode, baseTransport, 1600);

  // Switch to red error text and play large error sound
  transportTextNode.classList.add('transport-error-text');
  transportTextNode.textContent = errorBase;
  playErrorLargeSound();

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Run glitch animation on the error text for longer, with ghost echoes
  await runGlitchOnText(transportTextNode, errorBase, 3000);

  // Fade out and clear the banner text
  transportTextNode.style.opacity = '0';
  transportTextNode.textContent = '';

  // Run the white flood + "WELCOME TO... UNBOUND SET" sequence
  await runWhiteFloodAndTitle('UNBOUND SET');

  // Remove the overlay entirely at the end
  const overlay = document.getElementById('transport-overlay');
  if (overlay) {
    overlay.remove();
  }
}