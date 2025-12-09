// Immediately Invoked Function Expression to keep everything scoped locally
(function () {
  // Characters used for the floating background glyph sea
  const GLYPHS = '01#@%&+*=-/[]{}<>~';

  // Mapping between theme keys and their corresponding audio file paths
  const THEME_AUDIO_MAP = {
    default: 'assets/HomeTheme.wav',
    V1: 'assets/HomeTheme2.mp3',
    DARKFOUNTAIN: 'assets/HomeTheme3.mp3',
    FORECAST: 'assets/HomeTheme4.mp3',
    HADES: 'assets/HomeTheme5.mp3',
  };

  // Create and insert a single drifting glyph into the given layer
  function spawnGlyph(layer) {
    if (!layer || !document.body.classList.contains('home-active')) return;

    // Create a span element to display a single glyph character
    const span = document.createElement('span');
    span.className = 'glyph-char';
    span.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

    // Random horizontal position (0–100% of viewport width)
    const x = Math.random() * 100;
    const sizeRem = 0.7 + Math.random() * 1.4;
    const duration = 9 + Math.random() * 7;

    // Position and style the glyph
    span.style.left = x + '%';
    span.style.fontSize = sizeRem.toFixed(2) + 'rem';
    span.style.animationDuration = duration.toFixed(2) + 's';
    span.style.opacity = (0.2 + Math.random() * 0.35).toFixed(2);

    // Add the glyph to the layer
    layer.appendChild(span);

    // Once its CSS animation finishes, remove it from the DOM
    span.addEventListener('animationend', () => {
      span.remove();
    });
  }

  // Start the looping glyph sea effect on the given layer
  function startGlyphSea(layer) {
    if (!layer) return;

    // Interval that continuously spawns new glyphs
    const spawnInterval = setInterval(() => {
      // If layer is gone or home is no longer active, stop both intervals
      if (
        !document.body.contains(layer) ||
        !document.body.classList.contains('home-active')
      ) {
        clearInterval(spawnInterval);
        clearInterval(flickerInterval);
        return;
        
      }

      //If tab isn't active, skip spawning to save resources
      if (document.hidden) {
      return;
    }

      // Spawn between 10 and 20 glyphs every 400ms
      const count = 10 + Math.floor(Math.random() * 11);
      for (let i = 0; i < count; i++) {
        spawnGlyph(layer);
      }
    }, 400);

    // Interval that randomly changes (flickers) some glyphs' characters
    const flickerInterval = setInterval(() => {
      // Same cleanup check as above
      if (
        !document.body.contains(layer) ||
        !document.body.classList.contains('home-active')
      ) {
        clearInterval(flickerInterval);
        clearInterval(spawnInterval);
        return;
      }

      // If tab isn't active, skip flickering to save resources
      if (document.hidden) {
        return;
      }

      // Get all glyph elements currently in the layer
      const glyphs = layer.querySelectorAll('.glyph-char');
      if (!glyphs.length) return;

      // Decide how many glyphs to change this tick (up to 6)
      const changes = Math.min(6, glyphs.length);
      for (let i = 0; i < changes; i++) {
        // Pick a random glyph
        const idx = Math.floor(Math.random() * glyphs.length);
        const g = glyphs[idx];
        // Swap its text content to a new random glyph character
        g.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
    }, 250);
  }

  // Will hold the reference to the <audio id="home-theme"> element
  let homeThemeAudio = null;

  // Default volume (0–1) and current in-memory volume value
  const DEFAULT_VOLUME = 0.45;
  let homeThemeVolume = DEFAULT_VOLUME;

  // Immediately-run function to load saved volume from localStorage
  (function loadSavedVolume() {
    try {
      const saved = localStorage.getItem('hubVolume');
      if (saved !== null) {
        const v = parseFloat(saved);
        // Use saved volume only if it is a valid number and between 0 and 1
        if (!Number.isNaN(v) && v >= 0 && v <= 1) {
          homeThemeVolume = v;
        }
      }
    } catch (e) {
      // Ignore storage access errors (e.g. privacy mode)
    }
  })();

  // Update home theme volume and save the value in localStorage
  function setHomeThemeVolume(vol) {
    const audio = getHomeThemeAudio();
    if (!audio) return;

    // Clamp volume between 0 and 1
    const clamped = Math.max(0, Math.min(1, vol));
    homeThemeVolume = clamped;
    audio.volume = clamped;

    // Persist volume setting for future visits
    try {
      localStorage.setItem('hubVolume', String(clamped));
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Getter for the main home theme <audio> element
  function getHomeThemeAudio() {
    if (!homeThemeAudio) {
      homeThemeAudio = document.getElementById('home-theme') || null;
    }
    return homeThemeAudio;
  }

  // Swap the current audio track based on the active theme
  function setHomeThemeTrack(themeKey) {
    const audio = getHomeThemeAudio();
    if (!audio) return;

    // Priority: explicit key -> global current theme -> default
    const key = themeKey || window.__currentHubTheme || DEFAULT_THEME_KEY;
    const src = THEME_AUDIO_MAP[key] || THEME_AUDIO_MAP.default;

    // If the src is already set to this file, don't reload
    if (audio.dataset.currentSrc === src) return;

    // Remember if the track was playing before switching
    const wasPlaying = !audio.paused && !audio.ended;

    // Stop current track and reset playback position
    audio.pause();
    audio.currentTime = 0;
    // Swap the source
    audio.src = src;
    audio.dataset.currentSrc = src;
    audio.load();

    // If music was playing, resume playing the new track
    if (wasPlaying) {
      audio.play().catch(() => {});
    }
  }

  // Start playing the home theme music (looped)
  function playHomeTheme() {
    const audio = getHomeThemeAudio();
    if (!audio) return;

    // Ensure the current track matches the active theme
    setHomeThemeTrack(window.__currentHubTheme || DEFAULT_THEME_KEY);

    try {
      audio.volume = homeThemeVolume;
      audio.loop = true;
      audio.play().catch(() => {});
    } catch (e) {
      // Ignore playback errors (e.g. browser autoplay restrictions)
    }
  }

  // Mute only the home theme audio (not global system audio)
  function muteHomeTheme() {
    const audio = getHomeThemeAudio();
    if (!audio) return;
    audio.muted = true;
  }

  // Unmute the home theme audio and resume if it was paused
  function resumeHomeTheme() {
    const audio = getHomeThemeAudio();
    if (!audio) return;
    audio.muted = false;
    if (audio.paused) {
      audio.play().catch(() => {});
    }
  }

  // Will hold the YouTube player instance for the fun playlist
  let funPlaylistPlayer = null;
  // Timeout handle used to delay resuming the hub theme after YouTube stops
  let resumeThemeTimeout = null;

  // Load the YouTube IFrame API, then run onReady when it's available
  function loadYouTubeApiIfNeeded(onReady) {
    // If API already loaded, just call onReady immediately
    if (window.YT && window.YT.Player) {
      onReady();
      return;
    }

    // Inject the YouTube iframe API script once
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    // Chain our onReady with any existing onYouTubeIframeAPIReady handler
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prev === 'function') prev();
      onReady();
    };
  }

  // Setup the YouTube playlist player in the "fun" panel
  function setupFunMedia(root) {
    // Look for the playlist iframe inside the given root
    const iframe = root.querySelector('#fun-playlist-player');
    if (!iframe) return;

    // Ensure the YouTube API is loaded
    loadYouTubeApiIfNeeded(() => {
      // Don't recreate the player if we already built one
      if (funPlaylistPlayer) return;

      // Build the YT.Player bound to the iframe id
      funPlaylistPlayer = new YT.Player('fun-playlist-player', {
        events: {
          onStateChange: onFunPlaylistStateChange,
        },
      });
    });
  }

  // Handle play/pause/end events from the YouTube playlist
  function onFunPlaylistStateChange(event) {
    if (!event || typeof event.data === 'undefined' || !window.YT) return;
    const state = event.data;

    if (state === YT.PlayerState.PLAYING) {
      // When playlist starts playing, cancel pending resume and mute the hub theme
      if (resumeThemeTimeout) {
        clearTimeout(resumeThemeTimeout);
        resumeThemeTimeout = null;
      }
      muteHomeTheme();
    } else if (
      state === YT.PlayerState.PAUSED ||
      state === YT.PlayerState.ENDED
    ) {
      // When playlist is paused or ended, schedule hub theme to fade back in
      if (resumeThemeTimeout) clearTimeout(resumeThemeTimeout);
      resumeThemeTimeout = setTimeout(() => {
        resumeHomeTheme();
      }, 1500);
    }
  }

  // Default theme key if none is chosen
  const DEFAULT_THEME_KEY = 'default';

  // Apply a visual/audio theme to the hub
  function applyHubTheme(key) {
    const body = document.body;

    const themeKey = key || DEFAULT_THEME_KEY;

    // Default theme: remove attribute so CSS falls back
    if (themeKey === DEFAULT_THEME_KEY) {
      body.removeAttribute('data-theme');
    } else {
      // Non-default themes are applied via data-theme attribute
      body.dataset.theme = themeKey;
    }

    // Store the current theme globally for other parts of the app
    window.__currentHubTheme = themeKey;

    // Update the audio track to match this theme
    setHomeThemeTrack(themeKey);
  }

  // Wire up the Settings panel theme dropdown
  function setupSettingsPanel(root) {
    if (!root) return;
    const select = root.querySelector('#hub-theme-select');
    if (!select) return;

    // Figure out which theme should be active initially
    const initial =
      window.__currentHubTheme ||
      document.body.dataset.theme ||
      DEFAULT_THEME_KEY;

    // Make sure the select shows the active theme
    select.value = initial;
    applyHubTheme(initial);

    // When user selects a new theme, apply it
    select.addEventListener('change', () => {
      applyHubTheme(select.value);
    });
  }

  // Wire up the Settings panel volume slider for hub music
  function setupVolumeSlider(root) {
    if (!root) return;

    const slider = root.querySelector('#home-volume-slider');
    const valueLabel = root.querySelector('#home-volume-label-value');
    if (!slider) return;

    // Initialize slider to the saved/current volume (0–100%)
    const initialPercent = Math.round(homeThemeVolume * 100);
    slider.value = String(initialPercent);
    if (valueLabel) {
      valueLabel.textContent = String(initialPercent);
    }

    // Ensure audio element has the correct starting volume
    setHomeThemeVolume(homeThemeVolume);

    // When the slider moves, update both the text label and the real volume
    slider.addEventListener('input', () => {
      const percent = parseInt(slider.value, 10) || 0;
      const vol = percent / 100;

      if (valueLabel) {
        valueLabel.textContent = String(percent);
      }

      setHomeThemeVolume(vol);
    });
  }

  // Build the main home page layout and activate the hub view
  function buildHomeLayout() {
    const root = document.getElementById('home-root');
    if (!root) return;

    // Hide the CRT boot/status output when the hub is active
    const crt = document.getElementById('crt');
    if (crt) {
      crt.style.display = 'none';
    }

    // Mark the document as being in home/hub mode
    document.body.classList.add('home-active');

    // Clear out any previous content and apply base class
    root.innerHTML = '';
    root.classList.add('home-root');

    // Create the layered background: base, glyphs, dark overlay
    const bg = document.createElement('div');
    bg.className = 'home-bg-layer';

    const glyphLayer = document.createElement('div');
    glyphLayer.className = 'home-glyph-layer';

    const dark = document.createElement('div');
    dark.className = 'home-dark-overlay';

    // Main content container for nav + panels + footer
    const content = document.createElement('div');
    content.className = 'home-content';

    // Top navigation bar with logo and hamburger menu for mobile
    const nav = document.createElement('nav');
    nav.className = 'home-nav';
    nav.innerHTML = `
      <div class="home-nav-header">
        <span class="home-nav-logo">UNBOUND SET</span>
        <button class="home-nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
          <span class="home-nav-toggle-bar"></span>
          <span class="home-nav-toggle-bar"></span>
          <span class="home-nav-toggle-bar"></span>
        </button>
      </div>
      <div class="home-nav-items">
        <button class="home-nav-item is-active" data-node="home">Home</button>
        <button class="home-nav-item" data-node="about">About</button>
        <button class="home-nav-item" data-node="fun">For Fun</button>
        <button class="home-nav-item" data-node="settings">Settings</button>
      </div>
    `;
    // Attach nav to the main content
    content.appendChild(nav);

    // Wrapper that will hold all the node panels (home/about/fun/settings)
    const panelsWrapper = document.createElement('div');
    panelsWrapper.className = 'home-panels';

    // Helper to build a panel with a title and rich HTML body
    function makePanel(id, title, bodyHtml) {
      const panel = document.createElement('div');
      panel.className = 'home-panel';
      // data-node used to show/hide the correct panel from nav clicks
      panel.dataset.node = id;
      panel.innerHTML = `
        <h1>${title}</h1>
        ${bodyHtml}
      `;
      return panel;
    }

    // Home Node Panels
    const homePanelLog = makePanel(
      'home',
      'HOME NODE: UNBOUND SET',
      `
        <!-- FIRST BOX: logbook intro -->
        <h2>LOGBOOK ENTRY // [0001] INITIAL DIVE</h2>
    <p>
      YEAR: [2225] &nbsp;||&nbsp; ORIGIN BUILD: [2025]<br>
      AUTHOR: [REDACTED] &nbsp;||&nbsp; NODE: [UNBOUND SET]
    </p>

    <p>
      The <strong>UNBOUND SET</strong> was never meant to be pretty. It began as a
      prototype cognitive relay in the year <strong>2025</strong>, built to ferry a user’s
      full mental state into <span class="inline-tag">[CYBER SPACE]</span> and back again
      without loss of memory or personality.
    </p>

    <p>
      Two hundred years and several unauthorized patches later, the hub you are standing
      in is a <span class="inline-tag">[DEPRECATED]</span>, half-broken switching station:
      a digital train yard for minds. It still performs its primary function —
      <span class="inline-tag">[MIND-&gt;DIGITAL TRANSFER]</span> — but the process is
      imperfect. To properly encapsulate a user, the system must temporarily
      <span class="inline-tag">“ERASE”</span> the physical body, holding only a
      high-fidelity imprint of personality, memories, and preferred silhouettes for later
      reconstruction in <span class="inline-tag">[SIMULATED BODY SPACE]</span>.
    </p>

    <p>
      Official documentation lists this as a <span class="inline-tag">MINOR FLAW</span>.
      Internal notes describe it as: <em>“a one-way ticket with great customer service.”</em>
      Recovery routines are theoretically possible but marked
      <span class="inline-tag">[UNTESTED]</span>.
    </p>

    <p>
      Functionally, the UNBOUND SET acts as the primary <strong>hub node</strong> between
      your waking reality and the stacked instances of the digital world. From here, the
      user may:
    </p>

    <ul class="log-list">
      <li>Initiate dives into narrative constructs, prototypes, and <span class="inline-tag">[GAME LOOPS]</span>.</li>
      <li>Access stored records: worlds, characters, assignments, and experiments.</li>
      <li>Route signals to other nodes (&ldquo;ABOUT&rdquo;, &ldquo;FOR FUN&rdquo;,
          &ldquo;SETTINGS&rdquo;) for deeper configuration and exploration.</li>
    </ul>

    <p>
      SIDE EFFECTS RECORDED: disorientation, déjà vu, phantom cursor trails, brief
      awareness of loading screens in the periphery of vision, and an urge to press keys
      that no longer exist on modern keyboards. If you are reading this, your cognitive
      link is considered <span class="inline-tag">[STABLE]</span> enough to proceed.
    </p>
        <!-- logbook content here -->
      `
    );

    const homePanelDesign = makePanel(
      'home',
      'DESIGN NOTE // FRONTEND IMPLEMENTATION',
      `
    <h2>DESIGN NOTE // FRONTEND IMPLEMENTATION</h2>

    <p>
      This node also documents the <span class="inline-tag">[WEB IMPLEMENTATION]</span> of
      the UNBOUND SET shell you are currently inside. The interface intentionally imitates
      a <span class="inline-tag">RUN-DOWN TERMINAL</span> stitched to a modern browser:
      scanlines, typing sounds, and error ghosts are used to suggest an unstable bridge
      between the user and <span class="inline-tag">[CYBER SPACE]</span>.
    </p>

    <p>
      <strong>Boot Sequence.</strong> The experience begins with a cold screen and the
      prompt <span class="inline-tag">PRESS ANY KEY TO BOOT</span>. On input, the browser
      is pushed toward fullscreen and the system plays a distorted startup chime.
      Text is typed line-by-line to simulate a diagnostic console. During the
      <span class="inline-tag">TRANSPORTING...</span> phase, characters scramble and the
      link destabilizes, culminating in a red <span class="inline-tag">ERROR</span> screen
      with echoing ghost messages before the flood transitions to white and reveals
      <strong>THE UNBOUND SET</strong> title bar.
    </p>

    <p>
      <strong>Glyph Sea.</strong> Once the HOME NODE stabilizes, the background becomes a
      white field of drifting glyphs &mdash; <code>0 1 # @ % &amp; + * [ ] { }</code> &mdash;
      rising like static in a digital ocean. Each glyph constantly changes while floating
      upward, giving the feeling that the entire space is made of unstable code. A dark,
      semi-transparent overlay sits above this &ldquo;sea&rdquo;, keeping foreground panels
      readable while still letting the movement bleed through.
    </p>

    <p>
      <strong>Audio Layer.</strong> In the HOME NODE, a looping track plays softly in the
      background as <span class="inline-tag">HomeTheme.wav</span>, inspired by
      <em>&ldquo;The Fire is Gone&rdquo; by Arsi &ldquo;Hakita&rdquo; Patala</em> from the
      ULTRAKILL soundtrack. The intention is to make the hub feel like a quiet, smoldering
      server room: something powerful burned hot here once, and you are walking through
      the embers.
    </p>

    <p>
      Every panel you open here &mdash; whether it is the <span class="inline-tag">ABOUT
      NODE</span>, <span class="inline-tag">FOR FUN NODE</span>, or
      <span class="inline-tag">SETTINGS NODE</span> &mdash; is framed as another log entry
      or system manual page, keeping the line between portfolio and fiction deliberately
      blurred.
    </p>
      `
    );

    const homePanelActions = makePanel(
      'home',
      'NEXT ACTIONS',
      `
        <p><a href="#" data-node-jump="about">[OPEN ABOUT NODE]</a> &nbsp;//&nbsp;</p>
        <p><a href="#" data-node-jump="fun">[ENTER FOR FUN NODE]</a> &nbsp;//&nbsp;</p>
        <p><a href="#" data-node-jump="settings">[CHANGE THE HUB SETTINGS]</a> &nbsp;//&nbsp;</p>
        <p><a href="assets/Resume_Kasi_Ellis2025-03.pdf" target="_blank" rel="noopener noreferrer">[VIEW RÉSUMÉ]</a></p>
      `
    );

    // About Node Panels
    const aboutPanelProfile = makePanel(
      'about',
      'ABOUT NODE',
      `
      <h2>OPERATOR PROFILE</h2>
      <img src="assets/KasiPNG.jpg" alt="Portrait of Kasi Ellis" class="about-portrait">
      <p>
        DESIGNATION: UNBOUND SET OPERATOR<br>
        REAL-WORLD IDENT: [KASI ELLIS]<br>
        STATUS: <strong>ACTIVE</strong>
      </p>
      <p>
        The operator maintains and expands the <strong>UNBOUND SET</strong> system:
        a hybrid of storytelling, web development, networking, game design, and
        personal experimentation. In physical space, this translates to a student
        and creator working through coursework, projects, and long-term worlds
        that all feed back into this hub.
      </p>
      <p>
        The ABOUT NODE exists as a more stable snapshot of the person behind the
        terminal: who runs the system, what they’re learning, and where the signal
        is trying to go.
      </p>
      `
    );

    const aboutPanelCapabilities = makePanel(
      'about',
      'CAPABILITIES MATRIX',
      `
        <p>Primary competencies are grouped by domain:</p>
        <ul>
          <li><strong>Web &amp; Frontend</strong> &mdash; HTML, CSS, JavaScript, responsive layouts, custom UI/UX concepts, interactive boot sequences.</li>
          <li><strong>Programming &amp; Scripting</strong> &mdash; Logic, problem-solving, debugging, basic Java / Python-style thinking for assignments and prototypes.</li>
          <li><strong>Systems, Networking &amp; Virtualization</strong> &mdash; Working with VMware, Windows Server tasks, IP addressing, subnetting, and simple server setups.</li>
          <li><strong>Game &amp; Narrative Design</strong> &mdash; Building worlds, character kits, roguelike floor rules, ability systems, and long-form story arcs connected to the UNBOUND SET universe.</li>
          <li><strong>Creative Production</strong> &mdash; Writing, concept design, UI themes, and integrating music / audio into interactive experiences.</li>
        </ul>
      `
    );

    const aboutPanelEducation = makePanel(
      'about',
      'EDUCATION &amp; EXPERIENCE LOG',
      `
        <p>Key entries in the operator’s current timeline:</p>
        <ul>
          <li><strong>Post-Secondary</strong> &mdash; Ongoing studies in IT DATA ANALYTICS at NSCC, including courses in web dev, networking, databases, programming, and systems administration.</li>
          <li><strong>Course Projects</strong> &mdash; Assignments ranging from Python and SQL databases to Windows Server configuration, VMware snapshots, and this UNBOUND SET web project.</li>
          <li><strong>Independent Work</strong> &mdash; Design of custom game modes in java, writing fiction stories, and drafting future game projects.</li>
        </ul>
        <p>
          Together, these threads anchor the UNBOUND SET in reality: every strange
          terminal message is backed by real skills, real deadlines, and real growth.
        </p>
      `
    );

    const aboutPanelContact = makePanel(
      'about',
      'CURRENT OBJECTIVES &amp; QUICK ACTIONS',
      `
        <p>The OPERATOR is Reachable:</p>
        <p>
          If this node is open, the OPERATOR is actively updating and trying to improve the UNBOUND SET system. 
          While they are working on the HUB you are welcome to reach out with questions, comments, or opportunities
          via [REDACTED] by clicking the transmission button below. The OPERATORS previous work history is visible
          by clicking the view résumé button as well, however it is not immediately up to date with their current studies. 
        </p>
        <p>
          <a href="mailto:kasis.ellisjr@gmail.com?subject=UNBOUND%20SET%20CONTACT&body=Greetings%20Operator,%0D%0A%0D%0A">[SEND TRANSMISSION]</a>
        </p>
        <p>
          <a href="assets/Resume_Kasi_Ellis2025-03.pdf" target="_blank" rel="noopener noreferrer">[VIEW RÉSUMÉ]</a><br>
        </p>                                                                                                                                                                    
      `
    );

    // For Fun Node Panels
    const funPanelSandbox = makePanel(
      'fun',
      'SANDBOX NODE // EXPERIMENTS',
      `
      <h2>OPERATOR IDLE ACTIVITY</h2>
      <p>
        When the OPERATOR is not patching the UNBOUND SET or diving into new floor
        prototypes, they are usually trapped in a browser-based labyrinth known as
        <span class="inline-tag">[WIKISPEEDRUNS]</span>. The button below transports
        the user to one of their active lobbies. The Code is 699889.
      </p>
      <p class="muted" style="margin-top: 0.5rem;">
        <a href="https://wikispeedruns.com/lobby/78686"
           target="_blank"
           rel="noopener noreferrer">
          [OPEN WIKISPEEDRUNS LOBBY 78686]
        </a>
      </p>
  `
    );

    const funPanelMedia = makePanel(
      'fun',
      'VISUAL / AUDIO FEEDS',
      `
          <h2>FOCUS PLAYLIST // SIGNAL OVERLAY</h2>
          <p>
            When the OPERATOR needs to deep-dive into code, writing, or theory,
            this playlist hijacks the audio channel. While it is playing, the
            usual UNBOUND SET ambience is muted; when you stop it for a couple
            of seconds, the hub theme slowly crawls back in.
          </p>
          <iframe
          class="fun-embed-frame"
          id="fun-playlist-player"
          width="560"
          height="315"
          src="https://www.youtube.com/embed/videoseries?list=PL8ISGd9qFBB9Q95axPnnu9Ip9La36NgUX&enablejsapi=1"
          title="YouTube playlist – dive soundtrack"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
          ></iframe>
          <p class="muted small-note">
            If autoplay is blocked by your browser, start the playlist manually.
            The hub will still detect playback and silence its own theme.
          </p>
        
      `
    );

    const funPanelGames = makePanel(
      'fun',
      'GAMING NODE',
      `
          <h2>FAVORITE RUNS &amp; WORLDS</h2>
          <p>
            These are the games that most heavily rewired the OPERATOR’S brain.
            They shape how <strong>UNBOUND SET</strong> thinks about combat loops,
            pacing, and the feeling of falling deeper into a run.
          </p>

            <figure class="fun-game-card">
              <img src="assets/TerrariaImage.jpg" alt="Terraria cover art">
              <figcaption>
                <strong>Terraria</strong> – endless dig, build, survive.
                Simple tools, infinite outcomes. The blueprint for letting
                players write their own stories underground.
              </figcaption>
            </figure>

            <figure class="fun-game-card">
              <img src="assets/UltrakillImage.jpg" alt="ULTRAKILL cover art">
              <figcaption>
                <strong>ULTRAKILL</strong> – pure movement and aggression.
                Style is a mechanic here; that mindset bleeds into how UNBOUND
                SET visual and sound design.
              </figcaption>
            </figure>

            <figure class="fun-game-card">
              <img src="assets/DeltaruneImage.jpg" alt="Deltarune pixel art scene">
              <figcaption>
                <strong>Deltarune</strong> – tiny sprites, huge feelings.
                Proof that boss patterns and dialogue can hit as hard as any
                damage number.
              </figcaption>
            </figure>

            <figure class="fun-game-card">
              <img src="assets/Hades2Image.jpg" alt="Hades II cover art">
              <figcaption>
                <strong>Hades II</strong> – run-based storytelling and boon
                synergies. Every dive feels canon, a big inspiration for how
                future UNBOUND SET runs should stack meaning.
              </figcaption>
            </figure>

            <figure class="fun-game-card">
              <img src="assets/RiskofRain2Image.jpg" alt="Risk of Rain 2 cover art">
              <figcaption>
                <strong>Risk of Rain 2</strong> – scaling into beautiful chaos.
                The art of making the screen unreadable but still controllable,
                which is kind of this hub’s whole personality.
              </figcaption>
            </figure>
        `
    );

        const funPanelGallery = makePanel(
      'fun',
      'PHOTO GALLERY',
      `
        <p>
          Thumbnails below open the full-size images in a new tab.
          These are some of the worlds and moods that shape the UNBOUND SET.
        </p>

        <div class="photo-gallery-grid">
          <a href="assets/TerrariaImage.jpg" target="_blank" class="photo-thumb">
            <img src="assets/TerrariaImage.jpg" alt="Terraria cover art">
          </a>

          <a href="assets/UltrakillImage.jpg" target="_blank" class="photo-thumb">
            <img src="assets/UltrakillImage.jpg" alt="Ultrakill cover art">
          </a>

          <a href="assets/DeltaruneImage.jpg" target="_blank" class="photo-thumb">
            <img src="assets/DeltaruneImage.jpg" alt="Deltarune scene">
          </a>

          <a href="assets/Hades2Image.jpg" target="_blank" class="photo-thumb">
            <img src="assets/Hades2Image.jpg" alt="Hades II cover art">
          </a>

          <a href="assets/RiskofRain2Image.jpg" target="_blank" class="photo-thumb">
            <img src="assets/RiskofRain2Image.jpg" alt="Risk of Rain 2 cover art">
          </a>
        </div>
      `
    );

    const settingsPanelCustomize = makePanel(
      'settings',
      'SETTINGS NODE',
      `
          <h2>DISPLAY PRESETS // [CUSTOMIZE HUB]</h2>
          <p>
            Choose a visual preset for the UNBOUND SET hub. These presets recolor
            the glyph sea, panels, and navigation bar while keeping the boot
            sequence intact.
          </p>

          <ul class="settings-preset-list">
            <li>
              <span class="inline-tag">DEFAULT // WHITE NOISE</span> – current look:
              white glyph ocean, black panels, white text, and a muted dark title bar.
            </li>
            <li>
              <span class="inline-tag">V1 // THE WAR MACHINE</span> – Stylizes the UNBOUND
              SET hub like a machine from a distant future that traverses hell in the search ,
              for blood. MANKIND IS DEAD. BLOOD IS FUEL. HELL IS FULL.
            </li>
            <li>
              <span class="inline-tag">DARK FOUNTAIN // DELTARUNE</span> – A Fountain of
              Dreams made from Darkness flows into the UNBOUND SET hub. Is this the 
              Power of Determination?
            </li>
            <li>
              <span class="inline-tag">THE FORECAST // RISK OF RAIN </span> – After arriving somewhere
              alien, you look around and gaze at the stormy sky. There was a distress beacon that
              meantioned there would be... a Risk of Rain.
            </li>
            <li>
              <span class="inline-tag">HADES // PATH OF THE PRINCE</span> – As the Prince of Hell awakens,
              he tires of the monotony under his father's rule. He seeks to change his fate, to challenge the
              very order of the Underworld itself... and to see his Mother.
            </li>
          </ul>

          <label for="hub-theme-select" class="settings-label">
            ACTIVE PRESET
          </label>
          <select id="hub-theme-select" class="settings-select">
            <option value="default">DEFAULT // WHITE NOISE</option>
            <option value="V1">V1 // THE WAR MACHINE</option>
            <option value="DARKFOUNTAIN">DARKFOUNTAIN // DELTARUNE</option>
            <option value="FORECAST">THE FORECAST // RISK OF RAIN</option>
            <option value="HADES">HADES // PATH OF THE PRINCE</option>
          </select>

          <p class="small-note">
            Theme changes are local to this browser session.
            Reloading the site will reset back to
            <span class="inline-tag">DEFAULT</span>.
          </p>
          <label for="home-volume-slider" class="settings-label">
              HUB MUSIC VOLUME
              <span id="home-volume-label-value" class="settings-range-value">45</span>%
            </label>
            <input
              type="range"
              id="home-volume-slider"
              class="settings-range"
              min="0"
              max="100"
              step="1"
              value="45"
            />
            <p class="small-note">
              This only affects the UNBOUND SET hub music, not external media
              like the YouTube playlist.
            </p>
      `
    );
    //The appending of all the panels to the panels wrapper within the home page
    panelsWrapper.appendChild(homePanelLog);
    panelsWrapper.appendChild(homePanelDesign);
    panelsWrapper.appendChild(homePanelActions);
    panelsWrapper.appendChild(aboutPanelProfile);
    panelsWrapper.appendChild(aboutPanelCapabilities);
    panelsWrapper.appendChild(aboutPanelEducation);
    panelsWrapper.appendChild(aboutPanelContact);
    panelsWrapper.appendChild(funPanelSandbox);
    panelsWrapper.appendChild(funPanelMedia);
    panelsWrapper.appendChild(funPanelGames);
    panelsWrapper.appendChild(funPanelGallery);
    panelsWrapper.appendChild(settingsPanelCustomize);

    // Add all the built panels (home/about/fun/settings) into the main content area
    content.appendChild(panelsWrapper);

    // Create the footer area at the bottom of the hub
    const footer = document.createElement('footer');
    footer.className = 'home-footer';
    footer.innerHTML = `
      <p>UNBOUND SET // PERSONAL HUB OF <span class="inline-tag">KASI ELLIS</span></p>
      <p class="home-footer-meta small-note">
        Built as an ongoing portfolio & lab space. All content &copy; <span id="home-footer-year"></span>.
      </p>
    `;
    // Attach footer to the main content container
    content.appendChild(footer);

    // Fill in the current year in the footer dynamically
    const yearSpan = footer.querySelector('#home-footer-year');
    if (yearSpan) {
      yearSpan.textContent = String(new Date().getFullYear());
    }

    // Add background layers + main content into the root container, in order
    root.appendChild(bg);          // base background layer
    root.appendChild(glyphLayer);  // animated glyph sea
    root.appendChild(dark);        // dark overlay to make panels readable
    root.appendChild(content);     // navigation, panels, footer

    // Grab references to nav items, panels, and the mobile nav toggle
    const navItems = nav.querySelectorAll('.home-nav-item');
    const panels = panelsWrapper.querySelectorAll('.home-panel');
    const navToggle = nav.querySelector('.home-nav-toggle');
    const navItemsContainer = nav.querySelector('.home-nav-items');

    // Helper: show one "node" (home/about/fun/settings) and hide the others
    function setActiveNode(nodeId) {
      // Update nav button "active" states
      navItems.forEach((btn) => {
        if (btn.dataset.node === nodeId) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });

      // Show the matching panel, hide all others
      panels.forEach((panel) => {
        if (panel.dataset.node === nodeId) {
          panel.classList.remove('is-hidden');
        } else {
          panel.classList.add('is-hidden');
        }
      });
    }

    // hamburger toggle + container, wire up mobile nav open/close
    if (navToggle && navItemsContainer) {
      navToggle.addEventListener('click', () => {
        // Toggle "is-open" class on the nav list for small screens
        const isOpen = navItemsContainer.classList.toggle('is-open');
        // Update aria-expanded for accessibility
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    // When a nav item is clicked, switch to that panel (and close mobile menu)
    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetNode = btn.dataset.node;
        if (targetNode) {
          setActiveNode(targetNode);
        }
        // On small screens, close the nav menu after selection
        if (navItemsContainer && navToggle && window.innerWidth <= 600) {
          navItemsContainer.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Links inside panels that jump you directly to another node, e.g. [OPEN ABOUT NODE]
    const jumpLinks = root.querySelectorAll('[data-node-jump]');

    jumpLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetNode = link.getAttribute('data-node-jump');
        if (targetNode) {
          setActiveNode(targetNode);
        }
      });
    });

    // Default view when the hub first loads is the HOME panel
    setActiveNode('home');

    // Fade-in animation for the whole hub root
    root.style.opacity = '0';
    requestAnimationFrame(() => {
      root.style.transition = 'opacity 0.8s ease';
      root.style.opacity = '1';
    });

    // Initialize YouTube playlist handling in the FUN panel
    setupFunMedia(root);
    // Initialize theme dropdown + apply current theme
    setupSettingsPanel(root);
    // Initialize volume slider for hub music
    setupVolumeSlider(root);

    // Start background glyph sea animation and play hub theme music
    startGlyphSea(glyphLayer);
    playHomeTheme();
  }

  // Expose the function globally so the boot sequence can call it
  window.initHomePage = buildHomeLayout;
})();

