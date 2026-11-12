'use strict';
// Tests ciblés des bugs de phase 2. Usage : node tests/targeted.js <ID|all>
// Un TEST ÉCHOUÉ signifie que le bug est reproduit à l'exécution.
// Méthode : pour injecter un état puis recharger, la page courante est fermée SANS beforeunload
// (page.close({ runBeforeUnload: false })) puis une nouvelle page est ouverte dans le même contexte.
// Sans cela, beforeunload réécrit l'état courant et écrase la valeur injectée avant le chargement.
const path = require('path');
const L = require('./lib');

const HUB = path.resolve(__dirname, '..', '..');
const AUDIT = path.join(HUB, 'audit');

const ROOTS = {
  incremental: 'C:\\Users\\Noah\\Documents\\incremental',
  avant: 'C:\\Users\\Noah\\Documents\\AVANT LE SILENCE',
  lying: 'C:\\Users\\Noah\\Documents\\the-lying-game\\docs',
};

function save(slug, id, data) {
  L.writeJson(path.join(AUDIT, 'screenshots', slug, 'logs', `targeted-${id}.json`), data);
}

async function withServer(root, port, fn) {
  if (process.env.CASIFOX_TARGET_URL) return fn(process.env.CASIFOX_TARGET_URL);
  const server = await L.startStatic(path.resolve(root), port);
  try {
    return await fn(`http://127.0.0.1:${port}/`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

// Neutralise les sauvegardes que le jeu déclenche à la fermeture (visibilitychange) de la page d'origine.
const NEUTRALIZE_INCREMENTAL = () => {
  if (window.App && App.state) {
    App.state.save = function () {};
    App.state.saveSoon = function () {};
  }
};

async function reopen(context, page, url, log, beforeClose) {
  if (beforeClose) await page.evaluate(beforeClose);
  await page.close({ runBeforeUnload: false });
  const next = await context.newPage();
  L.attach(next, log);
  await next.goto(url, { waitUntil: 'load', timeout: 60000 });
  return next;
}

// T-INCR-01 : BUG-incremental-001 (sauvegarde corrompue réécrite sans copie)
async function tIncr01(browser) {
  return withServer(ROOTS.incremental, 8104, async (url) => {
    const { context, page: first } = await L.newPage(browser, { width: 1366, height: 768 });
    const log = L.newLog();
    L.attach(first, log);
    try {
      await first.goto(url, { waitUntil: 'load', timeout: 60000 });
      await L.sleep(2500);
      await first.evaluate(() => localStorage.setItem('neon_jackpot_save_v1', '{'));
      const page = await reopen(context, first, url, log, NEUTRALIZE_INCREMENTAL);
      await L.sleep(2500);
      const afterLoad = await page.evaluate(() => localStorage.getItem('neon_jackpot_save_v1'));
      const triggered = await page.evaluate(() => {
        if (window.App && App.state && App.state.saveSoon) {
          App.state.saveSoon();
          return true;
        }
        return false;
      });
      await L.sleep(2000);
      const after = await page.evaluate(() => ({
        main: localStorage.getItem('neon_jackpot_save_v1'),
        backups: Object.keys(localStorage).filter((k) => k.startsWith('neon_jackpot_save_v1.backup')),
      }));
      let verdict;
      if (after.backups.length > 0) verdict = { status: 'TEST RÉUSSI', detail: `copie de secours présente : ${after.backups.join(', ')}` };
      else if (afterLoad !== '{') verdict = { status: 'TEST ÉCHOUÉ', detail: 'au chargement, la sauvegarde corrompue a été réécrite par la partie par défaut, sans copie de secours (bug confirmé)' };
      else if (after.main !== '{' && triggered) verdict = { status: 'TEST ÉCHOUÉ', detail: 'après sauvegarde, la clé principale a été réécrite sans copie de secours (bug confirmé)' };
      else verdict = { status: 'TEST PARTIEL', detail: 'sauvegarde non déclenchée ou clé inchangée : test inconclusif' };
      const result = { id: 'T-INCR-01', bug: 'BUG-incremental-001', url, ...verdict, evidence: { afterLoadPrefix: afterLoad ? afterLoad.slice(0, 60) : null, triggered, afterSavePrefix: after.main ? after.main.slice(0, 60) : null, backups: after.backups, pageErrors: log.pageErrors } };
      await L.shot(page, path.join(AUDIT, 'screenshots', 'incremental', 't-incr-01.png'));
      save('incremental', 'T-INCR-01', result);
      return result;
    } finally {
      await context.close();
    }
  });
}

// T-INCR-02 : BUG-incremental-002 (champs importés non échappés)
async function tIncr02(browser) {
  return withServer(ROOTS.incremental, 8104, async (url) => {
    const { context, page: first } = await L.newPage(browser, { width: 1366, height: 768 });
    const log = L.newLog();
    L.attach(first, log);
    const payload = JSON.stringify({
      tokens: 1000,
      journal: [{ icon: '<img src=x onerror="window.__xss=1">', text: 'test-T-INCR-02', value: '', at: 1700000000000 }],
    });
    try {
      await first.goto(url, { waitUntil: 'load', timeout: 60000 });
      await L.sleep(2500);
      await first.evaluate((value) => localStorage.setItem('neon_jackpot_save_v1', value), payload);
      const page = await reopen(context, first, url, log, NEUTRALIZE_INCREMENTAL);
      await L.sleep(2500);
      let rendered = 0;
      let route = null;
      for (const candidate of ['hub', 'stats']) {
        await page.evaluate((hash) => { location.hash = hash; }, candidate);
        await L.sleep(2000);
        rendered = await page.locator('.journal-icon').count();
        route = candidate;
        if (rendered > 0) break;
      }
      await L.sleep(1000);
      const xss = await page.evaluate(() => window.__xss === 1);
      const injected = await page.locator('img[src="x"]').count();
      const state = await page.evaluate(() => ({
        stateJournalLength: App.state.data.journal.length,
        stateJournalFirstIcon: App.state.data.journal[0] ? App.state.data.journal[0].icon : null,
        stateTokens: App.state.data.tokens,
        textHasMarker: document.body.innerText.includes('test-T-INCR-02'),
        firstJournalIconHtml: document.querySelector('.journal-icon') ? document.querySelector('.journal-icon').outerHTML.slice(0, 200) : null,
      }));
      let verdict;
      if (injected > 0) verdict = { status: 'TEST ÉCHOUÉ', detail: `élément HTML injecté depuis la sauvegarde (bug confirmé) ; script exécuté=${xss}` };
      else if (state.stateJournalLength === 0) verdict = { status: 'TEST PARTIEL', detail: 'sauvegarde injectée non chargée par l\'application : test inconclusif' };
      else if (state.textHasMarker || rendered > 0) verdict = { status: 'TEST RÉUSSI', detail: 'entrée importée chargée, contenu affiché sans élément injecté' };
      else verdict = { status: 'TEST PARTIEL', detail: 'entrée importée chargée mais non affichée sur les routes testées' };
      const result = { id: 'T-INCR-02', bug: 'BUG-incremental-002', url, route, renderedJournalIcons: rendered, ...verdict, evidence: { scriptExecuted: xss, injectedImgCount: injected, ...state, pageErrors: log.pageErrors } };
      await L.shot(page, path.join(AUDIT, 'screenshots', 'incremental', 't-incr-02.png'));
      save('incremental', 'T-INCR-02', result);
      return result;
    } finally {
      await context.close();
    }
  });
}

// T-INCR-03 : BUG-incremental-003 (__proto__ dans deepMerge)
async function tIncr03(browser) {
  return withServer(ROOTS.incremental, 8104, async (url) => {
    const { context, page } = await L.newPage(browser, { width: 1366, height: 768 });
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      await L.sleep(2500);
      const res = await page.evaluate(() => {
        const merged = App.utils.deepMerge(App.state.defaultState(), JSON.parse('{"__proto__":{"polluted":1},"tokens":1}'));
        return {
          globalPolluted: ({}).polluted,
          localPolluted: merged.polluted,
          prototypeIsObjectPrototype: Object.getPrototypeOf(merged) === Object.prototype,
        };
      });
      let verdict;
      if (res.globalPolluted !== undefined) verdict = { status: 'TEST ÉCHOUÉ', detail: 'pollution globale de Object.prototype reproduite' };
      else if (res.localPolluted === 1) verdict = { status: 'TEST PARTIEL', detail: 'pollution locale confirmée (prototype de l\'objet fusionné) ; pollution globale non reproduite' };
      else verdict = { status: 'TEST RÉUSSI', detail: 'aucune pollution (locale ni globale)' };
      const result = { id: 'T-INCR-03', bug: 'BUG-incremental-003', url, ...verdict, evidence: res };
      save('incremental', 'T-INCR-03', result);
      return result;
    } finally {
      await context.close();
    }
  });
}

// T-AVANT-01 : BUG-avant-le-silence-001 (sauvegarde illisible réécrite sans copie)
async function tAvant01(browser) {
  return withServer(ROOTS.avant, 8101, async (url) => {
    const { context, page: first } = await L.newPage(browser, { width: 1366, height: 768 });
    const log = L.newLog();
    L.attach(first, log);
    try {
      await first.goto(url, { waitUntil: 'load', timeout: 60000 });
      await L.sleep(2500);
      await first.evaluate(() => localStorage.setItem('avant-le-silence.save.v1', '{'));
      const page = await reopen(context, first, url, log);
      await L.sleep(2500);
      const afterLoad = await page.evaluate(() => localStorage.getItem('avant-le-silence.save.v1'));
      const clicked = await L.clickByText(page, /commencer|démarrer|reprendre|continuer|lancer/i, 10000);
      await L.sleep(1500);
      for (let i = 0; i < 8; i += 1) {
        await L.clickByText(page, /suivant|continuer|poursuivre|suite|valider|ouvrir|commencer|passer|lire|fermer|étape/i, 1500);
        await L.sleep(1200);
      }
      await L.sleep(2000);
      const after = await page.evaluate(() => ({
        main: localStorage.getItem('avant-le-silence.save.v1'),
        backups: Object.keys(localStorage).filter((k) => k.startsWith('avant-le-silence.save.v1.backup')),
      }));
      let verdict;
      if (after.backups.length > 0) verdict = { status: 'TEST RÉUSSI', detail: `copie de secours présente : ${after.backups.join(', ')}` };
      else if (after.main !== '{') verdict = { status: 'TEST ÉCHOUÉ', detail: 'sauvegarde illisible remplacée par une progression neuve, sans copie de secours (bug confirmé)' };
      else verdict = { status: 'TEST PARTIEL', detail: 'clé inchangée : aucune écriture déclenchée par le parcours' };
      const result = { id: 'T-AVANT-01', bug: 'BUG-avant-le-silence-001', url, startButtonClicked: clicked, ...verdict, evidence: { afterLoadPrefix: afterLoad ? afterLoad.slice(0, 40) : null, afterSavePrefix: after.main ? after.main.slice(0, 60) : null, backups: after.backups, pageErrors: log.pageErrors } };
      await L.shot(page, path.join(AUDIT, 'screenshots', 'avant-le-silence', 't-avant-01.png'));
      save('avant-le-silence', 'T-AVANT-01', result);
      return result;
    } finally {
      await context.close();
    }
  });
}

// T-LYING-01 : BUG-the-lying-game-001 (minuteur de cadrage portrait actif en paysage)
async function tLying01(browser) {
  return withServer(ROOTS.lying, 8103, async (url) => {
    const { context, page } = await L.newPage(browser, { width: 1366, height: 768 });
    const log = L.newLog();
    L.attach(page, log);
    try {
      await page.addInitScript(() => {
        window.__mmCalls = 0;
        const original = window.matchMedia.bind(window);
        window.matchMedia = (query) => {
          if (String(query).includes('max-width: 600px')) window.__mmCalls += 1;
          return original(query);
        };
      });
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      await L.sleep(3000);
      await page.locator('#home-start').click({ timeout: 15000 });
      await L.sleep(2500);
      await L.clickByText(page, /^NOUVELLE SESSION$/i, 2000);
      for (let i = 0; i < 80; i += 1) {
        const canvas = await page.locator('#game-container canvas').count();
        const dialogue = await L.visible(page, '.dialogue-panel');
        if (canvas > 0 && !dialogue) break;
        const clicked = await L.clickByText(page, /CONTINUER/, 300);
        if (!clicked) await page.keyboard.press('Enter');
        await L.sleep(800);
      }
      const canvasCount = await page.locator('#game-container canvas').count();
      await page.evaluate(() => { window.__mmCalls = 0; });
      for (let i = 0; i < 10; i += 1) {
        await page.keyboard.press('KeyD');
        await L.sleep(500);
        await page.keyboard.press('KeyS');
        await L.sleep(500);
      }
      const calls = await page.evaluate(() => window.__mmCalls);
      const viewport = await page.evaluate(() => window.innerWidth + 'x' + window.innerHeight);
      let verdict;
      if (canvasCount === 0) verdict = { status: 'TEST PARTIEL', detail: 'canvas Phaser absent : partie non atteinte, test inconclusif' };
      else if (calls > 0) verdict = { status: 'TEST ÉCHOUÉ', detail: `matchMedia (max-width: 600px) appelé ${calls} fois en 10 s en paysage ${viewport} : minuteur actif (bug confirmé)` };
      else verdict = { status: 'TEST RÉUSSI', detail: 'aucun appel de cadrage portrait pendant la partie en paysage' };
      const result = { id: 'T-LYING-01', bug: 'BUG-the-lying-game-001', url, canvasCount, matchMediaCallsIn10s: calls, viewport, ...verdict, evidence: { pageErrors: log.pageErrors } };
      await L.shot(page, path.join(AUDIT, 'screenshots', 'the-lying-game', 't-lying-01.png'));
      save('the-lying-game', 'T-LYING-01', result);
      return result;
    } finally {
      await context.close();
    }
  });
}

// T-LYING-02 : BUG-the-lying-game-002 (beginNewGame efface la sauvegarde avant d'écrire la nouvelle)
async function tLying02(browser) {
  return withServer(ROOTS.lying, 8103, async (url) => {
    const { context, page: first } = await L.newPage(browser, { width: 1366, height: 768 });
    const log = L.newLog();
    L.attach(first, log);
    const KEY = 'the-lying-game.save.v1';
    try {
      await first.goto(url, { waitUntil: 'load', timeout: 60000 });
      await L.sleep(3000);
      await first.locator('#home-start').click({ timeout: 15000 });
      await L.sleep(2500);
      await L.clickByText(first, /^NOUVELLE SESSION$/i, 2000);
      await L.sleep(3000);
      for (let i = 0; i < 6; i += 1) {
        await first.keyboard.press('Enter');
        await L.sleep(600);
      }
      await L.sleep(1500);
      const keyBefore = await first.evaluate((k) => localStorage.getItem(k) !== null, KEY);
      if (!keyBefore) {
        const result = { id: 'T-LYING-02', bug: 'BUG-the-lying-game-002', url, status: 'TEST NON EFFECTUÉ', detail: 'aucune sauvegarde de partie créée : scénario impossible à préparer' };
        save('the-lying-game', 'T-LYING-02', result);
        return result;
      }
      const page = await reopen(context, first, url, log);
      await L.sleep(2500);
      await page.evaluate((k) => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === k) throw new Error('TEST-T-LYING-02 : écriture refusée (simulation de quota)');
          return original.call(this, key, value);
        };
      }, KEY);
      await page.locator('#home-start').click({ timeout: 15000 });
      await L.sleep(2000);
      const confirm = await L.clickByText(page, /^NOUVELLE SESSION$/i, 2000);
      await L.sleep(2500);
      const keyAfter = await page.evaluate((k) => localStorage.getItem(k), KEY);
      const injected = log.pageErrors.filter((e) => e.message.includes('TEST-T-LYING-02')).length;
      let verdict;
      if (keyAfter === null && injected > 0) verdict = { status: 'TEST ÉCHOUÉ', detail: 'l\'ancienne sauvegarde a été effacée et l\'écriture de la nouvelle a échoué (bug confirmé)' };
      else if (keyAfter !== null) verdict = { status: 'TEST RÉUSSI', detail: 'une sauvegarde subsiste après l\'échec d\'écriture' };
      else verdict = { status: 'TEST PARTIEL', detail: 'sauvegarde absente sans exception simulée : cause à examiner' };
      const result = { id: 'T-LYING-02', bug: 'BUG-the-lying-game-002', url, confirmClicked: Boolean(confirm), ...verdict, evidence: { keyBefore, keyAfter, injectedErrors: injected, pageErrors: log.pageErrors } };
      await L.shot(page, path.join(AUDIT, 'screenshots', 'the-lying-game', 't-lying-02.png'));
      save('the-lying-game', 'T-LYING-02', result);
      return result;
    } finally {
      await context.close();
    }
  });
}

