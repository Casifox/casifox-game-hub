'use strict';
// Outils partagés des tests de The Lying Game (audit CASIFOX, phase 3, en local).
// Le jeu est servi en lecture seule par audit-tools/serve.js sur 127.0.0.1:8103.
// Ce module n'écrit que dans audit\screenshots\the-lying-game\.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:8103/';
const SHOT_DIR = 'C:\\Users\\Noah\\Documents\\CASIFOX-GAME-HUB\\audit\\screenshots\\the-lying-game';
const LOG_DIR = path.join(SHOT_DIR, 'logs');
const KEYS = {
  save: 'the-lying-game.save.v1',
  archive: 'the-lying-game.archive.v1',
  settings: 'the-lying-game.settings.v1',
};
const MOVE_PATTERN = [
  { keys: ['z'], ms: 900 },
  { keys: ['d'], ms: 700 },
  { keys: ['z', 'd'], ms: 600 },
  { keys: ['s'], ms: 800 },
  { keys: ['q'], ms: 700 },
  { keys: ['s', 'q'], ms: 500 },
];

fs.mkdirSync(LOG_DIR, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createSink() {
  return {
    startedAt: Date.now(),
    console: [],
    pageerrors: [],
    requestfailed: [],
    httpErrors: [],
    dialogs: [],
    crashes: [],
    requestCount: 0,
    screenshots: [],
    steps: [],
  };
}

function elapsed(sink) {
  return Date.now() - sink.startedAt;
}

function note(sink, id, data) {
  const entry = { id, t: elapsed(sink), ...data };
  sink.steps.push(entry);
  console.log(`[${id}] ${data.resume ?? ''}`);
  return entry;
}

function attachListeners(page, sink) {
  page.on('console', (msg) => {
    const type = msg.type();
    if (type !== 'error' && type !== 'warning') return;
    const location = msg.location();
    sink.console.push({
      t: elapsed(sink),
      type,
      text: msg.text(),
      url: location.url || '',
      line: location.lineNumber ?? null,
    });
  });
  page.on('pageerror', (error) => {
    sink.pageerrors.push({
      t: elapsed(sink),
      name: error.name,
      message: error.message,
      stack: String(error.stack || '').split('\n').slice(0, 5).join('\n'),
    });
  });
  page.on('requestfailed', (request) => {
    sink.requestfailed.push({
      t: elapsed(sink),
      url: request.url(),
      type: request.resourceType(),
      failure: request.failure() ? request.failure().errorText : null,
    });
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      sink.httpErrors.push({ t: elapsed(sink), url: response.url(), status: response.status() });
    }
  });
  page.on('request', () => {
    sink.requestCount += 1;
  });
  page.on('dialog', (dialog) => {
    sink.dialogs.push({ t: elapsed(sink), type: dialog.type(), message: dialog.message() });
    dialog.dismiss().catch(() => {});
  });
  page.on('crash', () => {
    sink.crashes.push({ t: elapsed(sink) });
  });
}

async function launch() {
  return chromium.launch({ headless: true });
}

function envInfo(browser) {
  const pkgPath = path.join(__dirname, '..', 'node_modules', 'playwright', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return {
    node: process.version,
    playwright: pkg.version,
    chromium: browser.version(),
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    headless: true,
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    deviceScaleFactor: 1,
    baseUrl: BASE_URL,
  };
}

async function openPage(browser, sink, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport,
    isMobile: Boolean(options.isMobile),
    hasTouch: Boolean(options.hasTouch),
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  });
  if (options.initScript) await context.addInitScript(options.initScript);
  const page = await context.newPage();
  attachListeners(page, sink);
  return { context, page };
}

