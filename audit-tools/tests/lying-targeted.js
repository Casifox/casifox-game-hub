'use strict';
// Tests ciblés T-LYING-01 et T-LYING-02 (Phase 3, local, lecture seule du jeu).
// T-LYING-01 : compter les appels périodiques à window.matchMedia en paysage de bureau.
// T-LYING-02 : simuler un échec d'écriture localStorage pendant une nouvelle partie
//               et vérifier si l'ancienne sauvegarde subsiste.
const fs = require('fs');
const path = require('path');
const C = require('./lying-common');

const TARGET_DIR = 'C:\\Users\\Noah\\Documents\\CASIFOX-GAME-HUB\\audit\\screenshots\\the-lying-game';
const TARGET_LOG = path.join(TARGET_DIR, 'logs', 'targeted.json');
const SAVE_KEY = C.KEYS.save;
const ARCHIVE_KEY = C.KEYS.archive;
const PORTRAIT_QUERY = '(max-width: 600px) and (orientation: portrait)';

fs.mkdirSync(path.dirname(TARGET_LOG), { recursive: true });

function attachLocal(page, sink) {
  page.on('console', (msg) => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return;
    const loc = msg.location();
    sink.console.push({
      t: Date.now() - sink.startedAt,
      type: msg.type(),
      text: msg.text(),
      url: loc.url || '',
      line: loc.lineNumber ?? null,
    });
  });
  page.on('pageerror', (error) => {
    sink.pageerrors.push({
      name: error.name,
      message: error.message,
      stack: String(error.stack || '').split('\n').slice(0, 5).join('\n'),
    });
  });
  page.on('requestfailed', (request) => {
    sink.requestfailed.push({
      url: request.url(),
      type: request.resourceType(),
      failure: request.failure() ? request.failure().errorText : null,
    });
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      sink.httpErrors.push({ url: response.url(), status: response.status() });
    }
  });
}

async function testPortraitTicker(browser) {
  const sink = C.createSink();
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  });
  await context.addInitScript((query) => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.__lyingMatchMedia = { calls: [], byQuery: {} };
    window.matchMedia = function (candidate) {
      window.__lyingMatchMedia.calls.push({
        t: performance.now(),
        query: String(candidate),
      });
      if (!window.__lyingMatchMedia.byQuery[candidate]) {
        window.__lyingMatchMedia.byQuery[candidate] = 0;
      }
      window.__lyingMatchMedia.byQuery[candidate] += 1;
      return nativeMatchMedia(candidate);
    };
    window.__lyingPortraitQuery = query;

    const nativeQuerySelector = Document.prototype.querySelector;
    window.__lyingCanvasQueries = [];
    Document.prototype.querySelector = function (selector) {
      if (selector === '#game-container canvas') {
        window.__lyingCanvasQueries.push({ t: performance.now() });
      }
      return nativeQuerySelector.call(this, selector);
    };
  }, PORTRAIT_QUERY);
  const page = await context.newPage();
  attachLocal(page, sink);
  const result = {
    id: 'T-LYING-01',
    title: 'Cadrage portrait : minuteur périodique en paysage de bureau',
    expected:
      'En paysage de bureau, le minuteur de cadrage portrait ne doit pas interroger matchMedia ni rechercher le canvas toutes les 40 ms. Après correction : 0 appel périodique observé sur 10 s, au titre comme en jeu.',
    viewport: { width: 1366, height: 768 },
    titleMeasurement: null,
    gameplayMeasurement: null,
    status: 'TEST NON EFFECTUÉ',
  };
  try {
    await page.goto(C.BASE_URL, { waitUntil: 'load', timeout: 30000 });
    await C.sleep(3000);
    const resetCounters = () =>
      page.evaluate(() => {
        window.__lyingMatchMedia.calls = [];
        window.__lyingMatchMedia.byQuery = {};
        window.__lyingCanvasQueries = [];
      });
    const readCounters = () =>
      page.evaluate((query) => {
        const matchCalls = window.__lyingMatchMedia.calls;
        const portraitCalls = matchCalls.filter((call) => call.query === query);
        return {
          now: performance.now(),
          matchMediaCalls: matchCalls.length,
          matchMediaByQuery: { ...window.__lyingMatchMedia.byQuery },
          portraitQuery: query,
          portraitQueryCalls: portraitCalls.length,
          canvasQueryCalls: window.__lyingCanvasQueries.length,
        };
      }, PORTRAIT_QUERY);

    await resetCounters();
    await C.sleep(10000);
    result.titleMeasurement = await readCounters();
    await C.shot(page, sink, 't-lying-01-titre-paysage.png');

    const start = await C.startNewGame(page);
    const clicks = await C.passPrologue(page);
    await C.waitForState(page, (s) => s.modal || s.dialogue || (s.gameShell && s.canvas), 30000, 'premier écran après le prologue');
    const ready = await C.advanceToGameplay(page, 'T-LYING-01 jeu');
    result.gameStart = {
      confirmationNeeded: start.confirmed,
      prologueClicks: clicks,
      ready: ready.ready,
      dialogueLines: ready.dialogueLines,
    };
    if (ready.ready) {
      await C.sleep(1500);
      await resetCounters();
      await C.sleep(10000);
      result.gameplayMeasurement = await readCounters();
      await C.shot(page, sink, 't-lying-01-jeu-paysage.png');
    }
    const titleHasTicker =
      result.titleMeasurement.canvasQueryCalls > 0 ||
      result.titleMeasurement.portraitQueryCalls > 0;
    const gameHasTicker =
      result.gameplayMeasurement &&
      (result.gameplayMeasurement.canvasQueryCalls > 0 ||
        result.gameplayMeasurement.portraitQueryCalls > 0);
    result.observations = {
      titleTickerPeriodicCalls:
        result.titleMeasurement.canvasQueryCalls +
        result.titleMeasurement.portraitQueryCalls,
      gameplayTickerPeriodicCalls: result.gameplayMeasurement
        ? result.gameplayMeasurement.canvasQueryCalls +
          result.gameplayMeasurement.portraitQueryCalls
        : null,
    };
    result.expectedTickerPeriodicCalls = 0;
    result.status = titleHasTicker || gameHasTicker
      ? 'TEST ÉCHOUÉ (minuteur actif reproduit)'
      : 'TEST RÉUSSI (aucun minuteur périodique)';
    if (!ready.ready) {
      result.status = 'TEST PARTIEL (jeu non atteint)';
    }
  } catch (error) {
    result.status = 'TEST ÉCHOUÉ (erreur de test)';
    result.error = String(error && error.stack ? error.stack : error);
  } finally {
    result.console = sink.console;
    result.pageerrors = sink.pageerrors;
    result.requestfailed = sink.requestfailed;
    result.httpErrors = sink.httpErrors;
    result.screenshots = sink.screenshots;
    await context.close().catch(() => {});
  }
  return result;
}

