'use strict';
// Tests ciblés en local sur le dossier ORIGINAL « incremental », servi en lecture seule par audit-tools\serve.js.
// T-INCR-01 : sauvegarde corrompue écrasée sans copie (BUG-incremental-001).
// T-INCR-02 : champs d'import rendus sans échappement (BUG-incremental-002).
// T-INCR-03 : clé __proto__ dans U.deepMerge (BUG-incremental-003).
// Le projet n'est jamais écrit : seules les clés localStorage du navigateur de test changent.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const TOOLS = path.resolve(__dirname, '..');
const ORIG = 'C:\\Users\\Noah\\Documents\\Jeux\\incremental';
const PORT = 8104;
const BASE = 'http://127.0.0.1:' + PORT + '/';
const SHOTS = 'C:\\Users\\Noah\\Documents\\CASIFOX-GAME-HUB\\audit\\screenshots\\incremental';
const LOGS = path.join(SHOTS, 'logs');
const KEY = 'neon_jackpot_save_v1';
fs.mkdirSync(LOGS, { recursive: true });

const T0 = Date.now();
const since = () => Date.now() - T0;
const XSS_PAYLOAD_ICON = '<img src=x onerror="window.__xss=1">';

const out = {
  startedAt: new Date().toISOString(),
  localServer: { command: 'node serve.js "' + ORIG + '" ' + PORT, cwd: TOOLS, root: ORIG },
  chromiumVersion: null,
  tests: {},
  console: [],
  pageErrors: [],
  requestFailed: [],
  httpErrors: [],
};

function attach(page, label) {
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      out.console.push({ label, t: since(), type, text: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    out.pageErrors.push({ label, t: since(), message: err.message });
  });
  page.on('requestfailed', (req) => {
    out.requestFailed.push({ label, t: since(), url: req.url(), errorText: (req.failure() || {}).errorText || null });
  });
  page.on('response', (resp) => {
    if (resp.status() >= 400) out.httpErrors.push({ label, t: since(), url: resp.url(), status: resp.status() });
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['serve.js', ORIG, String(PORT)], {
      cwd: TOOLS,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let buf = '';
    const timer = setTimeout(() => reject(new Error('serve.js : pas de démarrage en 10 s. ' + buf)), 10000);
    child.stdout.on('data', (d) => {
      buf += d.toString();
      if (buf.includes('Serving')) { clearTimeout(timer); resolve(child); }
    });
    child.stderr.on('data', (d) => { buf += d.toString(); });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error('serve.js arrêté (code ' + code + ') : ' + buf)); });
  });
}

const readKey = (page) => page.evaluate((k) => localStorage.getItem(k), KEY);
const waitApp = (page) => page.waitForFunction(() => !!(window.App && App.ready === true), undefined, { timeout: 20000 });

function describeRaw(raw) {
  if (raw === null || raw === undefined) return { present: false };
  try {
    const o = JSON.parse(raw);
    return {
      present: true,
      validJson: true,
      tokens: o.tokens,
      journalLength: Array.isArray(o.journal) ? o.journal.length : null,
      bytes: raw.length,
    };
  } catch (e) {
    return { present: true, validJson: false, parseError: String(e.message), value: raw.slice(0, 40), bytes: raw.length };
  }
}

async function closeModals(page) {
  for (let i = 0; i < 4; i++) {
    const open = await page.evaluate(() => !!(window.App && App.ui && App.ui.currentModal));
    if (!open) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(450);
  }
}

async function t01Literal(browser) {
  const label = 'T-INCR-01-controle-procedure-litterale';
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageA = await ctxA.newPage();
  attach(pageA, label + '-sous-controle');
  await pageA.goto(BASE, { waitUntil: 'load' });
  await waitApp(pageA);
  await pageA.waitForTimeout(1500);
  await pageA.evaluate((k) => localStorage.setItem(k, '{'), KEY);
  const sousApresSetItem = describeRaw(await readKey(pageA));
  await pageA.evaluate(() => window.dispatchEvent(new Event('beforeunload')));
  const sousApresBeforeunload = describeRaw(await readKey(pageA));
  await ctxA.close();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  attach(page, label);
  await page.goto(BASE, { waitUntil: 'load' });
  await waitApp(page);
  await page.waitForTimeout(1500);
  const baseline = describeRaw(await readKey(page));
  await page.evaluate((k) => localStorage.setItem(k, '{'), KEY);
  const apresSetItem = describeRaw(await readKey(page));
  await page.reload({ waitUntil: 'load' });
  await waitApp(page);
  await page.waitForTimeout(1500);
  const apresRechargement = describeRaw(await readKey(page));
  const avertissements = out.console.filter((m) => m.label === label && m.text.includes('sauvegarde corrompue')).length;
  await ctx.close();
  out.tests[label] = {
    methode: 'Procédure littérale : localStorage.setItem(clé, "{") dans la page, puis page.reload(). Contrôle de la procédure.',
    baseline,
    apresSetItem,
    apresRechargement,
    sousControleBeforeunload: {
      methode: 'Même page, sans rechargement : localStorage.setItem(clé, "{") puis dispatchEvent(new Event("beforeunload")) (listener main.js 141-144).',
      apresSetItem: sousApresSetItem,
      apresDispatchBeforeunload: sousApresBeforeunload,
    },
    avertissementSauvegardeCorrompue: avertissements,
    lecture: avertissements === 0
      ? 'La valeur "{" n\'a jamais été lue par State.load : elle a été réécrite par la sauvegarde de sortie (beforeunload, main.js 141-144 → State.save, state.js 284-299) avant le démarrage de la nouvelle page. La procédure littérale ne déclenche donc pas le chemin bugué ; voir T-INCR-01 (variante).'
      : 'Le chemin de lecture corrompue a été atteint.',
    statut: 'TEST PARTIEL (contrôle de procédure : non concluant pour le bug)',
  };
}

