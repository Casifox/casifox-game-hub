'use strict';
// Tests du portail CASIFOX GAME HUB. Usage : node tests/hub-test.js
const path = require('path');
const L = require('./lib');

const HUB = path.resolve(__dirname, '..', '..');
const AUDIT = path.join(HUB, 'audit');
const OUT = path.join(AUDIT, 'screenshots', 'hub');
const PORT = 8200;

const results = [];
function add(id, title, status, detail, evidence) {
  results.push({ id, title, status, detail, evidence: evidence || null });
}

async function main() {
  const override = process.env.CASIFOX_HUB_URL || '';
  const server = override ? null : await L.startStatic(HUB, PORT);
  const browser = await L.openBrowser();
  const base = override || `http://127.0.0.1:${PORT}/`;
  const log = L.newLog();
  try {
    const { context, page } = await L.newPage(browser, { width: 1920, height: 1080 });
    L.attach(page, log);
    await page.goto(base, { waitUntil: 'load', timeout: 60000 });
    await L.sleep(2000);
    await L.shot(page, path.join(OUT, '01-accueil.png'));

    add('LOAD', 'Chargement de l\'accueil', log.pageErrors.length === 0 && log.httpErrors.length === 0 ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', `erreurs JS=${log.pageErrors.length} ; HTTP>=400=${log.httpErrors.length} ; échecs réseau=${log.failedRequests.length}`);

    const cards = await page.locator('.game-card').count();
    add('CARDS', 'Cinq cartes de jeux', cards === 5 ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', `${cards} carte(s) trouvée(s)`, '01-accueil.png');

    // Recherche sur chaque nom
    const names = ['Doomscroll Dungeon', 'The Lying Game', 'Neon Jackpot', "Quand les notes s'effacent", 'AVANT LE SILENCE'];
    const searchResults = [];
    for (const name of names) {
      await page.locator('#search').fill(name);
      await L.sleep(300);
      const count = await page.locator('.game-card').count();
      const first = count ? await page.locator('.game-card .card-title').first().textContent() : null;
      searchResults.push({ name, count, first });
    }
    await page.locator('#search').fill('');
    await L.sleep(300);
    const searchOk = searchResults.every((item) => item.count === 1);
    add('SEARCH', 'Recherche instantanée par nom (5 requêtes)', searchOk ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', JSON.stringify(searchResults), null);

    // Filtres par genre
    const chips = await page.locator('#genre-chips .chip').all();
    const filterResults = [];
    for (const chip of chips) {
      const genre = (await chip.textContent()).trim();
      await chip.click();
      await L.sleep(250);
      const count = await page.locator('.game-card').count();
      filterResults.push({ genre, count });
    }
    const filterOk = filterResults.every((item) => item.count > 0);
    add('FILTERS', 'Filtres par genre (toutes les puces)', filterOk ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', JSON.stringify(filterResults), null);
    await page.locator('[data-genre="Tous"]').click();
    await L.sleep(250);

    // Tris
    const sortChecks = [];
    for (const [value, expected] of [
      ['score-desc', 'Doomscroll Dungeon'],
      ['score-asc', 'AVANT LE SILENCE'],
      ['name-asc', 'AVANT LE SILENCE'],
      ['recent', 'The Lying Game'],
    ]) {
      await page.locator('#sort').selectOption(value);
      await L.sleep(250);
      const first = ((await page.locator('.game-card .card-title').first().textContent()) || '').trim();
      sortChecks.push({ sort: value, first, expected });
    }
    const sortOk = sortChecks.every((item) => item.first === item.expected);
    add('SORTS', 'Tris note décroissante, croissante, A–Z, récent', sortOk ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', JSON.stringify(sortChecks), null);

    // Liens des cartes
    await page.locator('#sort').selectOption('score-desc');
    await L.sleep(250);
    const linkChecks = [];
    const cardCount = await page.locator('.game-card').count();
    for (let i = 0; i < cardCount; i += 1) {
      const card = page.locator('.game-card').nth(i);
      const name = ((await card.locator('.card-title').textContent()) || '').trim();
      const play = await card.locator('.card-actions a.btn-primary').getAttribute('href');
      const detail = await card.locator('.card-actions a.btn-ghost').getAttribute('href');
      linkChecks.push({ name, play, detail });
    }
    const gamesData = await page.evaluate(() => window.CASIFOX_GAMES.map((g) => ({ name: g.name, url: g.url })));
    const linksOk = linkChecks.every((item) => {
      const game = gamesData.find((g) => g.name === item.name);
      return game && item.play === game.url && item.detail && item.detail.startsWith('games/');
    });
    add('CARD-LINKS', 'Liens « Jouer » et « Fiche » de chaque carte', linksOk ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', JSON.stringify(linkChecks), null);

    // Classement
    const rankRows = await page.locator('#ranking .rank-row:not(.rank-row--head)').count();
    const rankScores = await page.locator('#ranking .rank-score').allTextContents();
    const numeric = rankScores.map((text) => parseInt(text, 10)).filter((value) => !Number.isNaN(value));
    const sorted = numeric.every((value, index) => index === 0 || numeric[index - 1] >= value);
    add('RANKING', 'Classement visible et trié', rankRows === 5 && sorted ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', `${rankRows} lignes ; scores=${rankScores.join(', ')}`, null);

    // Navigation et ancres
    const anchors = await page.locator('#nav-links a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    const missingAnchors = [];
    for (const href of anchors) {
      if (!href) continue;
      const exists = await page.locator(href).count();
      if (!exists) missingAnchors.push(href);
    }
    add('NAV', 'Navigation et ancres', anchors.length >= 5 && missingAnchors.length === 0 ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', `liens=${anchors.join(', ')} ; manquants=${missingAnchors.join(', ') || 'aucun'}`, null);

    // Images
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await L.sleep(1200);
    const images = await page.evaluate(() =>
      Array.from(document.images).map((img) => ({ src: img.getAttribute('src'), ok: img.complete && img.naturalWidth > 0 }))
    );
    add('IMAGES', 'Chargement de toutes les images', images.every((img) => img.ok) ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', `${images.filter((img) => img.ok).length}/${images.length} images chargées`, null);
    await page.evaluate(() => window.scrollTo(0, 0));

    // Métadonnées
    const meta = await page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      og: document.querySelector('meta[property="og:title"]')?.content || '',
      favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href') || '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
    }));
    add('META', 'Titre, description, Open Graph, favicon, canonical', meta.title && meta.description && meta.og && meta.favicon && meta.canonical ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', JSON.stringify(meta), null);

    // Fiches détaillées
    const detailSlugs = ['doomscroll-dungeon', 'the-lying-game', 'incremental', 'quand-les-notes-seffacent', 'avant-le-silence'];
    const detailResults = [];
    for (const slug of detailSlugs) {
      const detailLog = L.newLog();
      const detailPage = await context.newPage();
      L.attach(detailPage, detailLog);
      try {
        await detailPage.goto(`${base}games/${slug}/`, { waitUntil: 'load', timeout: 60000 });
        await L.sleep(900);
        const h1 = ((await detailPage.locator('#game-detail h1').first().textContent().catch(() => '')) || '').trim();
        const play = await detailPage.locator('#game-detail a.btn-primary').first().getAttribute('href').catch(() => null);
        const repo = await detailPage.locator('#game-detail a.btn-ghost').first().getAttribute('href').catch(() => null);
        const scoreText = ((await detailPage.locator('#game-detail .pill').first().textContent().catch(() => '')) || '').trim();
        detailResults.push({ slug, h1, play, repo, scoreText, errors: detailLog.pageErrors.length });
        if (slug === 'doomscroll-dungeon') await L.shot(detailPage, path.join(OUT, '02-fiche.png'));
      } finally {
        await detailPage.close();
      }
    }
    const detailsOk = detailResults.every((item) => item.h1 && item.play && item.repo && item.scoreText.includes('Note') && item.errors === 0);
    add('DETAILS', 'Cinq fiches détaillées', detailsOk ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', JSON.stringify(detailResults), '02-fiche.png');

    // Page 404
    const errorLog = L.newLog();
    const errorPage = await context.newPage();
    L.attach(errorPage, errorLog);
    try {
      await errorPage.goto(`${base}404.html`, { waitUntil: 'load', timeout: 60000 });
      const h1 = ((await errorPage.locator('h1').first().textContent().catch(() => '')) || '').trim();
      await L.shot(errorPage, path.join(OUT, '03-404.png'));
      add('404', 'Page 404', h1.includes('Page introuvable') && errorLog.pageErrors.length === 0 ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', `titre=${h1} ; erreurs=${errorLog.pageErrors.length}`, '03-404.png');
    } finally {
      await errorPage.close();
    }

    // Liens internes (hors FINAL-REPORT pas encore créé)
    const localLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map((a) => a.getAttribute('href'))
        .filter((href) => href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto'))
    );
    const uniqueLinks = [...new Set(localLinks)];
    const linkStatuses = [];
    for (const href of uniqueLinks) {
      try {
        const response = await page.request.get(new URL(href, base).toString());
        linkStatuses.push({ href, status: response.status() });
      } catch (error) {
        linkStatuses.push({ href, status: 'erreur' });
      }
    }
    const brokenLinks = linkStatuses.filter((item) => item.status !== 200);
    add('INTERNAL-LINKS', 'Liens internes de l\'accueil', brokenLinks.length === 0 ? 'TEST RÉUSSI' : 'TEST PARTIEL', JSON.stringify(linkStatuses), null);

    // Clavier : lien d'évitement (page rechargée pour repartir du premier élément)
    await page.goto(base, { waitUntil: 'load', timeout: 60000 });
    await L.sleep(600);
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.className || document.activeElement?.tagName);
    add('KEYBOARD', 'Premier focus clavier sur le lien d\'évitement', String(focused).includes('skip-link') ? 'TEST RÉUSSI' : 'TEST PARTIEL', `élément focalisé : ${focused}`, null);

    await context.close();

    // Viewports
    for (const vp of L.VIEWPORTS) {
      const { context: vpContext, page: vpPage } = await L.newPage(browser, vp);
      const vpLog = L.newLog();
      L.attach(vpPage, vpLog);
      try {
        await vpPage.goto(base, { waitUntil: 'load', timeout: 60000 });
        await L.sleep(1200);
        const overflow = await L.horizontalOverflow(vpPage);
        const file = `vp-${vp.name}.png`;
        await L.shot(vpPage, path.join(OUT, file));
        add(`VP-${vp.name}`, `Hub en ${vp.width}x${vp.height}${vp.isMobile ? ' (mobile, tactile)' : ''}`, overflow.overflow || vpLog.pageErrors.length > 0 ? 'TEST PARTIEL' : 'TEST RÉUSSI', `débordement=${overflow.overflow} (scrollWidth ${overflow.scrollWidth} ; innerWidth ${overflow.innerWidth}) ; erreurs=${vpLog.pageErrors.length}`, file);
      } finally {
        await vpContext.close();
      }
    }

    // Mouvement réduit
    const reducedContext = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const reducedPage = await reducedContext.newPage();
    try {
      await reducedPage.goto(base, { waitUntil: 'load', timeout: 60000 });
      await L.sleep(800);
      const hidden = await reducedPage.evaluate(() =>
        Array.from(document.querySelectorAll('.reveal')).filter((el) => getComputedStyle(el).opacity === '0').length
      );
      add('REDUCED-MOTION', 'Préférence « mouvement réduit » respectée', hidden === 0 ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', `${hidden} bloc(s) encore masqué(s)`, null);
    } finally {
      await reducedContext.close();
    }

    // Capture mobile de référence
    const mobile = await L.newPage(browser, { width: 390, height: 844, isMobile: true, hasTouch: true });
    try {
      await mobile.page.goto(base, { waitUntil: 'load', timeout: 60000 });
      await L.sleep(1200);
      await L.shot(mobile.page, path.join(OUT, '04-mobile.png'));
    } finally {
      await mobile.context.close();
    }

    L.writeJson(path.join(OUT, 'logs', 'hub-result.json'), { date: new Date().toISOString(), base, results, console: log.console, pageErrors: log.pageErrors, httpErrors: log.httpErrors, failedRequests: log.failedRequests });
    for (const r of results) console.log(`${r.id} | ${r.status} | ${r.detail}`);
  } finally {
    await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