async function testNewGameWriteFailure(browser) {
  const sink = C.createSink();
  const now = Date.now();
  const oldSave = {
    version: 1,
    createdAt: now - 60000,
    updatedAt: now - 30000,
    currentLevelIndex: 1,
    completedLevels: ['level_01'],
    memory: {
      discoveredLies: [],
      secrets: [],
      clues: ['clue_white_room_button'],
      hintsUsed: 1,
      followedHost: 0,
      resistedHost: 1,
      glitchEncounters: 0,
      choices: [],
    },
    seenChapters: ['trust'],
    playTimeMs: 42000,
  };
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  });
  await context.addInitScript(
    ({ save, saveKey, archiveKey }) => {
      if (!sessionStorage.getItem('__lying_targeted_seeded')) {
        localStorage.clear();
        localStorage.setItem(saveKey, JSON.stringify(save));
        localStorage.setItem(
          archiveKey,
          JSON.stringify({
            version: 1,
            endings: [],
            seenClues: ['clue_white_room_button'],
            seenLies: [],
            secretNotes: [],
            totalDiscoveries: 1,
            runs: 1,
          }),
        );
        sessionStorage.setItem('__lying_targeted_seeded', '1');
      }
      window.__lyingUnhandled = [];
      window.addEventListener('unhandledrejection', (event) => {
        window.__lyingUnhandled.push({
          reason: event.reason && (event.reason.stack || event.reason.message)
            ? event.reason.stack || event.reason.message
            : String(event.reason),
          at: performance.now(),
        });
      });
    },
    { save: oldSave, saveKey: SAVE_KEY, archiveKey: ARCHIVE_KEY },
  );
  const page = await context.newPage();
  attachLocal(page, sink);
  const result = {
    id: 'T-LYING-02',
    title: 'Échec d’écriture pendant beginNewGame',
    expected: 'En cas d’échec de l’écriture de la nouvelle sauvegarde, l’ancienne sauvegarde doit rester intacte.',
    seededSaveMarker: {
      currentLevelIndex: oldSave.currentLevelIndex,
      completedLevels: oldSave.completedLevels,
      clues: oldSave.memory.clues,
    },
    status: 'TEST NON EFFECTUÉ',
  };
  try {
    await page.goto(C.BASE_URL, { waitUntil: 'load', timeout: 30000 });
    await C.sleep(2500);
    const before = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return {
        exists: raw !== null,
        length: raw ? raw.length : 0,
        parsed: raw ? JSON.parse(raw) : null,
        keys: Object.keys(localStorage),
        homeContinueDisabled: document.getElementById('home-continue').disabled,
        homeContinueHint: document.getElementById('home-continue-hint').textContent,
      };
    }, SAVE_KEY);

    await page.evaluate(() => {
      window.__lyingWriteFailure = {
        attempted: [],
        thrown: 0,
      };
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'the-lying-game.save.v1') {
          window.__lyingWriteFailure.attempted.push({
            key,
            length: String(value).length,
            t: performance.now(),
          });
          window.__lyingWriteFailure.thrown += 1;
          throw new DOMException('Simulated storage quota error', 'QuotaExceededError');
        }
        return original.call(this, key, value);
      };
    });

    const startButton = page.locator('#home-start');
    await startButton.click({ timeout: 10000 });
    await C.sleep(500);
    const startState = await C.uiState(page);
    result.initialStartState = {
      modal: startState.modal,
      prologue: startState.prologue,
      modalButtons: startState.modalButtons,
    };
    const confirm = page.locator('#modal-layer button').filter({ hasText: /^NOUVELLE SESSION$/ });
    if ((await confirm.count()) === 0) {
      throw new Error('Le bouton de confirmation NOUVELLE SESSION est absent.');
    }
    await confirm.click({ timeout: 10000 });
    await C.sleep(1200);

    const after = await page.evaluate(
      ({ key, archiveKey }) => {
        const raw = localStorage.getItem(key);
        const archiveRaw = localStorage.getItem(archiveKey);
        let archive = null;
        try {
          archive = archiveRaw ? JSON.parse(archiveRaw) : null;
        } catch {
          archive = null;
        }
        return {
          exists: raw !== null,
          length: raw ? raw.length : 0,
          parsed: raw ? JSON.parse(raw) : null,
          keys: Object.keys(localStorage),
          archive: archive
            ? { runs: archive.runs, totalDiscoveries: archive.totalDiscoveries }
            : null,
          writeFailure: window.__lyingWriteFailure,
          unhandled: window.__lyingUnhandled,
          state: (() => {
            const byId = (id) => document.getElementById(id);
            const shown = (id) => Boolean(byId(id)) && !byId(id).hidden;
            const rootShown = shown('screen-root');
            return {
              dataView: byId('app') ? byId('app').getAttribute('data-view') : null,
              screenRoot: rootShown,
              home: rootShown && shown('screen-home'),
              prologue: rootShown && shown('screen-prologue'),
              gameShell: shown('game-shell'),
              dialogue: shown('dialogue-layer'),
              modal: shown('modal-layer'),
              homeStartLabel: byId('home-start-label') ? byId('home-start-label').textContent : null,
              homeContinueDisabled: byId('home-continue') ? byId('home-continue').disabled : null,
            };
          })(),
        };
      },
      { key: SAVE_KEY, archiveKey: ARCHIVE_KEY },
    );
    result.before = {
      save: before,
      storageKeys: before.keys,
    };
    result.after = after;
    result.expectedOldSaveExists = true;
    result.observedOldSaveExists = after.exists;
    result.status =
      after.exists &&
      after.parsed &&
      after.parsed.currentLevelIndex === oldSave.currentLevelIndex
        ? 'TEST RÉUSSI (protection observée)'
        : 'TEST ÉCHOUÉ (perte de l’ancienne sauvegarde)';
    result.conclusion =
      after.exists && after.parsed && after.parsed.currentLevelIndex === oldSave.currentLevelIndex
        ? 'La sauvegarde précédente est toujours présente après l’échec simulé.'
        : 'La sauvegarde précédente a disparu après l’échec d’écriture de la nouvelle sauvegarde.';
    await C.shot(page, sink, 't-lying-02-echec-ecriture.png');
  } catch (error) {
    result.status = 'TEST ÉCHOUÉ (erreur de test)';
    result.error = String(error && error.stack ? error.stack : error);
  } finally {
    result.console = sink.console;
    result.pageerrors = sink.pageerrors;
    result.requestfailed = sink.requestfailed;
    result.httpErrors = sink.httpErrors;
    result.screenshots = sink.screenshots;
    await context.close().catch(() => {});
  }
  return result;
}