// Lecture de l'état d'affichage. #screen-root masque tous les écrans : un écran
// n'est visible que si la racine l'est aussi (hideScreens ne touche pas aux sections).
const UI_STATE = () => {
  const byId = (id) => document.getElementById(id);
  const shown = (id) => {
    const el = byId(id);
    return Boolean(el) && !el.hidden;
  };
  const rootShown = shown('screen-root');
  const dialogueText = byId('dialogue-text');
  const dialoguePanel = byId('dialogue-panel');
  const speaker = byId('dialogue-speaker');
  const continueButton = byId('home-continue');
  const canvas = document.querySelector('#game-container canvas');
  return {
    dataView: byId('app') ? byId('app').getAttribute('data-view') : null,
    screenRoot: rootShown,
    home: rootShown && shown('screen-home'),
    prologue: rootShown && shown('screen-prologue'),
    chapters: rootShown && shown('screen-chapters'),
    gallery: rootShown && shown('screen-gallery'),
    gameShell: shown('game-shell'),
    dialogue: shown('dialogue-layer'),
    dialogueText: shown('dialogue-layer') && dialogueText ? dialogueText.textContent : null,
    dialogueComplete: Boolean(dialoguePanel) && dialoguePanel.classList.contains('is-complete'),
    dialogueSpeaker: speaker ? speaker.textContent : null,
    modal: shown('modal-layer'),
    modalButtons: [...document.querySelectorAll('#modal-layer button')].map((b) => b.textContent.trim()),
    pause: shown('pause-layer'),
    pauseItems: [...document.querySelectorAll('#pause-layer .pause-item')].map((b) => b.textContent.trim()),
    canvas: Boolean(canvas),
    homeStartLabel: byId('home-start-label') ? byId('home-start-label').textContent : null,
    homeContinueDisabled: continueButton ? continueButton.disabled : null,
    homeContinueHint: byId('home-continue-hint') ? byId('home-continue-hint').textContent : null,
    homeProgress: byId('home-progress') ? byId('home-progress').textContent : null,
  };
};

async function uiState(page) {
  return page.evaluate(UI_STATE);
}

async function waitForState(page, predicate, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await uiState(page);
    if (predicate(last)) return last;
    await sleep(200);
  }
  throw new Error(`Délai dépassé (${timeoutMs} ms) : ${label}. Dernier état : ${JSON.stringify(last)}`);
}

// Bouton « nouvelle partie » de l'écran titre (ScreenView : data-action="start", id home-start).
// Si une session existe, la modale « Écraser la session ? » est confirmée (bouton NOUVELLE SESSION).
async function startNewGame(page) {
  await page.locator('#home-start').click({ timeout: 10000 });
  const first = await waitForState(page, (s) => s.prologue || s.modal, 10000, 'prologue ou fenêtre de confirmation');
  let confirmed = false;
  if (!first.prologue) {
    if (!first.modalButtons.includes('NOUVELLE SESSION')) {
      throw new Error(`Fenêtre inattendue après « nouvelle partie » : ${first.modalButtons.join(' | ')}`);
    }
    await page.locator('#modal-layer button').filter({ hasText: /^NOUVELLE SESSION$/ }).click({ timeout: 10000 });
    confirmed = true;
    await waitForState(page, (s) => s.prologue, 10000, 'prologue après confirmation');
  }
  return { confirmed };
}

// Le prologue compte 6 séquences (src/content/prologue.ts) : la 6e clic lance la partie.
async function passPrologue(page) {
  let clicks = 0;
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const s = await uiState(page);
    if (!s.prologue) return clicks;
    await page.locator('#prologue-next').click({ timeout: 10000 });
    clicks += 1;
    await sleep(300);
  }
  throw new Error('Prologue non terminé après 60 s');
}

// Avance les fenêtres jusqu'à l'écran de jeu : prologue, cutscene de chapitre (bouton primaire),
// dialogues (Entrée). « Prêt » = écran de jeu affiché, aucune superposition, stable pendant ~1 s.
async function advanceToGameplay(page, label, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  const dialogueLines = [];
  const modalsSeen = [];
  let enterPresses = 0;
  let modalClicks = 0;
  let stable = 0;
  let lastLine = null;
  while (Date.now() < deadline) {
    const s = await uiState(page);
    if (s.prologue) {
      await page.locator('#prologue-next').click({ timeout: 10000 });
      stable = 0;
      await sleep(250);
      continue;
    }
    if (s.modal) {
      const key = s.modalButtons.join(' | ');
      if (!modalsSeen.includes(key)) modalsSeen.push(key);
      const primary = page.locator('#modal-layer button.button--primary');
      if ((await primary.count()) === 0) {
        throw new Error(`Fenêtre sans bouton principal pendant ${label} : ${key}`);
      }
      await primary.first().click({ timeout: 10000 });
      modalClicks += 1;
      stable = 0;
      await sleep(250);
      continue;
    }
    if (s.dialogue) {
      if (s.dialogueComplete && s.dialogueText !== lastLine) {
        lastLine = s.dialogueText;
        dialogueLines.push(`${s.dialogueSpeaker} : ${s.dialogueText}`);
      }
      await page.keyboard.press('Enter');
      enterPresses += 1;
      stable = 0;
      await sleep(250);
      continue;
    }
    if (s.gameShell && s.canvas && !s.screenRoot && !s.pause) {
      stable += 1;
      if (stable >= 4) {
        return { ready: true, label, enterPresses, modalClicks, modalsSeen, dialogueLines, state: s };
      }
    } else {
      stable = 0;
    }
    await sleep(250);
  }
  return {
    ready: false,
    label,
    enterPresses,
    modalClicks,
    modalsSeen,
    dialogueLines,
    state: await uiState(page),
  };
}