async function t01Main(browser) {
  const label = 'T-INCR-01';
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => {
    if (sessionStorage.getItem('__t_corrupt_next') === '1') {
      sessionStorage.removeItem('__t_corrupt_next');
      localStorage.setItem('neon_jackpot_save_v1', '{');
      window.__t_probe = localStorage.getItem('neon_jackpot_save_v1');
    }
  });
  const page = await ctx.newPage();
  attach(page, label);
  await page.goto(BASE, { waitUntil: 'load' });
  await waitApp(page);
  await page.waitForTimeout(1500);
  const baseline = describeRaw(await readKey(page));
  await page.evaluate(() => sessionStorage.setItem('__t_corrupt_next', '1'));
  await page.reload({ waitUntil: 'load' });
  const probe = await page.evaluate(() => (window.__t_probe === undefined ? null : window.__t_probe));
  await waitApp(page);
  const premiereLecture = describeRaw(await readKey(page));
  const t = Date.now();
  let remplacementApresMs = null;
  while (Date.now() - t < 4000) {
    const v = await readKey(page);
    if (v !== '{') { remplacementApresMs = Date.now() - t; break; }
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(1500);
  const apresDemarrage = describeRaw(await readKey(page));
  const keysApresDemarrage = await page.evaluate(() => Object.keys(localStorage));
  await page.evaluate(() => App.state.saveSoon());
  await page.waitForTimeout(1500);
  const apresSaveSoonManuel = describeRaw(await readKey(page));
  await closeModals(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SHOTS, 't-incr-01.png') });
  const keys = await page.evaluate(() => Object.keys(localStorage));
  const cles = await page.evaluate((k) => {
    const o = {};
    Object.keys(localStorage).filter((x) => x !== k).forEach((x) => { o[x] = (localStorage.getItem(x) || '').slice(0, 40); });
    return o;
  }, KEY);
  await ctx.close();
  const avertissements = out.console.filter((m) => m.label === label && m.text.includes('sauvegarde corrompue')).map((m) => m.text);
  const cleSecours = Object.keys(cles);
  const secoursContientAccolade = Object.values(cles).some((v) => v.includes('{'));
  let statut;
  let lecture;
  if (probe !== '{') {
    statut = 'TEST NON EFFECTUÉ';
    lecture = 'La valeur corrompue n\'a pas été posée avant le démarrage : le chemin testé n\'a pas été exercé.';
  } else if (apresDemarrage.validJson === true && cleSecours.length === 0) {
    statut = 'TEST ÉCHOUÉ';
    lecture = 'BUG-incremental-001 confirmé : la valeur "{" de la clé principale a été remplacée automatiquement après le démarrage, sans aucune clé de secours.';
  } else if (apresDemarrage.validJson === true && secoursContientAccolade) {
    statut = 'TEST RÉUSSI';
    lecture = 'Clé principale remplacée, mais une copie contenant "{" a été conservée.';
  } else {
    statut = 'TEST PARTIEL';
    lecture = 'Résultat non conforme aux deux cas prévus : lire le détail.';
  }
  out.tests[label] = {
    methode: 'Init script (sessionStorage flag) : pose localStorage["neon_jackpot_save_v1"] = "{" juste avant le démarrage de l\'application au rechargement suivant, afin d\'éviter l\'écrasement par la sauvegarde beforeunload de l\'ancienne page. Puis : lecture de la clé, avertissement console, App.state.saveSoon() manuel, recherche de clés de secours.',
    baseline,
    probeAvantDemarrage: probe,
    premiereLectureApresAppReady: premiereLecture,
    remplacementConstateApresMsDepuisAppReady: remplacementApresMs,
    apresDemarrage,
    apresSaveSoonManuel,
    avertissementsConsole: avertissements,
    clesLocalStorageApresDemarrage: keysApresDemarrage,
    clesLocalStorageApresTest: keys,
    clesAutresQueLaPrincipale: cles,
    lecture,
    statut,
    capture: 'screenshots/incremental/t-incr-01.png',
  };
}