async function main() {
  const browser = await C.launch();
  const env = C.envInfo(browser);
  const results = {};
  try {
    results['T-LYING-01'] = await testPortraitTicker(browser);
    results['T-LYING-02'] = await testNewGameWriteFailure(browser);
  } finally {
    await browser.close().catch(() => {});
    const output = {
      test: 'Tests ciblés T-LYING-01 et T-LYING-02',
      env,
      url: C.BASE_URL,
      generatedAt: new Date().toISOString(),
      results,
    };
    fs.mkdirSync(path.dirname(TARGET_LOG), { recursive: true });
    fs.writeFileSync(TARGET_LOG, JSON.stringify(output, null, 2), 'utf8');
    console.log(`T-LYING-01 : ${results['T-LYING-01'] ? results['T-LYING-01'].status : 'absent'}`);
    console.log(`T-LYING-02 : ${results['T-LYING-02'] ? results['T-LYING-02'].status : 'absent'}`);
    console.log(`Log : ${TARGET_LOG}`);
    for (const [id, result] of Object.entries(results)) {
      if (result && result.error) console.log(`${id} erreur : ${result.error.split('\n').slice(0, 2).join(' | ')}`);
      if (result && result.pageerrors && result.pageerrors.length) {
        console.log(`${id} pageerrors : ${result.pageerrors.length}`);
      }
    }
  }
}

main();
