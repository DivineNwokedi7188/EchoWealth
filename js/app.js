/* ECHO WEALTH — GAMING PROTOTYPE
   100 coins = ₦1.00 simulated wallet balance.
   All balances are local demonstration data, not real money.
*/

document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const pages = $$('[data-page]');
  const navItems = $$('.nav-item');

  let currentPage = 'home';

  const STORAGE_KEY = 'echoWealthArcade_v1';
  const COINS_PER_NAIRA = 100;
  const today = new Date().toLocaleDateString('en-CA');

  // ==========================================
  // STATE AND STORAGE
  // ==========================================

  const defaultState = () => ({
    date: today,
    coins: 0,
    totalCoinsEarned: 0,
    walletBalance: 0,
    totalConverted: 0,
    gamesPlayed: 0,
    bestScore: 0,

    bests: {
      memory: 0,
      reaction: null,
      number: 0,
      match3: 0
    },

    daily: {
      games: 0,
      coins: 0,
      numberCorrect: 0
    },

    activity: []
  });

  function loadState() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      );

      const state = {
        ...defaultState(),
        ...(saved || {})
      };

      state.coins = Math.max(
        0,
        Number(state.coins) || 0
      );

      state.totalCoinsEarned = Math.max(
        0,
        Number(state.totalCoinsEarned) || 0
      );

      state.walletBalance = Math.max(
        0,
        Number(state.walletBalance) || 0
      );

      state.totalConverted = Math.max(
        0,
        Number(state.totalConverted) || 0
      );

      state.bests = {
        ...defaultState().bests,
        ...(state.bests || {})
      };

      state.daily = {
        ...defaultState().daily,
        ...(state.daily || {})
      };

      state.activity = Array.isArray(state.activity)
        ? state.activity
        : [];

      if (state.date !== today) {
        state.date = today;
        state.daily = defaultState().daily;
      }

      return state;
    } catch (error) {
      console.error('Could not load saved state:', error);
      return defaultState();
    }
  }

  let state = loadState();

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error('Could not save state:', error);

      showDialog(
        'Storage error',
        'Your changes could not be saved. Check your browser storage settings.'
      );
    }
  }

  function renderIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  // ==========================================
  // GENERAL DIALOGS
  // ==========================================

  const appDialog = $('#appDialog');

  function showDialog(title, message) {
    if (!appDialog) {
      alert(`${title}\n\n${message}`);
      return;
    }

    $('#dialogTitle').textContent = title;
    $('#dialogMessage').textContent = message;

    if (typeof appDialog.showModal === 'function') {
      appDialog.showModal();
    } else {
      alert(`${title}\n\n${message}`);
    }

    renderIcons();
  }

  function closeAppDialog() {
    if (appDialog?.open) {
      appDialog.close();
    }
  }

  $('#closeDialog')?.addEventListener(
    'click',
    closeAppDialog
  );

  $('#dialogConfirm')?.addEventListener(
    'click',
    closeAppDialog
  );

  appDialog?.addEventListener('click', e => {
    if (e.target === appDialog) {
      closeAppDialog();
    }
  });

  // ==========================================
  // NAVIGATION
  // ==========================================

  function navigateTo(pageName) {
    const target = $(
      `[data-page="${pageName}"]`
    );

    if (!target) return;

    currentPage = pageName;

    pages.forEach(page => {
      const active =
        page.dataset.page === pageName;

      page.classList.toggle('active', active);
      page.hidden = !active;
    });

    navItems.forEach(item => {
      const active =
        item.dataset.go === pageName;

      item.classList.toggle('active', active);

      if (active) {
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    window.scrollTo({
      top: 0,
      behavior: matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
        ? 'auto'
        : 'smooth'
    });

    renderIcons();
  }

  $$('[data-go]').forEach(button => {
    button.addEventListener('click', () => {
      navigateTo(button.dataset.go);
    });
  });

  $('#notificationButton')?.addEventListener(
    'click',
    () => {
      showDialog(
        'Notifications',
        'You’re all caught up. Your new achievements and updates will appear here.'
      );
    }
  );

  // ==========================================
  // SETTINGS AND OPPORTUNITIES
  // ==========================================

  $$('[data-setting]').forEach(button => {
    button.addEventListener('click', () => {
      const messages = {
        account:
          'Personal account information will be available when account registration is implemented.',

        security:
          'Account security settings will be available when secure authentication is implemented.',

        notifications:
          'Notification preferences will be available in a future version.',

        support:
          'Support information and contact options will be added before launch.'
      };

      showDialog(
        'Account settings',
        messages[button.dataset.setting] ||
          'This feature is not available yet.'
      );
    });
  });

  $$('[data-opportunity]').forEach(button => {
    button.addEventListener('click', () => {
      showDialog(
        'Opportunity details',
        button.dataset.opportunity === 'urban'
          ? 'Urban Essentials is a demonstration concept. No investment can be made through this prototype. Commercial terms, risks, and applicable regulatory requirements must be established before launch.'
          : 'Everyday Motion is a demonstration concept. No investment can be made through this prototype. Commercial terms, risks, and applicable regulatory requirements must be established before launch.'
      );
    });
  });

  // ==========================================
  // ACTIVITY HISTORY
  // ==========================================

  function addActivity(
    title,
    detail,
    amount,
    icon = 'gamepad-2'
  ) {
    state.activity.unshift({
      title,
      detail,
      amount,
      icon,

      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    state.activity = state.activity.slice(0, 12);
  }

  function escapeHTML(value) {
    return String(value).replace(
      /[&<>"']/g,
      ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[ch]
    );
  }

  function renderActivity(container) {
    if (!container) return;

    if (!state.activity.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="activity"></i>
          <p>Your game sessions and rewards will appear here.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = state.activity
      .slice(0, 6)
      .map(item => `
        <article class="activity-item">
          <span class="activity-icon">
            <i data-lucide="${escapeHTML(
              item.icon || 'gamepad-2'
            )}"></i>
          </span>

          <div class="activity-description">
            <strong>${escapeHTML(item.title)}</strong>

            <span>
              ${escapeHTML(item.detail)}
              · ${escapeHTML(item.time)}
            </span>
          </div>

          <span class="activity-amount green-text">
            ${escapeHTML(item.amount)}
          </span>
        </article>
      `)
      .join('');
  }

  // ==========================================
  // GAME REWARDS
  // ==========================================

  function awardGame(
    gameKey,
    title,
    score,
    baseReward,
    detail
  ) {
    const reward = Math.max(
      0,
      Math.round(baseReward)
    );

    state.coins += reward;
    state.totalCoinsEarned += reward;
    state.gamesPlayed += 1;

    state.daily.games += 1;
    state.daily.coins += reward;

    state.bestScore = Math.max(
      state.bestScore,
      score || 0
    );

    if (gameKey === 'memory') {
      state.bests.memory = Math.max(
        state.bests.memory,
        score || 0
      );
    }

    if (gameKey === 'number') {
      state.bests.number = Math.max(
        state.bests.number,
        score || 0
      );
    }

    if (gameKey === 'match3') {
      state.bests.match3 = Math.max(
        state.bests.match3 || 0,
        score || 0
      );
    }

    addActivity(
      `${title} completed`,
      detail,
      `+${reward} coins`,
      'gamepad-2'
    );

    saveState();
    renderDashboard();

    return reward;
  }

  // ==========================================
  // WALLET CONVERSION
  // 100 COINS = ₦1.00
  // ==========================================

  function formatNaira(amount) {
    return Number(amount || 0).toLocaleString(
      'en-NG',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );
  }

  function convertCoinsToMoney(coinsToConvert) {
    const amount = Number(coinsToConvert);

    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0
    ) {
      showDialog(
        'Invalid amount',
        'Enter a positive whole number of coins to convert.'
      );

      return false;
    }

    if (amount > state.coins) {
      showDialog(
        'Insufficient coins',
        `You currently have ${state.coins.toLocaleString()} coins available.`
      );

      return false;
    }

    const nairaAmount =
      amount / COINS_PER_NAIRA;

    // Remove converted coins.
    state.coins -= amount;

    // Add the equivalent amount to the wallet.
    state.walletBalance = Number(
      (
        Number(state.walletBalance || 0) +
        nairaAmount
      ).toFixed(2)
    );

    // Track the total value converted.
    state.totalConverted = Number(
      (
        Number(state.totalConverted || 0) +
        nairaAmount
      ).toFixed(2)
    );

    // Record the transaction.
    addActivity(
      'Coins converted',
      `${amount.toLocaleString()} coins converted to wallet balance`,
      `+₦${nairaAmount.toFixed(2)}`,
      'wallet'
    );

    // Save using the existing storage key.
    saveState();

    // Refresh displayed balances.
    renderDashboard();

    showDialog(
      'Conversion successful!',
      `${amount.toLocaleString()} coins have been converted into ₦${nairaAmount.toFixed(2)} and added to your simulated wallet balance.`
    );

    return true;
  }

  function setupWalletConversion() {
    const coinsInput = $('#coinsToConvert');
    const preview = $('#conversionPreview');
    const convertButton = $('#convertCoinsButton');
    const convertAllButton = $('#convertAllCoinsButton');

    // The conversion interface must exist in index.html.
    if (
      !coinsInput ||
      !preview ||
      !convertButton
    ) {
      return;
    }

    function updatePreview() {
      const amount = Math.max(
        0,
        Number(coinsInput.value) || 0
      );

      const nairaAmount =
        amount / COINS_PER_NAIRA;

      preview.textContent =
        `You will receive ₦${nairaAmount.toFixed(2)}`;

      if (amount > state.coins) {
        preview.textContent +=
          ' — insufficient coins';
      }
    }

    coinsInput.addEventListener(
      'input',
      updatePreview
    );

    convertButton.addEventListener(
      'click',
      () => {
        const success = convertCoinsToMoney(
          coinsInput.value
        );

        if (success) {
          coinsInput.value = '';
          updatePreview();
        }
      }
    );

    if (convertAllButton) {
      convertAllButton.addEventListener(
        'click',
        () => {
          if (state.coins <= 0) {
            showDialog(
              'No coins available',
              'Play a game first to earn coins for conversion.'
            );

            return;
          }

          const success = convertCoinsToMoney(
            state.coins
          );

          if (success) {
            coinsInput.value = '';
            updatePreview();
          }
        }
      );
    }

    updatePreview();
  }

  // ==========================================
  // DAILY CHALLENGES
  // ==========================================

  function renderChallenges() {
    const gamesDone = state.daily.games;
    const coinsDone = state.daily.coins;
    const numberDone = state.daily.numberCorrect;

    const quests = [
      {
        title: 'Warm-up round',
        detail: 'Complete any game today.',
        done: gamesDone >= 1,
        progress: `${Math.min(gamesDone, 1)} / 1`,
        pct: Math.min(gamesDone, 1) * 100
      },

      {
        title: 'Coin collector',
        detail: 'Earn 20 demo coins today.',
        done: coinsDone >= 20,
        progress: `${Math.min(coinsDone, 20)} / 20`,
        pct: Math.min(coinsDone / 20, 1) * 100
      },

      {
        title: 'Number whiz',
        detail: 'Answer 5 Number Dash questions correctly today.',
        done: numberDone >= 5,
        progress: `${Math.min(numberDone, 5)} / 5`,
        pct: Math.min(numberDone / 5, 1) * 100
      }
    ];

    const list = $('#challengeList');

    if (list) {
      list.innerHTML = quests.map(q => `
        <article class="challenge-card ${
          q.done ? 'challenge-complete' : ''
        }">

          <span class="challenge-icon">
            <i data-lucide="${
              q.done ? 'check-circle-2' : 'target'
            }"></i>
          </span>

          <div class="challenge-body">
            <div class="challenge-title-row">
              <strong>${q.title}</strong>
              <span class="challenge-progress-text">
                ${q.progress}
              </span>
            </div>

            <p class="muted-text">${q.detail}</p>

            <div class="progress-track">
              <div
                class="progress-fill"
                style="width:${q.pct}%"
              ></div>
            </div>
          </div>

          <span class="challenge-state">
            ${q.done ? 'DONE' : 'IN PROGRESS'}
          </span>
        </article>
      `).join('');
    }

    const completed =
      quests.filter(q => q.done).length;

    const homeCount = $('#homeChallengeCount');

    if (homeCount) {
      homeCount.textContent =
        `${completed} / ${quests.length}`;
    }

    const gameCount = $('#challengeCount');

    if (gameCount) {
      gameCount.textContent =
        `${completed} / ${quests.length}`;
    }

    const fill = $('#homeChallengeProgress');

    if (fill) {
      fill.style.width =
        `${completed / quests.length * 100}%`;
    }

    const progressCount = $('.progress-count');

    if (progressCount && !homeCount) {
      progressCount.textContent =
        `${completed} / ${quests.length}`;
    }
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  function renderDashboard() {
    const formattedWalletBalance = Number(state.walletBalance || 0).toLocaleString(
        'en-NG',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

    // Home page balance
    const homeBalance = document.getElementById('walletBalance');

    if (homeBalance) {
        homeBalance.textContent = formattedWalletBalance;
    }

    // Wallet page balance
    const walletPageBalance = document.getElementById('walletPageBalance');

    if (walletPageBalance) {
        walletPageBalance.textContent = formattedWalletBalance;
    }


    const coinBalance = $('#coinBalance');

    if (coinBalance) {
      coinBalance.textContent =
        state.coins.toLocaleString();
    }

    const walletCoins = $('#walletCoins');

    if (walletCoins) {
      walletCoins.textContent =
        state.coins.toLocaleString();
    }

    const stats = {
      gamesPlayedStat: state.gamesPlayed,
      coinsEarnedStat: state.totalCoinsEarned,
      bestScoreStat: state.bestScore
    };

    Object.entries(stats).forEach(
      ([id, value]) => {
        const el = document.getElementById(id);

        if (el) {
          el.textContent =
            Number(value).toLocaleString();
        }
      }
    );

    const totalConverted = $('#totalConverted');

    if (totalConverted) {
      totalConverted.textContent =
        `₦${formatNaira(state.totalConverted)}`;
    }

    renderActivity($('#recentActivity'));
    renderActivity($('#walletActivity'));
    renderChallenges();
    renderRecords();
    renderIcons();
  }

  // ==========================================
  // GAME RECORDS
  // ==========================================

  function renderRecords() {
    const container = $('#gameRecords');

    if (!container) return;

    const reaction =
      state.bests.reaction == null
        ? '—'
        : `${state.bests.reaction} ms`;

    const rows = [
      [
        'Memory Rush',
        state.bests.memory
          ? `Level ${state.bests.memory}`
          : 'Not played',
        'brain'
      ],

      [
        'Quick Reflex',
        reaction,
        'zap'
      ],

      [
        'Number Dash',
        `${state.bests.number || 0} / 100`,
        'calculator'
      ]
    ];

    container.innerHTML = rows.map(row => `
      <article class="record-card">
        <span class="record-icon">
          <i data-lucide="${row[2]}"></i>
        </span>

        <span class="record-name">${row[0]}</span>
        <strong>${row[1]}</strong>
      </article>
    `).join('');
  }

  // ==========================================
  // REUSABLE GAME DIALOG
  // ==========================================

  function createGameDialog(
    title,
    subtitle,
    body
  ) {
    const dialog = document.createElement('dialog');

    dialog.className = 'app-dialog game-dialog';

    dialog.innerHTML = `
      <div class="dialog-content game-dialog-content">
        <button
          class="dialog-close game-close"
          type="button"
          aria-label="Close game"
        >
          <i data-lucide="x"></i>
        </button>

        <p class="eyebrow">ECHO ARCADE</p>
        <h2>${title}</h2>

        <p class="muted-text game-subtitle">
          ${subtitle}
        </p>

        ${body}
      </div>
    `;

    document.body.appendChild(dialog);

    const clean = () => dialog.remove();

    $('.game-close', dialog).addEventListener(
      'click',
      () => dialog.close()
    );

    dialog.addEventListener(
      'close',
      clean,
      { once: true }
    );

    dialog.addEventListener('click', e => {
      if (e.target === dialog) {
        dialog.close();
      }
    });

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      clean();

      showDialog(
        title,
        'Your browser does not support this game window. Please use an updated browser.'
      );

      return null;
    }

    renderIcons();

    return dialog;
  }

  // ==========================================
  // GAME 1: MEMORY RUSH
  // ==========================================

  function startMemoryGame() {
    let sequence = [];
    let input = [];
    let level = 1;
    let accepting = false;
    let ended = false;
    let recorded = false;

    const symbols = ['◆', '●', '▲', '■'];

    const dialog = createGameDialog(
      'Memory Rush',
      'Watch the glowing tiles, then repeat the sequence.',
      `
        <div class="game-mini-stats">
          <span>
            LEVEL
            <strong class="memory-level-value">1</strong>
          </span>

          <span>
            BEST
            <strong>${state.bests.memory || 0}</strong>
          </span>
        </div>

        <div class="memory-grid">
          ${symbols.map((s, i) => `
            <button
              type="button"
              class="memory-tile"
              data-tile="${i}"
              disabled
              aria-label="Memory tile ${i + 1}"
            >${s}</button>
          `).join('')}
        </div>

        <p class="game-status memory-status" aria-live="polite">
          Ready when you are.
        </p>

        <button
          class="button button-primary button-full memory-start"
          type="button"
        >Start game</button>
      `
    );

    if (!dialog) return;

    const tiles = $$('.memory-tile', dialog);
    const status = $('.memory-status', dialog);
    const levelValue = $('.memory-level-value', dialog);
    const start = $('.memory-start', dialog);

    async function flash(index) {
      if (!dialog.open) return;

      tiles[index].classList.add('tile-active');

      await sleep(330);

      tiles[index].classList.remove('tile-active');

      await sleep(150);
    }

    async function showSequence() {
      accepting = false;

      tiles.forEach(tile => {
        tile.disabled = true;
      });

      status.textContent = 'Watch carefully…';

      await sleep(450);

      for (const item of sequence) {
        if (!dialog.open || ended) return;

        await flash(item);
      }

      if (!dialog.open || ended) return;

      input = [];
      accepting = true;

      tiles.forEach(tile => {
        tile.disabled = false;
      });

      status.textContent =
        'Your turn — repeat the sequence.';
    }

    async function finish(won) {
      if (recorded) return;

      recorded = true;
      ended = true;
      accepting = false;

      tiles.forEach(tile => {
        tile.disabled = true;
      });

      start.hidden = false;

      const reached = won
        ? level
        : Math.max(0, level - 1);

      const reward = awardGame(
        'memory',
        'Memory Rush',
        reached,
        5 + reached * 2,
        `Reached level ${reached}`
      );

      status.textContent = won
        ? `Perfect run! You completed ${reached} levels.`
        : `Round over — you reached level ${reached}.`;

      $('.game-subtitle', dialog).textContent =
        `You earned ${reward} demonstration coins. These are not cash and cannot be withdrawn.`;

      start.textContent = 'Play again';
    }

    async function handle(index) {
      if (!accepting || ended) return;

      accepting = false;

      await flash(index);

      if (!dialog.open || ended) return;

      input.push(index);

      const pos = input.length - 1;

      if (input[pos] !== sequence[pos]) {
        await finish(false);
        return;
      }

      if (input.length === sequence.length) {
        level++;

        if (level > 8) {
          await finish(true);
          return;
        }

        levelValue.textContent = level;

        status.textContent = 'Nice! Next level…';

        await sleep(450);

        sequence.push(
          Math.floor(Math.random() * symbols.length)
        );

        await showSequence();
      } else {
        accepting = true;
      }
    }

    tiles.forEach(tile => {
      tile.addEventListener('click', () => {
        handle(Number(tile.dataset.tile));
      });
    });

    start.addEventListener('click', async () => {
      sequence = [];
      input = [];
      level = 1;
      ended = false;
      recorded = false;

      levelValue.textContent = '1';
      start.hidden = true;

      sequence.push(
        Math.floor(Math.random() * symbols.length)
      );

      await showSequence();
    });
  }

  // ==========================================
  // GAME 2: QUICK REFLEX
  // ==========================================

  function startReactionGame() {
    const dialog = createGameDialog(
      'Quick Reflex',
      'Wait for green, then tap. Complete five rounds for your average.',
      `
        <div class="game-mini-stats">
          <span>
            ROUND
            <strong class="reaction-round">0 / 5</strong>
          </span>

          <span>
            BEST AVG
            <strong>
              ${state.bests.reaction == null
                ? '—'
                : `${state.bests.reaction} ms`}
            </strong>
          </span>
        </div>

        <div class="reaction-arena">
          <button
            type="button"
            class="reaction-target"
            disabled
          >READY?</button>
        </div>

        <p class="game-status reaction-status" aria-live="polite">
          Press start when you’re ready.
        </p>

        <button
          type="button"
          class="button button-primary button-full reaction-start"
        >Start 5-round challenge</button>
      `
    );

    if (!dialog) return;

    const target = $('.reaction-target', dialog);
    const status = $('.reaction-status', dialog);
    const start = $('.reaction-start', dialog);
    const roundLabel = $('.reaction-round', dialog);

    let timer = null;
    let timeout = null;
    let phase = 'idle';
    let startedAt = 0;
    let round = 0;
    let results = [];
    let finished = false;

    function clearTimers() {
      clearTimeout(timer);
      clearTimeout(timeout);
    }

    dialog.addEventListener('close', clearTimers);

    function endRound(early = false) {
      clearTimers();

      phase = 'finished';

      target.disabled = true;
      target.classList.remove('reaction-ready');

      if (early) {
        results.push(1200);
        target.textContent = 'TOO SOON';

        status.textContent =
          'Early tap counted as a missed round. Focus and try again.';
      } else {
        const ms = Math.round(
          performance.now() - startedAt
        );

        results.push(ms);
        target.textContent = `${ms} ms`;

        status.textContent =
          `Reaction time: ${ms} milliseconds.`;
      }

      roundLabel.textContent = `${round} / 5`;

      if (round >= 5) {
        finished = true;

        const avg = Math.round(
          results.reduce((a, b) => a + b, 0) /
          results.length
        );

        const reward = awardGame(
          'reaction',
          'Quick Reflex',
          Math.max(0, 1000 - avg),
          Math.max(5, Math.round(25 - avg / 100)),
          `Average reaction: ${avg} ms`
        );

        state.bests.reaction =
          state.bests.reaction == null
            ? avg
            : Math.min(state.bests.reaction, avg);

        saveState();
        renderDashboard();

        status.textContent =
          `Challenge complete! Average: ${avg} ms. You earned ${reward} demo coins.`;

        start.textContent = 'Play again';
        start.disabled = false;
      } else {
        start.textContent = 'Next round';
        start.disabled = false;
      }
    }

    function beginRound() {
      clearTimers();

      phase = 'waiting';

      target.disabled = false;
      target.classList.remove('reaction-ready');
      target.textContent = 'WAIT';

      status.textContent =
        `Round ${round + 1}: wait for green…`;

      start.disabled = true;
      start.textContent = 'Focus…';

      timer = setTimeout(() => {
        if (!dialog.open || phase !== 'waiting') {
          return;
        }

        phase = 'ready';
        startedAt = performance.now();

        target.classList.add('reaction-ready');
        target.textContent = 'TAP!';

        status.textContent =
          'NOW! Tap the green target.';
      }, 900 + Math.random() * 2600);

      timeout = setTimeout(() => {
        if (phase === 'waiting' && dialog.open) {
          round++;
          endRound(true);
        }
      }, 5500);
    }

    target.addEventListener('click', () => {
      if (phase === 'waiting') {
        round++;
        endRound(true);
        return;
      }

      if (phase !== 'ready') return;

      round++;
      endRound(false);
    });

    start.addEventListener('click', () => {
      if (
        finished ||
        start.textContent === 'Play again'
      ) {
        round = 0;
        results = [];
        finished = false;

        roundLabel.textContent = '0 / 5';
      }

      beginRound();
    });
  }

  // ==========================================
  // GAME 3: NUMBER DASH
  // ==========================================

  function startNumberDash() {
    const dialog = createGameDialog(
      'Number Dash',
      'Solve 10 quick questions. Correct answers build your score and daily quest progress.',
      `
        <div class="game-mini-stats">
          <span>
            QUESTION
            <strong class="number-question">0 / 10</strong>
          </span>

          <span>
            SCORE
            <strong class="number-score">0</strong>
          </span>
        </div>

        <div class="math-question" aria-live="polite">
          Press start to begin.
        </div>

        <div class="answer-grid">
          ${[0, 1, 2, 3].map(i => `
            <button
              type="button"
              class="answer-option"
              data-answer="${i}"
              disabled
            >—</button>
          `).join('')}
        </div>

        <p class="game-status number-status" aria-live="polite">
          You have 10 questions. Take your time.
        </p>

        <button
          type="button"
          class="button button-primary button-full number-start"
        >Start Number Dash</button>
      `
    );

    if (!dialog) return;

    const questionEl = $('.math-question', dialog);
    const options = $$('.answer-option', dialog);
    const status = $('.number-status', dialog);
    const start = $('.number-start', dialog);
    const qLabel = $('.number-question', dialog);
    const scoreLabel = $('.number-score', dialog);

    let questions = 0;
    let score = 0;
    let correctCount = 0;
    let answer = 0;
    let active = false;
    let lock = false;

    function makeQuestion() {
      const ops = ['+', '−', '×'];

      const op = ops[
        Math.floor(Math.random() * ops.length)
      ];

      let a = 1 + Math.floor(Math.random() * 15);
      let b = 1 + Math.floor(Math.random() * 12);

      if (op === '−' && b > a) {
        [a, b] = [b, a];
      }

      answer =
        op === '+'
          ? a + b
          : op === '−'
            ? a - b
            : a * b;

      questionEl.textContent =
        `${a} ${op} ${b} = ?`;

      const values = new Set([answer]);

      while (values.size < 4) {
        values.add(
          Math.max(
            0,
            answer + (
              Math.floor(Math.random() * 11) - 5 || 3
            )
          )
        );
      }

      const choices = [...values].sort(
        () => Math.random() - 0.5
      );

      options.forEach((button, i) => {
        button.textContent = choices[i];
        button.dataset.value = choices[i];
        button.disabled = false;

        button.classList.remove(
          'answer-correct',
          'answer-wrong'
        );
      });

      qLabel.textContent = `${questions + 1} / 10`;
      scoreLabel.textContent = score;
    }

    function finish() {
      active = false;

      options.forEach(button => {
        button.disabled = true;
      });

      start.hidden = false;
      start.textContent = 'Play again';

      state.daily.numberCorrect += correctCount;

      const reward = awardGame(
        'number',
        'Number Dash',
        score,
        5 + correctCount * 2,
        `${correctCount}/10 correct · score ${score}`
      );

      status.textContent =
        `Finished! ${correctCount}/10 correct. You earned ${reward} demonstration coins.`;

      questionEl.textContent =
        `Final score: ${score} / 100`;

      saveState();
      renderDashboard();
    }

    options.forEach(button => {
      button.addEventListener('click', () => {
        if (
          !active ||
          lock ||
          button.disabled
        ) {
          return;
        }

        lock = true;
        questions++;

        const isCorrect =
          Number(button.dataset.value) === answer;

        if (isCorrect) {
          score += 10;
          correctCount++;

          button.classList.add('answer-correct');

          status.textContent = 'Correct! +10 points';
        } else {
          button.classList.add('answer-wrong');

          const right = options.find(
            b => Number(b.dataset.value) === answer
          );

          if (right) {
            right.classList.add('answer-correct');
          }

          status.textContent =
            `Not quite — the answer was ${answer}.`;
        }

        options.forEach(b => {
          b.disabled = true;
        });

        scoreLabel.textContent = score;

        setTimeout(() => {
          lock = false;

          if (!dialog.open) return;

          if (questions >= 10) {
            finish();
          } else {
            makeQuestion();
          }
        }, 550);
      });
    });

    start.addEventListener('click', () => {
      questions = 0;
      score = 0;
      correctCount = 0;
      active = true;
      lock = false;

      start.hidden = true;

      makeQuestion();

      status.textContent =
        'Choose the correct answer.';
    });
  }

  // ==========================================
  // GAME 4: NEON LANE RUN
  // ==========================================

  function startNeonLaneRun() {
    const dialog = createGameDialog(
      'Neon Lane Run',
      'Change lanes to avoid barriers and collect sparks.',
      `
        <div class="game-mini-stats">
          <span>
            SPARKS
            <strong class="runner-coins">0</strong>
          </span>

          <span>
            TIME
            <strong class="runner-time">30s</strong>
          </span>

          <span>
            SCORE
            <strong class="runner-score">0</strong>
          </span>
        </div>

        <div class="runner-stage">
          <canvas
            class="runner-canvas"
            width="420"
            height="520"
            aria-label="Three-lane runner game"
          ></canvas>
        </div>

        <div class="runner-controls">
          <button
            type="button"
            class="button button-secondary runner-left"
          >← Left</button>

          <button
            type="button"
            class="button button-primary runner-start"
          >Start run</button>

          <button
            type="button"
            class="button button-secondary runner-right"
          >Right →</button>
        </div>

        <p class="game-status runner-status" aria-live="polite">
          Use the arrow keys or buttons. Collect sparks and avoid red barriers.
        </p>
      `
    );

    if (!dialog) return;

    const canvas = $('.runner-canvas', dialog);
    const ctx = canvas.getContext('2d');

    const coinsEl = $('.runner-coins', dialog);
    const timeEl = $('.runner-time', dialog);
    const scoreEl = $('.runner-score', dialog);
    const status = $('.runner-status', dialog);
    const start = $('.runner-start', dialog);

    let lane = 1;
    let sparks = 0;
    let score = 0;
    let seconds = 30;
    let objects = [];
    let active = false;
    let loop = null;
    let countdown = null;
    let spawn = 0;

    const laneX = [105, 210, 315];

    function draw() {
      ctx.clearRect(0, 0, 420, 520);

      ctx.fillStyle = '#0b1012';
      ctx.fillRect(0, 0, 420, 520);

      ctx.strokeStyle = '#27342b';
      ctx.lineWidth = 3;

      [157, 262].forEach(x => {
        ctx.setLineDash([18, 16]);

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 520);
        ctx.stroke();
      });

      ctx.setLineDash([]);

      ctx.fillStyle = '#d9ff66';

      ctx.beginPath();
      ctx.arc(laneX[lane], 450, 17, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#202a13';

      ctx.beginPath();
      ctx.arc(laneX[lane], 450, 7, 0, Math.PI * 2);
      ctx.fill();

      objects.forEach(o => {
        if (o.type === 'coin') {
          ctx.fillStyle = '#f9d65c';

          ctx.beginPath();
          ctx.arc(
            laneX[o.lane],
            o.y,
            10,
            0,
            Math.PI * 2
          );

          ctx.fill();

          ctx.strokeStyle = '#fff0a6';
          ctx.stroke();
        } else {
          ctx.fillStyle = '#ff5c72';

          ctx.fillRect(
            laneX[o.lane] - 23,
            o.y - 13,
            46,
            26
          );

          ctx.fillStyle = '#6e1d31';

          ctx.fillRect(
            laneX[o.lane] - 16,
            o.y - 7,
            32,
            14
          );
        }
      });

      ctx.fillStyle = '#81918a';
      ctx.font = '12px sans-serif';
      ctx.fillText('NEON DISTRICT', 14, 22);
    }

    function move(direction) {
      if (!active) return;

      lane = Math.max(
        0,
        Math.min(2, lane + direction)
      );

      draw();
    }

    function finish() {
      if (!active) return;

      active = false;

      clearInterval(loop);
      clearInterval(countdown);

      loop = null;
      countdown = null;

      const reward = Math.min(
        18,
        3 + sparks * 2 + Math.floor(score / 100)
      );

      const earned = awardGame(
        'runner',
        'Neon Lane Run',
        score,
        reward,
        `${sparks} sparks collected · score ${score}`
      );

      status.textContent =
        `Run complete! Score ${score}, ${sparks} sparks. +${earned} demo coins.`;

      start.hidden = false;
      start.textContent = 'Run again';

      draw();
    }

    function tick() {
      spawn++;

      if (spawn % 12 === 0) {
        objects.push({
          lane: Math.floor(Math.random() * 3),
          y: -15,
          type: Math.random() < 0.64
            ? 'coin'
            : 'barrier'
        });
      }

      objects.forEach(o => {
        o.y += 5 + Math.min(4, score / 500);
      });

      const hit = objects.find(
        o =>
          o.lane === lane &&
          o.y > 420 &&
          o.y < 475
      );

      if (hit) {
        if (hit.type === 'coin') {
          sparks++;

          objects = objects.filter(
            o => o !== hit
          );

          coinsEl.textContent = sparks;
        } else {
          score = Math.max(0, score - 20);

          objects = objects.filter(
            o => o !== hit
          );

          status.textContent =
            'Ouch! Barrier hit — keep going.';
        }
      }

      objects = objects.filter(
        o => o.y < 540
      );

      score++;

      scoreEl.textContent = score;

      draw();
    }

    function key(e) {
      if (!dialog.open || !active) return;

      if (
        e.key === 'ArrowLeft' ||
        e.key === 'a'
      ) {
        e.preventDefault();
        move(-1);
      }

      if (
        e.key === 'ArrowRight' ||
        e.key === 'd'
      ) {
        e.preventDefault();
        move(1);
      }
    }

    document.addEventListener('keydown', key);

    dialog.addEventListener('close', () => {
      active = false;

      clearInterval(loop);
      clearInterval(countdown);

      document.removeEventListener(
        'keydown',
        key
      );
    });

    $('.runner-left', dialog).addEventListener(
      'click',
      () => move(-1)
    );

    $('.runner-right', dialog).addEventListener(
      'click',
      () => move(1)
    );

    start.addEventListener('click', () => {
      clearInterval(loop);
      clearInterval(countdown);

      lane = 1;
      sparks = 0;
      score = 0;
      seconds = 30;
      objects = [];
      spawn = 0;
      active = true;

      coinsEl.textContent = '0';
      scoreEl.textContent = '0';
      timeEl.textContent = '30s';

      status.textContent =
        'Run! Avoid barriers and collect gold sparks.';

      start.hidden = true;

      draw();

      loop = setInterval(() => {
        if (active) tick();
      }, 50);

      countdown = setInterval(() => {
        if (!active) return;

        seconds--;

        timeEl.textContent = `${seconds}s`;

        if (seconds <= 0) {
          finish();
        }
      }, 1000);
    });

    draw();
  }

  // ==========================================
  // GAME 5: GEM POP
  // ==========================================

  function startGemPop() {
    const icons = [
      '💎',
      '🔷',
      '🟣',
      '🟢',
      '⭐',
      '🟠'
    ];

    const dialog = createGameDialog(
      'Gem Pop',
      'Swap neighbouring gems to line up three or more matching symbols.',
      `
        <div class="game-mini-stats">
          <span>
            MOVES
            <strong class="gem-moves">20</strong>
          </span>

          <span>
            SCORE
            <strong class="gem-score">0</strong>
          </span>

          <span>
            BEST
            <strong>${state.bests.match3 || 0}</strong>
          </span>
        </div>

        <div
          class="gem-board"
          role="group"
          aria-label="Gem puzzle board"
        >
          ${Array.from({ length: 49 }, (_, i) => `
            <button
              type="button"
              class="gem-cell"
              data-cell="${i}"
              aria-label="Gem tile ${i + 1}"
            >${icons[Math.floor(Math.random() * icons.length)]}</button>
          `).join('')}
        </div>

        <p class="game-status gem-status" aria-live="polite">
          Select a gem, then select a neighbouring gem to swap.
        </p>

        <button
          type="button"
          class="button button-primary button-full gem-restart"
        >Restart puzzle</button>
      `
    );

    if (!dialog) return;

    const boardEl = $('.gem-board', dialog);
    const cells = $$('.gem-cell', dialog);
    const movesEl = $('.gem-moves', dialog);
    const scoreEl = $('.gem-score', dialog);
    const status = $('.gem-status', dialog);
    const restart = $('.gem-restart', dialog);

    let board = cells.map(
      c => icons.indexOf(c.textContent)
    );

    let selected = -1;
    let moves = 20;
    let score = 0;
    let finished = false;

    function matches() {
      const found = new Set();

      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const i = r * 7 + c;
          const v = board[i];

          if (
            c < 5 &&
            board[i + 1] === v &&
            board[i + 2] === v
          ) {
            let k = c;

            while (
              k < 7 &&
              board[r * 7 + k] === v
            ) {
              found.add(r * 7 + k++);
            }
          }

          if (
            r < 5 &&
            board[i + 7] === v &&
            board[i + 14] === v
          ) {
            let k = r;

            while (
              k < 7 &&
              board[k * 7 + c] === v
            ) {
              found.add(k++ * 7 + c);
            }
          }
        }
      }

      return found;
    }

    function render() {
      cells.forEach((cell, i) => {
        cell.textContent = icons[board[i]];

        cell.classList.toggle(
          'selected',
          selected === i
        );

        cell.disabled = finished;
      });

      movesEl.textContent = moves;
      scoreEl.textContent = score;
    }

    function settle() {
      let found = matches();
      let guard = 0;

      while (found.size && guard++ < 10) {
        score += found.size * 10;

        found.forEach(i => {
          board[i] = Math.floor(
            Math.random() * icons.length
          );
        });

        found = matches();
      }

      render();
    }

    function finish() {
      finished = true;

      render();

      const reward = Math.min(
        20,
        3 + Math.floor(score / 100)
      );

      const earned = awardGame(
        'match3',
        'Gem Pop',
        score,
        reward,
        `Score ${score} in ${20 - moves} moves`
      );

      status.textContent =
        `Puzzle complete! Score ${score}. You earned ${earned} demo coins, not cash.`;

      restart.textContent = 'Play again';
    }

    function reset() {
      board = Array.from(
        { length: 49 },
        () => Math.floor(
          Math.random() * icons.length
        )
      );

      let guard = 0;

      while (matches().size && guard++ < 20) {
        matches().forEach(i => {
          board[i] = Math.floor(
            Math.random() * icons.length
          );
        });
      }

      selected = -1;
      moves = 20;
      score = 0;
      finished = false;

      restart.textContent = 'Restart puzzle';

      status.textContent =
        'Select a gem, then select a neighbouring gem to swap.';

      render();
    }

    boardEl.addEventListener('click', e => {
      const cell = e.target.closest('[data-cell]');

      if (!cell || finished) return;

      const i = Number(cell.dataset.cell);

      if (selected < 0) {
        selected = i;
        render();
        return;
      }

      if (selected === i) {
        selected = -1;
        render();
        return;
      }

      const adjacent =
        Math.abs(
          Math.floor(selected / 7) -
          Math.floor(i / 7)
        ) +
        Math.abs(
          selected % 7 - i % 7
        ) === 1;

      if (!adjacent) {
        selected = i;
        render();
        return;
      }

      [
        board[selected],
        board[i]
      ] = [
        board[i],
        board[selected]
      ];

      const found = matches();

      if (!found.size) {
        [
          board[selected],
          board[i]
        ] = [
          board[i],
          board[selected]
        ];

        status.textContent =
          'That swap makes no match. Try another pair.';
      } else {
        moves--;

        settle();

        status.textContent =
          `Nice match! Total score: ${score}.`;
      }

      selected = -1;

      if (moves <= 0) {
        finish();
      } else {
        render();
      }
    });

    restart.addEventListener('click', reset);

    reset();
  }

  // ==========================================
  // CONNECT GAMES TO THE INTERFACE
  // ==========================================

  $$('.game-card').forEach(button => {
    button.addEventListener('click', () => {
      const game = button.dataset.game;

      if (game === 'memory') {
        startMemoryGame();
      } else if (game === 'reaction') {
        startReactionGame();
      } else if (game === 'puzzle') {
        startNumberDash();
      } else if (game === 'runner') {
        startNeonLaneRun();
      } else if (game === 'match3') {
        startGemPop();
      } else if (game === 'daily') {
        $('#dailyChallengesSection')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  $('#startMemoryGame')?.addEventListener(
    'click',
    startMemoryGame
  );

  // ==========================================
  // INITIALISE APP
  // ==========================================

  setupWalletConversion();

  navigateTo(currentPage);
  renderDashboard();
});