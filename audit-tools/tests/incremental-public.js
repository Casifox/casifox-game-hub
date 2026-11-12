'use strict';
// Smoke test, mesures et viewports sur l'URL publique de Neon Jackpot (dossier local « incremental »).
// Chromium headless via Playwright. Aucun fichier du projet n'est écrit.
// Limite : 3 chargements maximum de l'URL publique par viewport (1920x1080 : 2 chargements ; autres : 1).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const URL_PUBLIC = 'https://casifox.github.io/neon-jackpot/';
const SHOTS = 'C:\\Users\\Noah\\Documents\\CASIFOX-GAME-HUB\\audit\\screenshots\\incremental';
const LOGS = path.join(SHOTS, 'logs');
const KEY = 'neon_jackpot_save_v1';
fs.mkdirSync(LOGS, { recursive: true });

const T0 = Date.now();
const since = () => Date.now() - T0;
let phase = 'init';

const run = {
  startedAt: new Date().toISOString(),
  url: URL_PUBLIC,
  playwrightVersion: require('playwright/package.json').version,
  chromiumVersion: null,
  loadsPerViewport: {},
  console: [],
  pageErrors: [],
  requestFailed: [],
  httpErrors: [],
  requests: [],
  firstLoad: null,
  navigation: null,
  mainResponse: null,
  game: null,
  persistence: null,
  viewports: [],
  metrics: null,
  pauseCheck: 'TEST NON EFFECTUÉ (sans objet) : aucun mécanisme de pause de partie dans src/js (grep -i pause). Seul un rappel après 2 h de session existe (main.js 116-118, ui.js 793-801), non testable dans la durée du test.',
};

function attach(page) {
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      run.console.push({ phase, t: since(), type, text: msg.text(), location: msg.location() });
    }
  });
  page.on('pageerror', (err) => {
    run.pageErrors.push({ phase, t: since(), message: err.message, stack: String(err.stack || '').split('\n').slice(0, 5).join('\n') });
  });
  page.on('requestfailed', (req) => {
    run.requestFailed.push({ phase, t: since(), url: req.url(), method: req.method(), resourceType: req.resourceType(), errorText: (req.failure() || {}).errorText || null });
  });
  page.on('response', (resp) => {
    if (resp.status() >= 400) run.httpErrors.push({ phase, t: since(), url: resp.url(), status: resp.status(), statusText: resp.statusText() });
  });
  page.on('requestfinished', (req) => {
    req.sizes().then((s) => {
      run.requests.push({ phase, t: since(), url: req.url(), resourceType: req.resourceType(), bodyBytes: s.responseBodySize, headerBytes: s.responseHeadersSize });
    }).catch((e) => {
      run.requests.push({ phase, t: since(), url: req.url(), resourceType: req.resourceType(), error: String(e.message || e).split('\n')[0] });
    });
  });
}

function pickHeaders(h) {
  const keep = ['content-type', 'cache-control', 'last-modified', 'etag', 'server', 'age'];
  const o = {};
  for (const k of keep) if (h[k] !== undefined) o[k] = h[k];
  return o;
}

function safeParse(raw) {
  if (raw === null || raw === undefined) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function describeStored(raw) {
  if (raw === null || raw === undefined) return { present: false };
  const o = safeParse(raw);
  if (!o) return { present: true, validJson: false, bytes: raw.length };
  return { present: true, validJson: true, tokens: o.tokens, bytes: raw.length };
}

const navTiming = (page) => page.evaluate(() => {
  const n = performance.getEntriesByType('navigation')[0];
  if (!n) return null;
  return {
    domContentLoadedMs: Math.round(n.domContentLoadedEventEnd),
    loadMs: Math.round(n.loadEventEnd),
    transferSize: n.transferSize,
    encodedBodySize: n.encodedBodySize,
    decodedBodySize: n.decodedBodySize,
    protocol: n.nextHopProtocol,
  };
});

async function closeModals(page) {
  for (let i = 0; i < 4; i++) {
    const open = await page.evaluate(() => !!(window.App && App.ui && App.ui.currentModal));
    if (!open) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(450);
  }
}

function layoutCheckFn() {
  const de = document.documentElement;
  const sx0 = window.scrollX;
  window.scrollBy(300, 0);
  const sx1 = window.scrollX;
  window.scrollTo(sx0, window.scrollY);
  const beyond = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.right > window.innerWidth + 1) {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      beyond.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '') + ' right=' + Math.round(r.right));
    }
  });
  return {
    innerWidth: window.innerWidth,
    clientWidth: de.clientWidth,
    scrollWidth: de.scrollWidth,
    horizontalOverflowPx: de.scrollWidth - de.clientWidth,
    horizontalScrollMovedPx: sx1 - sx0,
    elementsBeyondRightEdge: beyond.length,
    sampleBeyondRightEdge: beyond.slice(0, 8),
    hash: location.hash,
  };
}