async function t02Import(browser) {
  const label = 'T-INCR-02';
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  attach(page, label);
  await page.goto(BASE + '#settings', { waitUntil: 'load' });
  await waitApp(page);
  await page.waitForTimeout(1200);
  await closeModals(page);
  const payload = await page.evaluate((icon) => {
    const o = JSON.parse(App.state.export());
    o.journal.unshift({ icon: icon, text: 'test', value: '', at: 0 });
    return JSON.stringify(o);
  }, XSS_PAYLOAD_ICON);
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10000 }),
    page.click('#import-save', { timeout: 10000 }),
  ]);
  await chooser.setFiles({ name: 'sauvegarde-test-t-incr-02.json', mimeType: 'application/json', buffer: Buffer.from(payload, 'utf8') });
  await page.waitForSelector('.modal .modal-actions .btn-danger', { timeout: 10000 });
  const dialogue = await page.evaluate(() => { const m = document.querySelector('.modal'); return m ? m.innerText.slice(0, 240) : null; });
  await page.click('.modal .modal-actions .btn-danger', { timeout: 5000 });
  await page.waitForTimeout(2500);
  await page.waitForLoadState('load');
  await waitApp(page);
  const typeNavigation = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return n ? n.type : null; });
  const icone = await page.evaluate(() => (App.state.data.journal[0] || {}).icon || null);
  await page.evaluate(() => { location.hash = 'hub'; });
  await page.waitForSelector('.journal-row', { timeout: 10000 });
  await page.waitForTimeout(1500);
  const xss = await page.evaluate(() => (window.__xss === undefined ? 'undefined' : window.__xss));
  const htmlInjecte = await page.evaluate(() => { const el = document.querySelector('.journal-row .journal-icon'); return el ? el.innerHTML : null; });
  const nbImg = await page.evaluate(() => document.querySelectorAll('.journal-icon img').length);
  await page.evaluate(() => { const r = document.querySelector('.journal-row'); if (r) r.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, 't-incr-02.png') });
  await ctx.close();
  let statut;
  let lecture;
  if (xss === 1) {
    statut = 'TEST ÉCHOUÉ';
    lecture = 'BUG-incremental-002 confirmé : window.__xss = 1 après ouverture du journal rendu depuis une sauvegarde importée.';
  } else if (nbImg > 0) {
    statut = 'TEST PARTIEL';
    lecture = 'Le HTML forgé est inséré dans le DOM du journal (' + nbImg + ' img), mais window.__xss reste indéfini : exécution non démontrée.';
  } else {
    statut = 'TEST NON CONCLUANT';
    lecture = 'Le HTML forgé n\'apparaît pas dans le DOM du journal : lire le détail.';
  }
  out.tests[label] = {
    methode: 'Voie par fichier : clic sur #import-save (pages.js 1143-1171), interception du filechooser, fichier JSON construit par App.state.export() avec journal[0].icon = ' + XSS_PAYLOAD_ICON + ', confirmation « Importer » dans le modal, rechargement, ouverture de #hub, lecture de window.__xss.',
    dialogueConfirmation: dialogue,
    typeNavigationApresImport: typeNavigation,
    iconeImporteeDansEtat: icone,
    htmlInjecteDansJournal: htmlInjecte,
    nbImgDansJournal: nbImg,
    xss,
    lecture,
    statut,
    capture: 'screenshots/incremental/t-incr-02.png',
  };
}

