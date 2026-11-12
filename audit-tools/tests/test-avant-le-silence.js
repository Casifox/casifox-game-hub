// Phase 3 — AVANT LE SILENCE, en local (serveur 127.0.0.1:8101). Protocole 8.2 adapté.
// Lecture seule sur le jeu. Sorties : audit\screenshots\avant-le-silence\ (captures) et \logs\ (JSON).
const { chromium } = require('playwright');
const path = require('path');
const L = require('./lib');

const SLUG = 'avant-le-silence';
const BASE = 'http://127.0.0.1:8101/';
const SAVE_KEY = 'avant-le-silence.save.v1';
const { shots, logs } = L.dirs(SLUG);
const shot = (name) => path.join(shots, name);

const CANDIDATES = [
  { key: 'accepter-avertissement', loc: (p) => p.getByRole('button', { name: "J'ai compris, continuer", exact: true }) },
  { key: 'commencer-parcours', loc: (p) => p.getByRole('button', { name: 'Commencer le parcours', exact: true }) },
  { key: 'ouvrir-chapitre-avertissement', loc: (p) => p.getByRole('button', { name: 'Ouvrir le chapitre', exact: true }) },
  { key: 'lien-chapitre', loc: (p) => p.locator('a.chapter-card__link:visible') },
  { key: 'espace-suivant', loc: (p) => p.locator('a:visible', { hasText: 'Espace suivant' }) },
  { key: 'element-a-consulter', loc: (p) => p.locator('button.item-button:visible:not([data-done="true"])') },
  { key: 'point-d-interet', loc: (p) => p.locator('button.hotspot:visible') },
  {
    key: 'suite-generique',
    loc: (p) => p.locator('button:visible, a:visible').filter({ hasText: /^(Question suivante|Suivant|Suite|Continuer|Terminer|Lire la conclusion|Voir le bilan)/ })
  }
];

async function saveSummary(page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return { exists: false };
    let s = null;
    let parseError = null;
    try {
      s = JSON.parse(raw);
    } catch (e) {
      parseError = String(e.message);
    }
    if (!s) return { exists: true, length: raw.length, parseError };
    const chapters = s.chapters && typeof s.chapters === 'object' ? Object.values(s.chapters) : [];
    return {
      exists: true,
      length: raw.length,
      parseError,
      warningAcknowledged: s.warningAcknowledged ?? null,
      lastRoute: s.lastRoute ?? null,
      documentsRead: Array.isArray(s.documentsRead) ? s.documentsRead.length : null,
      peopleMet: Array.isArray(s.peopleMet) ? s.peopleMet.length : null,
      visitedScenes: chapters.reduce((n, c) => n + ((c.visitedScenes || []).length), 0),
      chaptersCompleted: chapters.filter((c) => c.completed).length,
      updatedAt: s.updatedAt ?? null
    };
  }, SAVE_KEY);
}

async function visibleButtons(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('button'))
      .filter((b) => {
        const r = b.getBoundingClientRect();
        const s = getComputedStyle(b);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
      })
      .map((b) => ({ text: (b.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 90), aria: b.getAttribute('aria-label'), cls: b.className, disabled: b.disabled }))
  );
}