function sampleFpsFn(durationMs) {
  return new Promise((resolve) => {
    const stamps = [];
    const start = performance.now();
    const frame = (now) => {
      stamps.push(now);
      if (now - start < durationMs) { requestAnimationFrame(frame); return; }
      const first = stamps[0];
      const last = stamps[stamps.length - 1];
      const seconds = (last - first) / 1000;
      let maxGap = 0;
      for (let i = 1; i < stamps.length; i++) maxGap = Math.max(maxGap, stamps[i] - stamps[i - 1]);
      const windows = [];
      for (let w = 0; w < Math.floor(durationMs / 1000); w++) {
        const lo = first + w * 1000;
        windows.push(stamps.filter((s) => s >= lo && s < lo + 1000).length);
      }
      const mem = performance.memory
        ? { usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize, jsHeapSizeLimit: performance.memory.jsHeapSizeLimit }
        : null;
      resolve({
        durationS: +seconds.toFixed(2),
        frames: stamps.length,
        avgFps: +((stamps.length - 1) / seconds).toFixed(1),
        minFpsWindow1s: Math.min(...windows),
        windowFrameCounts: windows,
        minInstantFps: +(1000 / maxGap).toFixed(1),
        maxFrameGapMs: +maxGap.toFixed(1),
        memory: mem,
      });
    };
    requestAnimationFrame(frame);
  });
}

async function gameSession(page) {
  await page.evaluate(() => { location.hash = 'plinko'; });
  await page.waitForSelector('#plinko-drop', { timeout: 15000 });
  await page.waitForTimeout(800);
  const unlockedAtStart = await page.evaluate(() => App.meta.isGameUnlocked('plinko'));
  const readGame = () => page.evaluate(() => ({
    tokens: App.state.data.tokens,
    liveBalls: (document.querySelector('#plinko-live-count') || {}).textContent || null,
    sessionGains: (document.querySelector('#plinko-session') || {}).textContent || null,
    modalOpen: !!(App.ui && App.ui.currentModal),
  }));
  const startMemory = await page.evaluate(() => (performance.memory
    ? { usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize }
    : null));
  await page.screenshot({ path: path.join(SHOTS, '02-partie-0s.png') });
  const start = Date.now();
  const sleepUntil = async (ms) => {
    const d = start + ms - Date.now();
    if (d > 0) await page.waitForTimeout(d);
  };
  const events = [];
  for (let s = 0; s <= 28; s += 2) events.push({ ms: s * 1000, kind: 'drop' });
  events.push({ ms: 15000, kind: 'shot', name: '03-partie-15s.png' });
  events.push({ ms: 17000, kind: 'fps' });
  events.push({ ms: 30000, kind: 'shot', name: '04-partie-30s.png' });
  events.sort((a, b) => a.ms - b.ms);
  const drops = [];
  let fpsP = null;
  let fpsStartS = null;
  for (const ev of events) {
    await sleepUntil(ev.ms);
    if (ev.kind === 'drop') {
      const before = await readGame();
      if (before.modalOpen) await closeModals(page);
      let clicked = true;
      let error = null;
      try {
        await page.click('#plinko-drop', { timeout: 4000 });
      } catch (e) {
        clicked = false;
        error = String(e.message).split('\n')[0];
      }
      await page.waitForTimeout(300);
      const after = await readGame();
      drops.push({
        tSec: +((Date.now() - start) / 1000).toFixed(1),
        modalClosedBeforeClick: before.modalOpen,
        clicked,
        error,
        tokensBefore: before.tokens,
        tokensAfter: after.tokens,
        liveBallsAfter: after.liveBalls,
        sessionGainsAfter: after.sessionGains,
      });
    } else if (ev.kind === 'shot') {
      await page.screenshot({ path: path.join(SHOTS, ev.name) });
    } else if (ev.kind === 'fps') {
      fpsStartS = +((Date.now() - start) / 1000).toFixed(1);
      fpsP = page.evaluate(sampleFpsFn, 10000);
    }
  }
  const fps = await fpsP;
  const end = await readGame();
  return {
    unlockedAtStart,
    startMemory,
    drops,
    clicksOk: drops.filter((d) => d.clicked).length,
    clicksKo: drops.filter((d) => !d.clicked).length,
    fpsWindowStartS: fpsStartS,
    fps,
    end,
  };
}