// Déplacements au clavier (touches z, q, s, d : mouvement par défaut `zqsd`).
// Les dialogues ouverts sont avancés avec Entrée ; les superpositions inattendues sont journalisées.
async function playFor(page, durationMs) {
  const deadline = Date.now() + durationMs;
  const overlays = [];
  let holds = 0;
  let enterPresses = 0;
  let index = 0;
  while (Date.now() < deadline) {
    const s = await uiState(page);
    if (s.dialogue) {
      await page.keyboard.press('Enter');
      enterPresses += 1;
      await sleep(350);
      continue;
    }
    if (s.modal || s.pause) {
      const key = s.pause ? 'pause' : `modale : ${s.modalButtons.join(' | ')}`;
      if (!overlays.includes(key)) overlays.push(key);
      await sleep(300);
      continue;
    }
    const move = MOVE_PATTERN[index % MOVE_PATTERN.length];
    index += 1;
    try {
      for (const key of move.keys) await page.keyboard.down(key);
      await sleep(move.ms);
    } finally {
      for (const key of move.keys) await page.keyboard.up(key);
    }
    holds += 1;
    await sleep(300);
  }
  return { holds, enterPresses, overlays };
}

async function openPause(page) {
  await page.keyboard.press('Escape');
  return waitForState(page, (s) => s.pause, 5000, 'pause ouverte (Échap)');
}

async function clickPauseItem(page, label) {
  await page.locator('#pause-layer .pause-item').filter({ hasText: label }).click({ timeout: 10000 });
}

const STORAGE_FN = (keys) => {
  const raw = (key) => localStorage.getItem(key);
  const parse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };
  const saveRaw = raw(keys.save);
  const archiveRaw = raw(keys.archive);
  const settingsRaw = raw(keys.settings);
  const save = saveRaw === null ? null : parse(saveRaw);
  const archive = archiveRaw === null ? null : parse(archiveRaw);
  return {
    keys: Object.keys(localStorage),
    save:
      saveRaw === null
        ? null
        : {
            length: saveRaw.length,
            version: save ? save.version : null,
            currentLevelIndex: save ? save.currentLevelIndex : null,
            completedLevels: save && Array.isArray(save.completedLevels) ? save.completedLevels.length : null,
          },
    archive:
      archiveRaw === null
        ? null
        : {
            length: archiveRaw.length,
            runs: archive ? archive.runs : null,
            totalDiscoveries: archive ? archive.totalDiscoveries : null,
          },
    settings: settingsRaw === null ? null : { length: settingsRaw.length },
    backupKeys: Object.keys(localStorage).filter((key) => key.indexOf(keys.save + '.backup') === 0),
  };
};

async function storageSummary(page) {
  return page.evaluate(STORAGE_FN, KEYS);
}

const RESOURCE_FN = () => {
  const kindOf = (url) => {
    let pathname = url.toLowerCase();
    try {
      pathname = new URL(url).pathname.toLowerCase();
    } catch {
      pathname = url.toLowerCase();
    }
    if (pathname.endsWith('.js')) return 'JS';
    if (pathname.endsWith('.css')) return 'CSS';
    if (/\.(woff2?|ttf|otf)$/.test(pathname)) return 'Polices';
    if (/\.(png|jpe?g|svg|webp|gif|ico)$/.test(pathname)) return 'Images';
    if (/\.(json|webmanifest)$/.test(pathname)) return 'JSON/manifest';
    return 'Autre';
  };
  const nav = performance.getEntriesByType('navigation')[0];
  const resources = performance.getEntriesByType('resource');
  const rows = [];
  if (nav) {
    rows.push({
      url: nav.name,
      kind: 'Document',
      initiatorType: nav.initiatorType,
      transferSize: nav.transferSize,
      encodedBodySize: nav.encodedBodySize,
      decodedBodySize: nav.decodedBodySize,
      durationMs: Math.round(nav.duration),
    });
  }
  for (const entry of resources) {
    rows.push({
      url: entry.name,
      kind: kindOf(entry.name),
      initiatorType: entry.initiatorType,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      durationMs: Math.round(entry.duration),
    });
  }
  const timing = nav
    ? {
        domContentLoadedEventEndMs: Math.round(nav.domContentLoadedEventEnd),
        loadEventEndMs: Math.round(nav.loadEventEnd),
        responseEndMs: Math.round(nav.responseEnd),
      }
    : null;
  return { timing, rows };
};