// Pilote la progression : clique le premier bouton de progression visible (ordre fixe),
// ferme les fenêtres modales avec Échap, et évite de répéter la même action sur la même route plus de 3 fois.
async function driveAvant(page, { durationMs, tickMs = 1000, onTick, stopWhen, actions }) {
  const begin = Date.now();
  let lastSig = null;
  let repeat = 0;
  while (Date.now() - begin < durationMs) {
    const elapsed = Date.now() - begin;
    if (onTick) await onTick(elapsed);
    if (stopWhen && (await stopWhen())) break;
    const t = L.since();
    const hash = await page.evaluate(() => location.hash);
    if ((await page.locator('.modal-backdrop:visible').count()) > 0) {
      await page.keyboard.press('Escape');
      actions.push({ t, key: 'fermer-fenetre-modale-echap', hash });
      await page.waitForTimeout(tickMs);
      continue;
    }
    let acted = false;
    for (const c of CANDIDATES) {
      const loc = c.loc(page);
      if ((await loc.count()) === 0) continue;
      const first = loc.first();
      if (!(await first.isVisible())) continue;
      const sig = `${c.key}|${hash}`;
      repeat = sig === lastSig ? repeat + 1 : 1;
      lastSig = sig;
      if (repeat > 3) {
        actions.push({ t, key: c.key, hash, skipped: 'anti-boucle : même action trois fois sur la même route' });
        continue;
      }
      const label = ((await first.innerText().catch(() => '')) || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      let error = null;
      try {
        await first.click({ timeout: 4000 });
      } catch (e) {
        error = String(e.message).split('\n')[0];
      }
      await page.waitForTimeout(600);
      actions.push({ t, key: c.key, label, hashBefore: hash, hashAfter: await page.evaluate(() => location.hash), error });
      acted = true;
      break;
    }
    if (!acted) actions.push({ t, key: 'aucun-bouton-de-progression-visible', hash });
    await page.waitForTimeout(tickMs);
  }
}

async function viewportCheck(browser, w, h, mobile) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const store = L.newStore();
  L.observe(page, store);
  const actions = [];
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  const accueil = await L.layoutCheck(page);
  await page.screenshot({ path: shot(`vp-${w}.png`) });
  await page.getByRole('button', { name: 'Commencer le parcours', exact: true }).click();
  await driveAvant(page, {
    durationMs: 25000,
    tickMs: 800,
    actions,
    stopWhen: async () => (await page.evaluate(() => location.hash)).includes('/scene/')
  });
  const hashFinal = await page.evaluate(() => location.hash);
  const jeu = await L.layoutCheck(page);
  await page.screenshot({ path: shot(`vp-${w}-jeu.png`) });
  const result = {
    viewport: `${w}x${h}`,
    isMobile: mobile,
    accueil,
    jeu,
    sceneReached: hashFinal.includes('/scene/'),
    hashFinal,
    actionsCount: actions.length,
    console: store.console,
    pageErrors: store.pageErrors,
    httpErrors: store.httpErrors,
    failedRequests: store.failedRequests
  };
  await context.close();
  return result;
}

