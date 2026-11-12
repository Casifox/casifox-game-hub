'use strict';
// Parcours de phase 3 par jeu. Usage : node tests/flows.js <slug>
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const L = require('./lib');

const HUB = path.resolve(__dirname, '..', '..');
const AUDIT = path.join(HUB, 'audit');

const GAMES = {
  'doomscroll-dungeon': { url: 'https://casifox.github.io/doomscroll-dungeon/' },
  incremental: { url: 'https://casifox.github.io/neon-jackpot/', gitRoot: 'C:\\Users\\Noah\\Documents\\Jeux\\incremental' },
  'avant-le-silence': {
    localRoot: 'C:\\Users\\Noah\\Documents\\Jeux\\AVANT LE SILENCE',
    port: 8101,
    gitRoot: 'C:\\Users\\Noah\\Documents\\Jeux\\AVANT LE SILENCE',
    versionServed: 'index.html',
    versionHead: 'index.html',
  },
  'quand-les-notes-seffacent': {
    localRoot: "C:\\Users\\Noah\\Documents\\Jeux\\QUAND LES NOTES S'EFFACENT",
    port: 8102,
    gitRoot: "C:\\Users\\Noah\\Documents\\Jeux\\QUAND LES NOTES S'EFFACENT",
    versionServed: 'index.html',
    versionHead: 'index.html',
  },
  'the-lying-game': {
    localRoot: 'C:\\Users\\Noah\\Documents\\Jeux\\the-lying-game\\docs',
    port: 8103,
    gitRoot: 'C:\\Users\\Noah\\Documents\\Jeux\\the-lying-game',
    versionServed: 'index.html',
    versionHead: 'docs/index.html',
  },
};

function add(steps, id, title, status, detail, evidence) {
  steps.push({ id, title, status, detail, evidence: evidence || null });
}

function delta(before, after) {
  return {
    pageErrors: after.pageErrors - before.pageErrors,
    httpErrors: after.httpErrors - before.httpErrors,
    failedRequests: after.failedRequests - before.failedRequests,
  };
}

function loadStatus(d) {
  if (d.pageErrors > 0) return 'TEST ÉCHOUÉ';
  if (d.httpErrors > 0 || d.failedRequests > 0) return 'TEST PARTIEL';
  return 'TEST RÉUSSI';
}