// T-DOOM-01 : BUG-doomscroll-dungeon-001 (graine d'une sauvegarde rendue sans échappement)
async function tDoom01(browser) {
  const url = 'https://casifox.github.io/doomscroll-dungeon/';
  const { context, page: first } = await L.newPage(browser, { width: 1366, height: 768 });
  const log = L.newLog();
  L.attach(first, log);
  try {
    await first.goto(url, { waitUntil: 'load', timeout: 90000 });
    await L.sleep(4000);
    await first.locator('[data-menu="new"]').first().click({ timeout: 20000 });
    await first.locator('[data-launch]').first().click({ timeout: 10000 });
    await L.sleep(2000);
    await first.getByText('Passer le tutoriel').first().click({ timeout: 3000 }).catch(() => {});
    await L.sleep(6000);
    const raw = await first.evaluate(() => localStorage.getItem('doomscroll.v1.run'));
    if (!raw) {
      const result = { id: 'T-DOOM-01', bug: 'BUG-doomscroll-dungeon-001', url, status: 'TEST NON EFFECTUÉ', detail: 'aucune clé doomscroll.v1.run après démarrage : partie non sauvegardée, test impossible' };
      save('doomscroll-dungeon', 'T-DOOM-01', result);
      return result;
    }
    const payload = JSON.parse(raw);
    payload.run.seed = '<img src=x onerror=y=1>';
    await first.evaluate((value) => localStorage.setItem('doomscroll.v1.run', value), JSON.stringify(payload));
    const page = await reopen(context, first, url, log);
    await L.sleep(4000);
    let continued = false;
    try {
      await page.locator('[data-menu="continue"]').first().waitFor({ state: 'visible', timeout: 15000 });
      await page.locator('[data-menu="continue"]').first().click();
      continued = true;
    } catch (_) {
      continued = false;
    }
    await L.sleep(2500);
    await page.keyboard.press('Escape');
    await L.sleep(1500);
    const pauseOpen = await L.visible(page, '[data-pause-resume]');
    const injected = await page.evaluate(() => window.y === 1);
    const seedNode = await page.evaluate(() => {
      const el = document.querySelector('.pause-seed');
      return el ? el.innerHTML.slice(0, 120) : null;
    });
    const htmlInjected = Boolean(seedNode && seedNode.includes('<img'));
    let verdict;
    if (!pauseOpen) verdict = { status: 'TEST PARTIEL', detail: `écran pause non atteint (bouton « Reprendre la descente » cliqué : ${continued ? 'oui' : 'non'}) : test inconclusif` };
    else if (htmlInjected || injected) verdict = { status: 'TEST ÉCHOUÉ', detail: `graine non échappée : élément HTML présent dans le DOM (bug confirmé) ; script exécuté=${injected}` };
    else verdict = { status: 'TEST RÉUSSI', detail: 'graine affichée échappée : aucun élément HTML injecté' };
    const result = { id: 'T-DOOM-01', bug: 'BUG-doomscroll-dungeon-001', url, continueClicked: continued, pauseOpen, ...verdict, evidence: { scriptRan: injected, seedNodeHtml: seedNode, pageErrors: log.pageErrors } };
    await L.shot(page, path.join(AUDIT, 'screenshots', 'doomscroll-dungeon', 't-doom-01.png'));
    save('doomscroll-dungeon', 'T-DOOM-01', result);
    return result;
  } finally {
    await context.close();
  }
}

const TESTS = {
  'T-INCR-01': tIncr01,
  'T-INCR-02': tIncr02,
  'T-INCR-03': tIncr03,
  'T-AVANT-01': tAvant01,
  'T-LYING-01': tLying01,
  'T-LYING-02': tLying02,
  'T-DOOM-01': tDoom01,
};

async function main() {
  const wanted = process.argv[2] || 'all';
  const ids = wanted === 'all' ? Object.keys(TESTS) : [wanted];
  const browser = await L.openBrowser();
  try {
    for (const id of ids) {
      if (!TESTS[id]) throw new Error(`Test inconnu : ${id}`);
      try {
        const result = await TESTS[id](browser);
        console.log(`${result.id} | ${result.status} | ${result.detail}`);
      } catch (error) {
        console.log(`${id} | TEST NON EFFECTUÉ | exception du script : ${String(error.message).split('\n')[0]}`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