(async () => {
  const report = {
    slug: SLUG,
    dateExecution: '2026-11-12',
    base: BASE,
    steps: {},
    actions: [],
    saves: {},
    menu: null,
    persistence: null,
    metrics: {},
    viewports: []
  };
  const browser = await chromium.launch({ headless: true });
  report.browser = { engine: 'Chromium (Playwright)', version: browser.version(), headless: true };
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  const store = L.newStore();
  L.observe(page, store);
  const net = await L.trackNetwork(context, page);

  // Étape 1 : ouverture, attente load puis 5 s
  await page.goto(BASE, { waitUntil: 'load' });
  report.metrics.navigationAtLoad = await L.navTimings(page);
  report.metrics.networkAtLoad = L.netSnapshot(net);
  await page.waitForTimeout(5000);
  report.steps.etape1 = { url: BASE, title: await page.title(), hash: await page.evaluate(() => location.hash), networkAfter5s: L.netSnapshot(net) };

  // Étapes 2–3 : erreurs (collectées en continu) et capture initiale
  await page.screenshot({ path: shot('01-accueil.png') });
  report.steps.etape3 = { file: '01-accueil.png', visibleButtons: await visibleButtons(page) };

  // Étape 4 : démarrage. Bouton identifié dans js/ui/home-screen.js (renderHome) : classe btn--primary, libellé narratives.home.start.
  await page.getByRole('button', { name: 'Commencer le parcours', exact: true }).click();

  // Étape 5 : jouer 30 s
  let fpsPromise = null;
  let taken = { s0: false, s15: false };
  await driveAvant(page, {
    durationMs: 30000,
    tickMs: 1000,
    actions: report.actions,
    onTick: async (elapsed) => {
      if (!taken.s0) {
        taken.s0 = true;
        await page.screenshot({ path: shot('02-jeu-0s.png') });
        report.saves.t0 = await saveSummary(page);
      }
      if (!fpsPromise && elapsed >= 10000) fpsPromise = L.rafSample(page, 10000);
      if (!taken.s15 && elapsed >= 15000) {
        taken.s15 = true;
        await page.screenshot({ path: shot('03-jeu-15s.png') });
        report.saves.t15 = await saveSummary(page);
      }
    }
  });
  await page.screenshot({ path: shot('04-jeu-30s.png') });
  report.saves.t30 = await saveSummary(page);
  report.steps.etape5 = { hashFinal: await page.evaluate(() => location.hash), actionsCount: report.actions.length };
  report.metrics.fps = L.fpsStats(fpsPromise ? await fpsPromise : null);
  report.metrics.networkAfterSession = L.netSnapshot(net);

  // Étape 6 : menu. Le jeu contient « Menu et pause » (chapter-screen.js 618 et 766–782). Test d'ouverture et de fermeture.
  const menuButton = page.locator('button[aria-label="Menu, pause et paramètres"]:visible');
  if ((await menuButton.count()) > 0) {
    await menuButton.first().click();
    await page.waitForTimeout(700);
    const titleCount = await page.getByText('Menu et pause', { exact: true }).count();
    const openCount = await page.locator('.modal-backdrop:visible').count();
    await page.screenshot({ path: shot('05-menu-pause-ouvert.png') });
    await page.getByRole('button', { name: 'Fermer', exact: true }).click();
    await page.waitForTimeout(700);
    const afterCount = await page.locator('.modal-backdrop:visible').count();
    report.menu = { atteint: true, titreAffiche: titleCount > 0, fenetreOuverte: openCount > 0, fenetreOuverteApresFermer: afterCount > 0, fichierCapture: '05-menu-pause-ouvert.png' };
  } else {
    report.menu = { atteint: false, raison: 'bouton « Menu, pause et paramètres » absent : la progression de 30 s n\'a pas atteint une scène' };
  }

  // Étape 7 : persistance. Rechargement à la même route, puis retour à l'accueil et vérification de « Continuer ».
  const beforeReload = await saveSummary(page);
  const hashBeforeReload = await page.evaluate(() => location.hash);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(5000);
  const afterReload = await saveSummary(page);
  const hashAfterReload = await page.evaluate(() => location.hash);
  await page.evaluate(() => {
    location.hash = '#/accueil';
  });
  await page.waitForTimeout(1200);
  const continueButton = page.getByRole('button', { name: 'Continuer', exact: true });
  const continueEnabled = await continueButton.isEnabled();
  const homeNotice = await page.locator('.home-panel .tiny').allInnerTexts();
  await page.screenshot({ path: shot('06-accueil-apres-rechargement.png') });
  let hashAfterContinue = null;
  if (continueEnabled) {
    await continueButton.click();
    await page.waitForTimeout(1500);
    hashAfterContinue = await page.evaluate(() => location.hash);
  }
  report.persistence = { beforeReload, hashBeforeReload, afterReload, hashAfterReload, continueEnabled, homeNotice, hashAfterContinue };

  // Étape 8 : métriques finales
  report.metrics.consoleAndErrorsAtEnd = { console: store.console.length };

  report.consoleErrors = store.console;
  report.pageErrors = store.pageErrors;
  report.failedRequests = store.failedRequests;
  report.httpErrors = store.httpErrors;
  report.networkByUrl = net.byUrl;

  // Étape 9 : viewports
  for (const [w, h, mobile] of [[1920, 1080, false], [1366, 768, false], [768, 1024, false], [390, 844, true]]) {
    report.viewports.push(await viewportCheck(browser, w, h, mobile));
  }

  await context.close();
  await browser.close();
  L.writeJson(path.join(logs, 'avant-le-silence-run-principal.json'), report);
  console.log('OK', path.join(logs, 'avant-le-silence-run-principal.json'));
})().catch((e) => {
  console.error('ERREUR', e && e.stack ? e.stack : e);
  process.exitCode = 1;
});