async function viewportRun(browser, vp) {
  phase = 'vp-' + vp.name;
  run.loadsPerViewport[vp.name] = 1;
  const c = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, ...vp.opts });
  const p = await c.newPage();
  attach(p);
  const resp = await p.goto(URL_PUBLIC, { waitUntil: 'load', timeout: 90000 });
  await p.waitForTimeout(5000);
  await closeModals(p);
  await p.waitForTimeout(400);
  const hub = await p.evaluate(layoutCheckFn);
  await p.screenshot({ path: path.join(SHOTS, vp.hubShot) });
  await p.evaluate(() => { location.hash = 'plinko'; });
  await p.waitForSelector('#plinko-drop', { timeout: 15000 });
  await p.waitForTimeout(800);
  const plinko = await p.evaluate(layoutCheckFn);
  await p.screenshot({ path: path.join(SHOTS, vp.plinkoShot) });
  run.viewports.push({
    name: vp.name,
    width: vp.width,
    height: vp.height,
    isMobile: !!vp.opts.isMobile,
    hasTouch: !!vp.opts.hasTouch,
    httpStatus: resp.status(),
    hub,
    plinko,
  });
  await c.close();
}

(async () => {
  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    run.chromiumVersion = browser.version();

    phase = 'load';
    run.loadsPerViewport['1920x1080'] = 1;
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    attach(page);
    const tGo = Date.now();
    const resp = await page.goto(URL_PUBLIC, { waitUntil: 'load', timeout: 90000 });
    run.gotoMs = Date.now() - tGo;
    run.mainResponse = { status: resp.status(), url: resp.url(), headers: pickHeaders(resp.headers()) };
    run.navigation = await navTiming(page);
    run.resourceEntriesAtLoad = await page.evaluate(() => performance.getEntriesByType('resource').length);
    await page.waitForTimeout(5000);
    const snapT = since();
    run.firstLoad = {
      snapshotT: snapT,
      consoleCount: run.console.length,
      pageErrorCount: run.pageErrors.length,
      requestFailed: run.requestFailed.slice(),
      httpErrors: run.httpErrors.slice(),
    };
    await page.screenshot({ path: path.join(SHOTS, '01-accueil.png') });
    await closeModals(page);
    await page.waitForTimeout(500);
    run.viewports.push({ name: '1920x1080', width: 1920, height: 1080, isMobile: false, hasTouch: false, ...(await page.evaluate(layoutCheckFn)) });
    await page.screenshot({ path: path.join(SHOTS, 'vp-1920.png') });

    phase = 'game';
    run.game = await gameSession(page);

    phase = 'reload';
    run.loadsPerViewport['1920x1080'] = 2;
    const before = await page.evaluate((k) => ({
      memTokens: App.state.data.tokens,
      storedRaw: localStorage.getItem(k),
      keys: Object.keys(localStorage),
    }), KEY);
    await page.reload({ waitUntil: 'load', timeout: 90000 });
    await page.waitForFunction(() => !!(window.App && App.ready === true), undefined, { timeout: 30000 });
    await page.waitForTimeout(2000);
    const after = await page.evaluate((k) => ({
      memTokens: App.state.data.tokens,
      storedRaw: localStorage.getItem(k),
      keys: Object.keys(localStorage),
      navType: (performance.getEntriesByType('navigation')[0] || {}).type,
      hash: location.hash,
    }), KEY);
    run.persistence = {
      avantRechargement: { memTokens: before.memTokens, stored: describeStored(before.storedRaw), keys: before.keys },
      apresRechargement: { memTokens: after.memTokens, stored: describeStored(after.storedRaw), keys: after.keys, navType: after.navType, hash: after.hash },
      cleExisteApres: after.storedRaw !== null,
      jetonsDansCleApres: typeof (safeParse(after.storedRaw) || {}).tokens === 'number',
      memoireAvantEgaleMemoireApres: before.memTokens === after.memTokens,
      cleApresEgaleMemoireAvant: (safeParse(after.storedRaw) || {}).tokens === before.memTokens,
      cleAvantEgaleMemoireAvant: (safeParse(before.storedRaw) || {}).tokens === before.memTokens,
    };
    await closeModals(page);
    await page.waitForTimeout(500);
    run.viewports.push({ name: '1920x1080 (après rechargement, plinko)', width: 1920, height: 1080, isMobile: false, hasTouch: false, ...(await page.evaluate(layoutCheckFn)) });
    await page.screenshot({ path: path.join(SHOTS, 'vp-1920-plinko.png') });
    await ctx.close();

    const vps = [
      { name: '1366x768', width: 1366, height: 768, opts: {}, hubShot: 'vp-1366.png', plinkoShot: 'vp-1366-plinko.png' },
      { name: '768x1024', width: 768, height: 1024, opts: {}, hubShot: 'vp-768.png', plinkoShot: 'vp-768-plinko.png' },
      { name: '390x844 mobile tactile', width: 390, height: 844, opts: { isMobile: true, hasTouch: true }, hubShot: 'vp-390.png', plinkoShot: 'vp-390-plinko.png' },
    ];
    for (const vp of vps) {
      await viewportRun(browser, vp);
    }

    const first = run.requests.filter((r) => r.t <= run.firstLoad.snapshotT && !r.error);
    const bytes = first.reduce((a, r) => a + (r.bodyBytes || 0) + (r.headerBytes || 0), 0);
    const byType = {};
    first.forEach((r) => { byType[r.resourceType] = (byType[r.resourceType] || 0) + 1; });
    run.metrics = {
      gotoMs: run.gotoMs,
      domContentLoadedMs: run.navigation ? run.navigation.domContentLoadedMs : null,
      loadMs: run.navigation ? run.navigation.loadMs : null,
      requestsFinishedFirstLoad: first.length,
      requestsFailedFirstLoad: run.firstLoad.requestFailed.length,
      httpErrorsFirstLoad: run.firstLoad.httpErrors.length,
      transferredBytesFirstLoad: bytes,
      transferredKiBFirstLoad: +(bytes / 1024).toFixed(1),
      requestsByResourceType: byType,
      fpsWindow10s: run.game && run.game.fps ? {
        avgFps: run.game.fps.avgFps,
        minFpsWindow1s: run.game.fps.minFpsWindow1s,
        minInstantFps: run.game.fps.minInstantFps,
        maxFrameGapMs: run.game.fps.maxFrameGapMs,
        frames: run.game.fps.frames,
        durationS: run.game.fps.durationS,
        windowFrameCounts: run.game.fps.windowFrameCounts,
      } : null,
      heapStartOfGame: run.game ? run.game.startMemory : null,
      heapDuringFpsWindow: run.game && run.game.fps ? run.game.fps.memory : null,
    };
  } catch (e) {
    run.fatalError = String(e.stack || e).split('\n').slice(0, 8).join('\n');
  } finally {
    run.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(LOGS, 'public-run.json'), JSON.stringify(run, null, 2), 'utf8');
    if (browser) await browser.close();
  }
  const byPhase = {};
  for (const m of run.console) byPhase[m.phase] = (byPhase[m.phase] || 0) + 1;
  console.log(JSON.stringify({
    fatalError: run.fatalError || null,
    chromium: run.chromiumVersion,
    loadsPerViewport: run.loadsPerViewport,
    httpMain: run.mainResponse && run.mainResponse.status,
    navigation: run.navigation,
    consoleByPhase: byPhase,
    console: run.console.map((m) => ({ phase: m.phase, t: m.t, type: m.type, text: m.text.slice(0, 220), loc: m.location && m.location.url })),
    pageErrors: run.pageErrors,
    requestFailed: run.requestFailed,
    httpErrors: run.httpErrors,
    persistence: run.persistence,
    gameSummary: run.game ? { unlockedAtStart: run.game.unlockedAtStart, clicksOk: run.game.clicksOk, clicksKo: run.game.clicksKo, startMemory: run.game.startMemory, fps: run.game.fps, end: run.game.end, firstDropsAndLast: [run.game.drops[0], run.game.drops[run.game.drops.length - 1]] } : null,
    metrics: run.metrics,
    viewports: run.viewports,
  }, null, 2));
})().catch((e) => {
  console.error('ERREUR', e && e.stack ? e.stack : e);
  process.exit(1);
});