function sizeByType(resources) {
  const groups = {};
  for (const r of resources) {
    if (r.bytes === null) continue;
    let ext = (r.url.split('?')[0].split('.').pop() || 'autre').toLowerCase();
    if (ext.length > 6 || ext.includes('/')) ext = 'autre';
    groups[ext] = (groups[ext] || 0) + r.bytes;
  }
  return groups;
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function headBlobSha(root, relPath) {
  const buffer = execFileSync('git', ['-C', root, 'show', `HEAD:${relPath}`], { maxBuffer: 64 * 1024 * 1024 });
  return sha256Buffer(buffer);
}

async function checkVersion(c, steps, id, title) {
  const cfg = c.cfg;
  if (!cfg.gitRoot || !cfg.versionServed || !cfg.versionHead) {
    add(steps, id, title, 'TEST NON EFFECTUÉ', 'aucun dépôt Git ou fichier de version défini', null);
    return;
  }
  try {
    const response = await c.page.request.get(new URL(cfg.versionServed, c.baseUrl).toString());
    const liveHash = sha256Buffer(await response.body());
    const headHash = headBlobSha(cfg.gitRoot, cfg.versionHead);
    add(
      steps,
      id,
      title,
      liveHash === headHash ? 'TEST RÉUSSI' : 'TEST PARTIEL',
      `SHA256 servi=${liveHash.slice(0, 16)}… ; SHA256 HEAD=${headHash.slice(0, 16)}… (${cfg.versionHead})`,
      null,
    );
  } catch (error) {
    add(steps, id, title, 'TEST NON EFFECTUÉ', `exception du script : ${String(error.message).split('\n')[0]}`, null);
  }
}

async function viewportChecks(c, steps, data) {
  for (const vp of L.VIEWPORTS) {
    const { context, page } = await L.newPage(c.browser, vp);
    const log = L.newLog();
    L.attach(page, log);
    try {
      await page.goto(c.baseUrl, { waitUntil: 'load', timeout: 90000 });
      await L.sleep(3000);
      const ov = await L.horizontalOverflow(page);
      const file = `vp-${vp.name}.png`;
      await L.shot(page, path.join(c.out, file));
      const status = ov.overflow || log.pageErrors.length > 0 ? 'TEST PARTIEL' : 'TEST RÉUSSI';
      add(
        steps,
        `VP-${vp.name}`,
        `Affichage ${vp.width}x${vp.height}${vp.isMobile ? ' (mobile, tactile)' : ''}`,
        status,
        `débordement horizontal=${ov.overflow} (scrollWidth ${ov.scrollWidth} ; innerWidth ${ov.innerWidth}) ; erreurs JS=${log.pageErrors.length}`,
        file,
      );
      data.viewports.push({ viewport: vp.name, ...ov, pageErrors: log.pageErrors.length, httpErrors: log.httpErrors.length });
    } catch (error) {
      add(steps, `VP-${vp.name}`, `Affichage ${vp.width}x${vp.height}`, 'TEST NON EFFECTUÉ', `exception du script : ${String(error.message).split('\n')[0]}`, null);
    } finally {
      await context.close();
    }
  }
}

async function flowDoomscroll(c, steps, data) {
  const { page, out, log } = c;
  let started = false;
  try {
    await page.locator('[data-menu="new"]').first().waitFor({ state: 'visible', timeout: 20000 });
    await page.locator('[data-menu="new"]').first().click();
    await page.locator('[data-launch]').first().waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('[data-launch]').first().click();
    await L.sleep(2000);
    const tutoVisible = await page.getByText('Passer le tutoriel').first().isVisible().catch(() => false);
    if (tutoVisible) {
      await L.shot(page, path.join(out, '02a-tutoriel.png'));
      await page.getByText('Passer le tutoriel').first().click();
      add(steps, 'TUTORIEL', 'Tutoriel de premier lancement affiché puis passé (« Passer le tutoriel »)', 'TEST RÉUSSI', 'tutoriel visible à l\'ouverture d\'une partie sur un profil neuf', '02a-tutoriel.png');
    }
    await L.sleep(3000);
    const posts = await page.locator('article.post').count();
    started = posts > 0;
    add(steps, 'START', 'Démarrage : [data-menu="new"] puis [data-launch]', started ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', `article.post présents après démarrage : ${posts}`, await L.shot(page, path.join(out, '02-partie-demarree.png')));
  } catch (error) {
    add(steps, 'START', 'Démarrage : [data-menu="new"] puis [data-launch]', 'TEST NON EFFECTUÉ', `exception du script : ${String(error.message).split('\n')[0]}`, null);
  }

  if (started) {
    const textBefore = await L.bodyTextLength(page);
    const errBefore = log.pageErrors.length;
    for (let s = 1; s <= 30; s += 1) {
      await page.keyboard.press('Space');
      if (s % 3 === 0) await page.keyboard.press('KeyX');
      if (s % 4 === 0) await page.keyboard.press('Shift+ArrowDown');
      if (s % 5 === 0) await page.keyboard.press('KeyC');
      if (s % 7 === 0) await page.keyboard.press('KeyS');
      if (s === 15) await L.shot(page, path.join(out, '03-partie-15s.png'));
      await L.sleep(1000);
    }
    await L.shot(page, path.join(out, '04-partie-30s.png'));
    const textAfter = await L.bodyTextLength(page);
    const newErrors = log.pageErrors.length - errBefore;
    const status = newErrors > 0 ? 'TEST ÉCHOUÉ' : (textAfter !== textBefore ? 'TEST RÉUSSI' : 'TEST PARTIEL');
    add(steps, 'PLAY-30S', 'Partie de 30 s : Espace, X, Maj+Flèche bas, C, S', status, `erreurs JS pendant la partie=${newErrors} ; longueur du texte visible : ${textBefore} → ${textAfter}`, '04-partie-30s.png');

    await page.keyboard.press('Escape');
    await L.sleep(1000);
    const pauseOpen = await L.visible(page, '[data-pause-resume]');
    if (pauseOpen) await L.shot(page, path.join(out, '05-pause.png'));
    if (pauseOpen) await page.locator('[data-pause-resume]').first().click();
    await L.sleep(1000);
    const pauseStillOpen = await L.visible(page, '[data-pause-resume]');
    const pauseStatus = pauseOpen && !pauseStillOpen ? 'TEST RÉUSSI' : 'TEST PARTIEL';
    add(steps, 'PAUSE', 'Pause (Échap) puis reprise ([data-pause-resume])', pauseStatus, `pause ouverte=${pauseOpen} ; encore ouverte après reprise=${pauseStillOpen}`, pauseOpen ? '05-pause.png' : null);

    data.metrics.fps = await L.measureFps(page, 10);

    const runBefore = await page.evaluate(() => localStorage.getItem('doomscroll.v1.run') !== null);
    await page.reload({ waitUntil: 'load', timeout: 90000 });
    await L.sleep(4000);
    const runAfter = await page.evaluate(() => localStorage.getItem('doomscroll.v1.run') !== null);
    add(steps, 'PERSIST', 'Sauvegarde de partie présente après rechargement (doomscroll.v1.run)', runBefore && runAfter ? 'TEST RÉUSSI' : 'TEST PARTIEL', `clé avant rechargement=${runBefore} ; après=${runAfter}`, null);
    data.metrics.heapBytes = await L.heapBytes(page);
  }

  const html = await page.content();
  const match = html.match(/assets\/(index-[^"'\s<>]+\.js)/);
  const live = match ? match[1] : null;
  const localAssetsDir = 'C:\\Users\\Noah\\Documents\\Jeux\\doomscroll-dungeon\\dist\\assets';
  const localAsset = fs.existsSync(localAssetsDir)
    ? fs.readdirSync(localAssetsDir).filter((name) => /^index-.*\.js$/.test(name)).sort().pop()
    : null;
  add(steps, 'VERSION', 'Concordance version publique / build local (dist/)', live && live === localAsset ? 'TEST RÉUSSI' : 'TEST PARTIEL', `asset servi : ${live} ; asset du build local : ${localAsset}`, null);

  await viewportChecks(c, steps, data);
}

async function flowIncremental(c, steps, data) {
  const { page, out, log } = c;
  const welcomeVisible = await L.visible(page, 'text=Jouer au Plinko');
  if (welcomeVisible) {
    await L.shot(page, path.join(out, '01b-bienvenue.png'));
    await page.getByText('Jouer au Plinko').first().click();
    add(steps, 'ACCUEIL', 'Fenêtre de bienvenue du premier lancement fermée par « Jouer au Plinko »', 'TEST RÉUSSI', 'fenêtre visible sur un profil neuf ; bouton cliqué', '01b-bienvenue.png');
  }
  await page.evaluate(() => { location.hash = 'plinko'; });
  await L.sleep(2500);
  const dropVisible = await L.visible(page, '#plinko-drop');
  add(steps, 'START', 'Ouverture du Plinko (location.hash = plinko) et bouton #plinko-drop visible', dropVisible ? 'TEST RÉUSSI' : 'TEST ÉCHOUÉ', `bouton visible=${dropVisible}`, await L.shot(page, path.join(out, '02-plinko.png')));

  if (dropVisible) {
    const playsBefore = await page.locator('#plinko-plays').textContent().catch(() => null);
    const errBefore = log.pageErrors.length;
    for (let s = 1; s <= 30; s += 1) {
      if (s % 2 === 1) await page.locator('#plinko-drop').click({ timeout: 5000 }).catch(() => {});
      if (s === 15) await L.shot(page, path.join(out, '03-partie-15s.png'));
      await L.sleep(1000);
    }
    await L.shot(page, path.join(out, '04-partie-30s.png'));
    const playsAfter = await page.locator('#plinko-plays').textContent().catch(() => null);
    const newErrors = log.pageErrors.length - errBefore;
    const status = newErrors > 0 ? 'TEST ÉCHOUÉ' : (playsAfter !== playsBefore ? 'TEST RÉUSSI' : 'TEST PARTIEL');
    add(steps, 'PLAY-30S', 'Partie de 30 s : clic sur #plinko-drop toutes les 2 s', status, `compteur de parties #plinko-plays : ${playsBefore} → ${playsAfter} ; erreurs JS=${newErrors}`, '04-partie-30s.png');

    const clicker = (async () => {
      for (let i = 0; i < 5; i += 1) {
        await page.locator('#plinko-drop').click({ timeout: 3000 }).catch(() => {});
        await L.sleep(2000);
      }
    })();
    data.metrics.fps = await L.measureFps(page, 10);
    await clicker;
  }
  add(steps, 'PAUSE', 'Pause', 'TEST NON EFFECTUÉ', 'Aucun contrôle de pause n\'a été recherché ni testé dans ce parcours.', null);

  const readTokens = () => page.evaluate(() => {
    try {
      const save = JSON.parse(localStorage.getItem('neon_jackpot_save_v1'));
      return save ? save.tokens : null;
    } catch (error) {
      return `erreur : ${error.message}`;
    }
  });
  const tokensBefore = await readTokens();
  await page.reload({ waitUntil: 'load', timeout: 90000 });
  await L.sleep(4000);
  const tokensAfter = await readTokens();
  add(steps, 'PERSIST', 'Persistance de la progression après rechargement (neon_jackpot_save_v1.tokens)', tokensBefore !== null && tokensBefore === tokensAfter ? 'TEST RÉUSSI' : 'TEST PARTIEL', `jetons avant=${tokensBefore} ; après=${tokensAfter}`, null);
  data.metrics.heapBytes = await L.heapBytes(page);

  const localPath = path.join(GAMES.incremental.gitRoot, 'src', 'js', 'state.js');
  const liveState = await page.request.get(c.baseUrl + 'src/js/state.js');
  const liveHash = sha256Buffer(await liveState.body());
  const headHash = headBlobSha(GAMES.incremental.gitRoot, 'src/js/state.js');
  add(steps, 'VERSION', 'Concordance version publique / HEAD (src/js/state.js)', liveHash === headHash ? 'TEST RÉUSSI' : 'TEST PARTIEL', `SHA256 en ligne=${liveHash.slice(0, 16)}… ; SHA256 blob HEAD=${headHash.slice(0, 16)}… (fichier local : ${path.basename(localPath)})`, null);
  const liveBundle = await page.request.get(c.baseUrl + 'src/data/bundle.js');
  const bundleLive = sha256Buffer(await liveBundle.body());
  const bundleHead = headBlobSha(GAMES.incremental.gitRoot, 'src/data/bundle.js');
  add(steps, 'VERSION-2', 'Concordance version publique / HEAD (src/data/bundle.js)', bundleLive === bundleHead ? 'TEST RÉUSSI' : 'TEST PARTIEL', `SHA256 en ligne=${bundleLive.slice(0, 16)}… ; SHA256 blob HEAD=${bundleHead.slice(0, 16)}…`, null);

  await viewportChecks(c, steps, data);
}

async function flowAvant(c, steps, data) {
  const { page, out, log } = c;
  await checkVersion(c, steps, 'VERSION', 'Concordance version publique / HEAD (index.html)');
  const textStart = await L.bodyTextLength(page);
  const startText = await L.clickByText(page, /commencer|démarrer|reprendre|continuer|lancer/i, 15000);
  await L.sleep(3000);
  const textAfterStart = await L.bodyTextLength(page);
  const buttons = await L.visibleButtonTexts(page);
  let startStatus = 'TEST NON EFFECTUÉ';
  if (startText) startStatus = textAfterStart !== textStart ? 'TEST RÉUSSI' : 'TEST PARTIEL';
  add(steps, 'START', 'Démarrage : bouton identifié par son libellé', startStatus, startText ? `bouton cliqué : « ${startText} » ; texte visible ${textStart} → ${textAfterStart}` : `aucun bouton de démarrage trouvé ; boutons visibles : ${buttons.join(' | ')}`, await L.shot(page, path.join(out, '02-apres-demarrage.png')));

  const errBefore = log.pageErrors.length;
  const clicked = {};
  const t0 = Date.now();
  let shot15 = false;
  while (Date.now() - t0 < 30000) {
    const label = await L.clickByText(page, /suivant|continuer|poursuivre|suite|valider|ouvrir|commencer|passer|lire|fermer|étape/i, 1500);
    if (label) clicked[label] = (clicked[label] || 0) + 1;
    if (!shot15 && Date.now() - t0 >= 15000) {
      await L.shot(page, path.join(out, '03-jeu-15s.png'));
      shot15 = true;
    }
    await L.sleep(1200);
  }
  await L.shot(page, path.join(out, '04-jeu-30s.png'));
  const totalClicks = Object.values(clicked).reduce((a, b) => a + b, 0);
  const newErrors = log.pageErrors.length - errBefore;
  const textEnd = await L.bodyTextLength(page);
  const status = newErrors > 0 ? 'TEST ÉCHOUÉ' : (totalClicks > 0 && textEnd !== textAfterStart ? 'TEST RÉUSSI' : 'TEST PARTIEL');
  add(steps, 'PLAY-30S', 'Parcours de 30 s par boutons de progression (heuristique par libellé)', status, `clics=${totalClicks} ; libellés : ${JSON.stringify(clicked)} ; erreurs JS=${newErrors} ; texte visible ${textAfterStart} → ${textEnd}`, '04-jeu-30s.png');

  const menuLike = (await L.visibleButtonTexts(page)).filter((t) => /menu|pause|options|réglages|paramètres/i.test(t));
  add(steps, 'PAUSE', 'Menu ou pause', 'TEST NON EFFECTUÉ', menuLike.length ? `boutons de menu visibles, non testés : ${menuLike.join(' | ')}` : 'aucun bouton de pause ou de menu visible dans le parcours testé', null);

  data.metrics.fps = await L.measureFps(page, 10);

  const keyBefore = await page.evaluate(() => localStorage.getItem('avant-le-silence.save.v1') !== null);
  await page.reload({ waitUntil: 'load', timeout: 90000 });
  await L.sleep(4000);
  const keyAfter = await page.evaluate(() => localStorage.getItem('avant-le-silence.save.v1') !== null);
  add(steps, 'PERSIST', 'Sauvegarde présente après rechargement (avant-le-silence.save.v1)', keyBefore && keyAfter ? 'TEST RÉUSSI' : 'TEST PARTIEL', `clé avant=${keyBefore} ; après=${keyAfter}`, null);
  data.metrics.heapBytes = await L.heapBytes(page);

  await viewportChecks(c, steps, data);
}

async function flowQuand(c, steps, data) {
  const { page, out, log } = c;
  let started = false;
  try {
    await page.locator('#btn-new-game').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#btn-new-game').click();
    await L.sleep(1500);
    const slot = page.locator('[data-slot="0"][data-action="new"]').first();
    await slot.waitFor({ state: 'visible', timeout: 10000 });
    await slot.click();
    await L.sleep(3000);
    started = true;
    add(steps, 'START', 'Démarrage : #btn-new-game puis [data-slot="0"][data-action="new"]', 'TEST RÉUSSI', 'carnet 1 ouvert via « Commencer ici »', await L.shot(page, path.join(out, '02-partie-demarree.png')));
  } catch (error) {
    add(steps, 'START', 'Démarrage : #btn-new-game puis [data-slot="0"][data-action="new"]', 'TEST NON EFFECTUÉ', `exception du script : ${String(error.message).split('\n')[0]}`, null);
  }

  if (started) {
    const textBefore = await L.bodyTextLength(page);
    const errBefore = log.pageErrors.length;
    let menuOpened = false;
    let menuClosed = false;
    for (let s = 1; s <= 30; s += 1) {
      await page.keyboard.press('Space');
      if (s % 4 === 0 && (await L.visible(page, '#btn-next'))) await page.locator('#btn-next').click().catch(() => {});
      if (s === 15) await L.shot(page, path.join(out, '03-jeu-15s.png'));
      if (s === 20) {
        await page.keyboard.press('Escape');
        await L.sleep(800);
        menuOpened = await page.evaluate(() => Array.from(document.querySelectorAll('dialog')).some((d) => d.open));
        if (menuOpened) await L.shot(page, path.join(out, '04-menu.png'));
        await page.keyboard.press('Escape');
        await L.sleep(800);
        menuClosed = !(await page.evaluate(() => Array.from(document.querySelectorAll('dialog')).some((d) => d.open)));
      }
      await L.sleep(1000);
    }
    await L.shot(page, path.join(out, '05-jeu-30s.png'));
    const textAfter = await L.bodyTextLength(page);
    const newErrors = log.pageErrors.length - errBefore;
    const status = newErrors > 0 ? 'TEST ÉCHOUÉ' : (textAfter !== textBefore ? 'TEST RÉUSSI' : 'TEST PARTIEL');
    add(steps, 'PLAY-30S', 'Partie de 30 s : Espace, bouton #btn-next, menu à 20 s', status, `erreurs JS=${newErrors} ; texte visible ${textBefore} → ${textAfter}`, '05-jeu-30s.png');
    add(steps, 'PAUSE', 'Menu (Échap) : ouverture puis fermeture', menuOpened && menuClosed ? 'TEST RÉUSSI' : 'TEST PARTIEL', `menu ouvert=${menuOpened} ; fermé=${menuClosed}`, menuOpened ? '04-menu.png' : null);
    data.metrics.fps = await L.measureFps(page, 10);

    const keysBefore = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('qlnse.save.v1.')));
    await page.reload({ waitUntil: 'load', timeout: 90000 });
    await L.sleep(4000);
    const continueEnabled = !(await page.locator('#btn-continue').isDisabled().catch(() => true));
    add(steps, 'PERSIST', 'Sauvegarde présente après rechargement (qlnse.save.v1.*) et bouton #btn-continue actif', keysBefore.length > 0 && continueEnabled ? 'TEST RÉUSSI' : 'TEST PARTIEL', `clés avant rechargement=${JSON.stringify(keysBefore)} ; #btn-continue actif=${continueEnabled}`, null);
    data.metrics.heapBytes = await L.heapBytes(page);
  }

  await checkVersion(c, steps, 'VERSION', 'Concordance version publique / HEAD (index.html)');
  await viewportChecks(c, steps, data);
}

async function flowLying(c, steps, data) {
  const { page, out, log } = c;
  let started = false;
  try {
    const startButton = page.locator('#home-start');
    await startButton.waitFor({ state: 'visible', timeout: 15000 });
    const label = ((await startButton.textContent()) || '').replace(/\s+/g, ' ').trim();
    await startButton.click();
    await L.sleep(2500);
    const confirm = await L.clickByText(page, /^NOUVELLE SESSION$/i, 2000);
    await L.sleep(3000);
    started = true;
    add(steps, 'START', 'Démarrage : bouton #home-start', 'TEST RÉUSSI', `bouton cliqué : « ${label} » ; confirmation cliquée : ${confirm ? 'oui' : 'non'}`, await L.shot(page, path.join(out, '02-debut.png')));
  } catch (error) {
    add(steps, 'START', 'Démarrage : « COMMENCER UNE NOUVELLE SESSION »', 'TEST NON EFFECTUÉ', `exception du script : ${String(error.message).split('\n')[0]}`, null);
  }

  if (started) {
    let actions = 0;
    for (let i = 0; i < 80; i += 1) {
      const canvas = await page.locator('#game-container canvas').count();
      const dialogue = await L.visible(page, '.dialogue-panel');
      if (canvas > 0 && !dialogue) break;
      const clicked = await L.clickByText(page, /CONTINUER/, 300);
      if (!clicked) await page.keyboard.press('Enter');
      actions += 1;
      await L.sleep(800);
    }
    const canvasFinal = await page.locator('#game-container canvas').count();
    add(steps, 'PROLOGUE', 'Passer le prologue (CONTINUER ou Entrée)', canvasFinal > 0 ? 'TEST RÉUSSI' : 'TEST PARTIEL', `actions=${actions} ; canvas Phaser présent=${canvasFinal > 0}`, null);

    const errBefore = log.pageErrors.length;
    const textBefore = await L.bodyTextLength(page);
    let overlayOpen = false;
    for (let s = 1; s <= 30; s += 1) {
      const key = ['KeyZ', 'KeyD', 'KeyS', 'KeyQ'][s % 4];
      await page.keyboard.down(key);
      await L.sleep(300);
      await page.keyboard.up(key);
      if (s % 2 === 0) await page.keyboard.press('Enter');
      if (s === 15) await L.shot(page, path.join(out, '03-jeu-15s.png'));
      if (s === 20) {
        await page.keyboard.press('Escape');
        await L.sleep(800);
        overlayOpen = await page.evaluate(() => Array.from(document.querySelectorAll('.overlay-layer')).some((e) => !e.hidden && e.getBoundingClientRect().height > 0));
        if (overlayOpen) await L.shot(page, path.join(out, '04-pause.png'));
        await page.keyboard.press('Escape');
        await L.sleep(800);
      }
      await L.sleep(700);
    }
    await L.shot(page, path.join(out, '05-jeu-30s.png'));
    const textAfter = await L.bodyTextLength(page);
    const newErrors = log.pageErrors.length - errBefore;
    const status = newErrors > 0 ? 'TEST ÉCHOUÉ' : (textAfter !== textBefore ? 'TEST RÉUSSI' : 'TEST PARTIEL');
    add(steps, 'PLAY-30S', 'Partie de 30 s : touches Z, Q, S, D (zqsd par défaut) et Entrée', status, `erreurs JS=${newErrors} ; texte visible ${textBefore} → ${textAfter}`, '05-jeu-30s.png');
    add(steps, 'PAUSE', 'Pause (Échap) : superposition visible', overlayOpen ? 'TEST RÉUSSI' : 'TEST PARTIEL', `superposition .overlay-layer visible=${overlayOpen}`, overlayOpen ? '04-pause.png' : null);
    data.metrics.fps = await L.measureFps(page, 10);

    const keyBefore = await page.evaluate(() => localStorage.getItem('the-lying-game.save.v1') !== null);
    await page.reload({ waitUntil: 'load', timeout: 90000 });
    await L.sleep(4000);
    const keyAfter = await page.evaluate(() => localStorage.getItem('the-lying-game.save.v1') !== null);
    add(steps, 'PERSIST', 'Sauvegarde présente après rechargement (the-lying-game.save.v1)', keyBefore && keyAfter ? 'TEST RÉUSSI' : 'TEST PARTIEL', `clé avant=${keyBefore} ; après=${keyAfter}`, null);
    data.metrics.heapBytes = await L.heapBytes(page);
  }

  await checkVersion(c, steps, 'VERSION', 'Concordance version publique / HEAD (docs/index.html)');
  await viewportChecks(c, steps, data);
}

const FLOWS = {
  'doomscroll-dungeon': flowDoomscroll,
  incremental: flowIncremental,
  'avant-le-silence': flowAvant,
  'quand-les-notes-seffacent': flowQuand,
  'the-lying-game': flowLying,
};

async function run(slug, overrideUrl) {
  const cfg = GAMES[slug];
  if (!cfg) throw new Error(`Jeu inconnu : ${slug}`);
  const out = path.join(AUDIT, 'screenshots', slug);
  fs.mkdirSync(path.join(out, 'logs'), { recursive: true });
  const steps = [];
  const data = { slug, startedAt: new Date().toISOString(), steps, metrics: {}, viewports: [], logs: null };
  let server = null;
  let browser = null;
  try {
    let baseUrl = cfg.url;
    if (cfg.localRoot && !overrideUrl) {
      server = await L.startStatic(path.resolve(cfg.localRoot), cfg.port);
      baseUrl = `http://127.0.0.1:${cfg.port}/`;
    }
    if (overrideUrl) baseUrl = overrideUrl;
    data.baseUrl = baseUrl;
    browser = await L.openBrowser();
    const { context, page } = await L.newPage(browser, { width: 1920, height: 1080 });
    const log = L.newLog();
    L.attach(page, log);
    data.logs = log;
    const c = { browser, page, baseUrl, out, log, cfg };
    const before = L.counts(log);
    try {
      await page.goto(baseUrl, { waitUntil: 'load', timeout: 90000 });
      await L.sleep(5000);
      add(steps, 'LOAD', 'Chargement initial (1920x1080, 5 s de stabilisation)', loadStatus(delta(before, L.counts(log))), `erreurs JS=${log.pageErrors.length} ; réponses HTTP>=400=${log.httpErrors.length} ; requêtes en échec=${log.failedRequests.length} ; console error/warning=${log.console.length}`, await L.shot(page, path.join(out, '01-accueil.png')));
      data.metrics.timings = await L.navTimings(page);
    } catch (error) {
      add(steps, 'LOAD', 'Chargement initial', 'TEST ÉCHOUÉ', `navigation impossible : ${String(error.message).split('\n')[0]}`, null);
    }
    try {
      await FLOWS[slug](c, steps, data);
    } catch (error) {
      add(steps, 'FLOW-ERROR', 'Exception non interceptée dans le parcours', 'TEST NON EFFECTUÉ', String(error.message).split('\n')[0], null);
    }
    await context.close();
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) await new Promise((resolve) => server.close(resolve));
    data.finishedAt = new Date().toISOString();
    data.sizeByType = data.logs ? sizeByType(data.logs.resources) : null;
    L.writeJson(path.join(out, 'logs', 'result.json'), data);
    for (const s of steps) console.log(`${s.id} | ${s.status} | ${s.detail}`);
  }
}

module.exports = { run, GAMES };

if (require.main === module) {
  run(process.argv[2], process.argv[3])
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