async function resourceMetrics(page) {
  const raw = await page.evaluate(RESOURCE_FN);
  const byKind = {};
  const total = { count: 0, transferBytes: 0, encodedBytes: 0, decodedBytes: 0 };
  for (const row of raw.rows) {
    const agg = byKind[row.kind] || (byKind[row.kind] = { count: 0, transferBytes: 0, encodedBytes: 0, decodedBytes: 0 });
    for (const target of [agg, total]) {
      target.count += 1;
      target.transferBytes += row.transferSize;
      target.encodedBytes += row.encodedBodySize;
      target.decodedBytes += row.decodedBodySize;
    }
  }
  return { timing: raw.timing, byKind, total, rows: raw.rows };
}

async function memory(page) {
  return page.evaluate(() => {
    if (!performance.memory) return null;
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    };
  });
}

const RENDERER_FN = () => {
  const canvas = document.querySelector('#game-container canvas');
  if (!canvas) return null;
  const webgl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (webgl) {
    const ext = webgl.getExtension('WEBGL_debug_renderer_info');
    return {
      type: webgl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl',
      renderer: ext ? webgl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : webgl.getParameter(webgl.RENDERER),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    };
  }
  return { type: canvas.getContext('2d') ? '2d' : 'inconnu', canvasWidth: canvas.width, canvasHeight: canvas.height };
};

function fpsStats(stamps) {
  if (!stamps || stamps.length < 3) return null;
  const spanMs = stamps[stamps.length - 1] - stamps[0];
  const intervals = [];
  for (let i = 1; i < stamps.length; i += 1) intervals.push(stamps[i] - stamps[i - 1]);
  const maxInterval = Math.max(...intervals);
  const bins = new Map();
  for (const t of stamps) {
    const bin = Math.floor((t - stamps[0]) / 1000);
    bins.set(bin, (bins.get(bin) || 0) + 1);
  }
  const completeBins = [...bins.entries()].filter(([bin]) => (bin + 1) * 1000 <= spanMs);
  return {
    frames: stamps.length,
    spanMs: Math.round(spanMs),
    fpsMoyen: Number(((stamps.length - 1) / (spanMs / 1000)).toFixed(2)),
    fpsMinParSecondeComplete: completeBins.length ? Math.min(...completeBins.map(([, count]) => count)) : null,
    framesParSecondeComplete: completeBins.map(([, count]) => count),
    intervalleMaxMs: Number(maxInterval.toFixed(1)),
    fpsMinInstantane: Number((1000 / maxInterval).toFixed(2)),
  };
}

async function sampleFps(page, durationMs) {
  return page.evaluate(
    (ms) =>
      new Promise((resolve) => {
        const stamps = [];
        const start = performance.now();
        const frame = (now) => {
          stamps.push(now);
          if (now - start < ms) requestAnimationFrame(frame);
          else resolve(stamps);
        };
        requestAnimationFrame(frame);
      }),
    durationMs,
  );
}

async function shot(page, sink, name) {
  const file = path.join(SHOT_DIR, name);
  const buffer = await page.screenshot({ path: file, type: 'png' });
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  sink.screenshots.push({ t: elapsed(sink), file, bytes: buffer.length, sha256 });
  return sha256;
}

function writeLog(name, data) {
  const file = path.join(LOG_DIR, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  return file;
}

module.exports = {
  BASE_URL,
  SHOT_DIR,
  LOG_DIR,
  KEYS,
  sleep,
  createSink,
  note,
  launch,
  envInfo,
  openPage,
  uiState,
  waitForState,
  startNewGame,
  passPrologue,
  advanceToGameplay,
  playFor,
  openPause,
  clickPauseItem,
  storageSummary,
  resourceMetrics,
  memory,
  RENDERER_FN,
  fpsStats,
  sampleFps,
  shot,
  writeLog,
};