async function t02Repli(browser) {
  const label = 'T-INCR-02-repli-localStorage';
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  attach(page, label);
  await page.goto(BASE, { waitUntil: 'load' });
  await waitApp(page);
  await page.waitForTimeout(1000);
  const payload = await page.evaluate((icon) => {
    const o = JSON.parse(App.state.export());
    o.journal.unshift({ icon: icon, text: 'test', value: '', at: 0 });
    return JSON.stringify(o);
  }, XSS_PAYLOAD_ICON);
  await ctx.addInitScript((p) => {
    if (sessionStorage.getItem('__t_inject') === '1') {
      sessionStorage.removeItem('__t_inject');
      localStorage.setItem('neon_jackpot_save_v1', p);
    }
  }, payload);
  await page.evaluate(() => sessionStorage.setItem('__t_inject', '1'));
  await page.reload({ waitUntil: 'load' });
  await waitApp(page);
  await page.waitForSelector('.journal-row', { timeout: 10000 });
  await page.waitForTimeout(1500);
  const xss = await page.evaluate(() => (window.__xss === undefined ? 'undefined' : window.__xss));
  const nbImg = await page.evaluate(() => document.querySelectorAll('.journal-icon img').length);
  await ctx.close();
  out.tests[label] = {
    methode: 'Repli (voie par fichier impossible) : même contenu écrit dans localStorage via un init script, avant le démarrage de l\'application. Ne passe pas par State.import ni par l\'interface d\'import.',
    nbImgDansJournal: nbImg,
    xss,
    statut: xss === 1 ? 'TEST ÉCHOUÉ' : (nbImg > 0 ? 'TEST PARTIEL' : 'TEST NON CONCLUANT'),
  };
}

async function t03Proto(browser) {
  const label = 'T-INCR-03';
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  attach(page, label);
  await page.goto(BASE, { waitUntil: 'load' });
  await waitApp(page);
  const r = await page.evaluate(() => {
    const result = App.utils.deepMerge(App.state.defaultState(), JSON.parse('{"__proto__":{"polluted":1},"tokens":1}'));
    const proto = Object.getPrototypeOf(result);
    return {
      globalEtObjectPrototype: ({}).polluted,
      objectPrototypePolluted: Object.prototype.polluted,
      resultPolluted: result.polluted,
      resultPollutedEstPropreAuObjet: Object.prototype.hasOwnProperty.call(result, 'polluted'),
      prototypeDuResultatEstObjectPrototype: proto === Object.prototype,
      clesDuPrototypeDuResultat: Object.keys(proto),
      resultTokens: result.tokens,
      defaultStatePolluted: App.state.defaultState().polluted,
    };
  });
  await ctx.close();
  const pollutionGlobale = r.globalEtObjectPrototype !== undefined || r.objectPrototypePolluted !== undefined || r.defaultStatePolluted !== undefined;
  const injectionLocale = r.resultPolluted === 1 && r.resultPollutedEstPropreAuObjet === false && r.prototypeDuResultatEstObjectPrototype === false;
  let statut;
  let lecture;
  if (pollutionGlobale) {
    statut = 'TEST ÉCHOUÉ';
    lecture = 'Pollution globale de Object.prototype démontrée.';
  } else if (injectionLocale) {
    statut = 'TEST PARTIEL';
    lecture = 'Pollution globale NON démontrée : ({}).polluted reste undefined. Injection locale démontrée : le filtrage de __proto__ est absent, l\'objet fusionné reçoit le prototype fourni par le fichier (result.polluted = 1, propriété non propre). BUG-incremental-003 reste SUSPECTÉ pour la pollution globale.';
  } else {
    statut = 'TEST NON CONCLUANT';
    lecture = 'Ni pollution globale ni injection locale observée : lire le détail.';
  }
  out.tests[label] = {
    methode: 'Dans la page : App.utils.deepMerge(App.state.defaultState(), JSON.parse(\'{"__proto__":{"polluted":1},"tokens":1}\')), puis lecture de ({}).polluted et de result.polluted.',
    resultat: r,
    pollutionGlobaleDemontree: pollutionGlobale,
    injectionLocaleDemontree: injectionLocale,
    lecture,
    statut,
  };
}

(async () => {
  let server = null;
  let browser = null;
  try {
    server = await startServer();
    browser = await chromium.launch({ headless: true });
    out.chromiumVersion = browser.version();
    await t01Literal(browser);
    await t01Main(browser);
    try {
      await t02Import(browser);
    } catch (e) {
      out.tests['T-INCR-02'] = { statut: 'TEST NON EFFECTUÉ (voie par fichier)', erreur: String(e.message).split('\n')[0] };
      await t02Repli(browser);
    }
    await t03Proto(browser);
  } catch (e) {
    out.fatalError = String(e.stack || e).split('\n').slice(0, 8).join('\n');
  } finally {
    out.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(LOGS, 'local-tests.json'), JSON.stringify(out, null, 2), 'utf8');
    if (browser) await browser.close();
    if (server) server.kill();
  }
  const resume = {};
  for (const [k, v] of Object.entries(out.tests)) resume[k] = { statut: v.statut, lecture: v.lecture || v.erreur || null };
  console.log(JSON.stringify({ chromium: out.chromiumVersion, fatalError: out.fatalError || null, resume, consoleCount: out.console.length, pageErrors: out.pageErrors, requestFailed: out.requestFailed, httpErrors: out.httpErrors }, null, 2));
})().catch((e) => {
  console.error('ERREUR', e && e.stack ? e.stack : e);
  process.exit(1);
});
