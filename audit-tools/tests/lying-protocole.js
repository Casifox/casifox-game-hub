'use strict';
// Protocole 8.2 adapté (The Lying Game, local, build docs/) : étapes 1 à 7.
const C = require('./lying-common');

async function main() {
  const sink = C.createSink();
  const browser = await C.launch();
  const result = {
    test: 'Protocole 8.2 adapté — The Lying Game (local, build docs/)',
    env: C.envInfo(browser),
    url: C.BASE_URL,
    viewport: { width: 1366, height: 768 },
    checks: {},
    pause: {},
    restart: {},
    persistence: {},
    metrics: {},
  };
  const { context, page } = await C.openPage(browser, sink, { viewport: { width: 1366, height: 768 } });
  try {
    const gotoStart = Date.now();
    await page.goto(C.BASE_URL, { waitUntil: 'load', timeout: 30000 });
    result.metrics.gotoWallClockMs = Date.now() - gotoStart;
    await C.sleep(5000);
    const title = await C.uiState(page);
    result.checks.title = title;
    result.metrics.title = { resources: await C.resourceMetrics(page), memory: await C.memory(page) };
    await C.shot(page, sink, '01-titre.png');
    C.note(sink, 'E1-titre', {
      resume: `écran titre=${title.home}, bouton « ${title.homeStartLabel} », continuer désactivé=${title.homeContinueDisabled}`,
    });

    const start = await C.startNewGame(page);
    result.checks.newGameConfirmationNeeded = start.confirmed;
    const clicks = await C.passPrologue(page);
    result.checks.prologueClicks = clicks;
    await C.waitForState(page, (s) => s.modal || s.dialogue || (s.gameShell && s.canvas), 30000, 'premier écran après le prologue');
    await C.shot(page, sink, '02-debut.png');
    const started = await C.advanceToGameplay(page, 'démarrage');
    result.checks.gameStart = {
      ready: started.ready,
      enterPresses: started.enterPresses,
      modalClicks: started.modalClicks,
      modalsSeen: started.modalsSeen,
      dialogueLines: started.dialogueLines,
    };
    if (!started.ready) throw new Error('Partie non démarrée (étape 2)');
    result.checks.rendererAtStart = await page.evaluate(C.RENDERER_FN);
    C.note(sink, 'E2-debut', {
      resume: `prologue=${clicks} clics, partie prête=${started.ready}, ${started.dialogueLines.length} ligne(s) de dialogue`,
    });

    const hash0 = await C.shot(page, sink, '03-jeu-0s.png');
    result.metrics.memoryGame0s = await C.memory(page);
    const playP = C.playFor(page, 30000);
    const branch15 = (async () => {
      await C.sleep(15000);
      const hash15 = await C.shot(page, sink, '04-jeu-15s.png');
      const stamps = await C.sampleFps(page, 10000);
      return { hash15, fps: C.fpsStats(stamps) };
    })();
    const branch30 = (async () => {
      await C.sleep(30000);
      return C.shot(page, sink, '05-jeu-30s.png');
    })();
    const [play, b15, hash30] = await Promise.all([playP, branch15, branch30]);
    result.checks.play = play;
    result.checks.screenshotHashes = { t0: hash0, t15: b15.hash15, t30: hash30 };
    result.metrics.fps10s = b15.fps;
    result.metrics.memoryGame30s = await C.memory(page);
    result.checks.rendererAfterPlay = await page.evaluate(C.RENDERER_FN);
    C.note(sink, 'E3-jeu', {
      resume: `30 s : ${play.holds} déplacements, ${play.enterPresses} Entrée, superpositions=${JSON.stringify(play.overlays)}`,
    });

    const pauseOpen = await C.openPause(page);
    result.pause.open = { ok: pauseOpen.pause, items: pauseOpen.pauseItems };
    await C.shot(page, sink, '03b-pause-ouverte.png');
    await page.keyboard.press('Escape');
    const pauseClosed = await C.waitForState(page, (s) => !s.pause, 5000, 'pause fermée (Échap)');
    result.pause.closed = { ok: !pauseClosed.pause, gameShell: pauseClosed.gameShell };
    C.note(sink, 'E4-pause', { resume: `ouverte=${pauseOpen.pause}, fermée=${!pauseClosed.pause}` });

    const errorsBeforeRestart = sink.pageerrors.length;
    await C.openPause(page);
    await C.clickPauseItem(page, 'REVENIR AU MENU PRINCIPAL');
    const home = await C.waitForState(page, (s) => s.home && !s.gameShell, 15000, 'écran titre après pause');
    result.restart.titleAfterMenu = {
      homeStartLabel: home.homeStartLabel,
      continueDisabled: home.homeContinueDisabled,
      continueHint: home.homeContinueHint,
    };
    const restart = await C.startNewGame(page);
    result.restart.confirmationNeeded = restart.confirmed;
    await C.passPrologue(page);
    const restarted = await C.advanceToGameplay(page, 'nouvelle partie après menu');
    result.restart.gameReady = restarted.ready;
    result.restart.dialogueLines = restarted.dialogueLines;
    result.restart.newPageErrors = sink.pageerrors.slice(errorsBeforeRestart);
    await C.shot(page, sink, '07-nouvelle-partie-apres-menu.png');
    C.note(sink, 'E5-redemarrage', {
      resume: `titre atteint=${home.home}, nouvelle partie prête=${restarted.ready}, erreurs=${result.restart.newPageErrors.length}`,
    });

    const errorsBeforeRoom = sink.pageerrors.length;
    await C.openPause(page);
    await C.clickPauseItem(page, 'RECOMMENCER LA SALLE');
    const room = await C.advanceToGameplay(page, 'recommencer la salle');
    await C.sleep(3000);
    result.restart.roomRestart = {
      ready: room.ready,
      enterPresses: room.enterPresses,
      stateAfter3s: await C.uiState(page),
      newPageErrors: sink.pageerrors.slice(errorsBeforeRoom),
    };
    C.note(sink, 'E5b-recommencer-salle', {
      resume: `prête=${room.ready}, erreurs=${result.restart.roomRestart.newPageErrors.length}`,
    });

    await C.sleep(1500);
    result.persistence.storageBeforeReload = await C.storageSummary(page);
    const errorsBeforeReload = sink.pageerrors.length;
    await page.reload({ waitUntil: 'load', timeout: 30000 });
    await C.sleep(5000);
    const reloaded = await C.uiState(page);
    result.persistence.stateAfterReload = {
      home: reloaded.home,
      homeStartLabel: reloaded.homeStartLabel,
      continueDisabled: reloaded.homeContinueDisabled,
      continueHint: reloaded.homeContinueHint,
      progress: reloaded.homeProgress,
    };
    result.persistence.storageAfterReload = await C.storageSummary(page);
    result.persistence.newPageErrorsAfterReload = sink.pageerrors.slice(errorsBeforeReload);
    await C.shot(page, sink, '06-titre-apres-rechargement.png');
    if (!reloaded.homeContinueDisabled) {
      const errorsBeforeContinue = sink.pageerrors.length;
      await page.locator('#home-continue').click({ timeout: 10000 });
      const resumed = await C.advanceToGameplay(page, 'Continuer après rechargement');
      result.persistence.continueResumed = {
        ready: resumed.ready,
        modalsSeen: resumed.modalsSeen,
        dialogueLines: resumed.dialogueLines,
        newPageErrors: sink.pageerrors.slice(errorsBeforeContinue),
      };
    }
    C.note(sink, 'E6-persistance', {
      resume: `« Continuer » actif=${!reloaded.homeContinueDisabled}, clé de sauvegarde=${result.persistence.storageAfterReload.save !== null}`,
    });

    result.metrics.resourcesSession = await C.resourceMetrics(page);
    result.metrics.memoryEnd = await C.memory(page);
  } catch (error) {
    result.error = String(error && error.stack ? error.stack : error);
    console.log(`ERREUR : ${result.error.split('\n').slice(0, 3).join(' | ')}`);
  } finally {
    result.requestCount = sink.requestCount;
    result.console = sink.console;
    result.pageerrors = sink.pageerrors;
    result.requestfailed = sink.requestfailed;
    result.httpErrors = sink.httpErrors;
    result.dialogs = sink.dialogs;
    result.crashes = sink.crashes;
    result.screenshots = sink.screenshots;
    result.steps = sink.steps;
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    console.log(`Log : ${C.writeLog('protocole.json', result)}`);
    console.log(
      `pageerror=${sink.pageerrors.length} ; console error/warning=${sink.console.length} ; requêtes en échec=${sink.requestfailed.length} ; HTTP>=400=${sink.httpErrors.length} ; requêtes=${sink.requestCount}`,
    );
  }
}

main();
