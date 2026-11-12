'use strict';
// Étape 8 du protocole : débordement horizontal et captures par viewport (titre et jeu).
const C = require('./lying-common');

const VIEWPORTS = [
  { name: '1920x1080', viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false },
  { name: '1366x768', viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false },
  { name: '768x1024', viewport: { width: 768, height: 1024 }, isMobile: false, hasTouch: false },
  { name: '390x844-mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: '844x390-paysage-mobile', viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true },
];

const LAYOUT_FN = () => {
  const root = document.documentElement;
  const vw = window.innerWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right > vw + 1 || rect.left < -1) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: typeof el.className === 'string' ? el.className.slice(0, 60) : null,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      });
      if (offenders.length >= 10) break;
    }
  }
  const container = document.getElementById('game-container');
  const canvas = document.querySelector('#game-container canvas');
  const canvasRect = canvas ? canvas.getBoundingClientRect() : null;
  return {
    innerWidth: vw,
    innerHeight: window.innerHeight,
    clientWidth: root.clientWidth,
    scrollWidth: root.scrollWidth,
    horizontalOverflowPx: Math.max(0, root.scrollWidth - root.clientWidth),
    dataView: document.getElementById('app') ? document.getElementById('app').getAttribute('data-view') : null,
    offenders,
    containerOverflow: container ? getComputedStyle(container).overflow : null,
    canvas: canvasRect
      ? {
          left: Math.round(canvasRect.left),
          right: Math.round(canvasRect.right),
          width: Math.round(canvasRect.width),
          height: Math.round(canvasRect.height),
          transform: canvas.style.transform || null,
        }
      : null,
    portraitGameTop: root.style.getPropertyValue('--portrait-game-top') || null,
  };
};

async function main() {
  const browser = await C.launch();
  const env = C.envInfo(browser);
  const results = [];
  try {
    for (const vp of VIEWPORTS) {
      const sink = C.createSink();
      const { context, page } = await C.openPage(browser, sink, {
        viewport: vp.viewport,
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
      });
      const entry = { name: vp.name, viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch };
      try {
        await page.goto(C.BASE_URL, { waitUntil: 'load', timeout: 30000 });
        await C.sleep(5000);
        entry.titre = await page.evaluate(LAYOUT_FN);
        await C.shot(page, sink, `viewport-${vp.name}-titre.png`);
        await C.startNewGame(page);
        await C.passPrologue(page);
        const ready = await C.advanceToGameplay(page, `viewport ${vp.name}`);
        entry.jeuPret = ready.ready;
        if (ready.ready) {
          await C.sleep(2000);
          entry.jeu = await page.evaluate(LAYOUT_FN);
          entry.renderer = await page.evaluate(C.RENDERER_FN);
          await C.shot(page, sink, `viewport-${vp.name}-jeu.png`);
        }
      } catch (error) {
        entry.erreur = String(error && error.message ? error.message : error);
      } finally {
        entry.pageerrors = sink.pageerrors;
        entry.console = sink.console;
        entry.requestfailed = sink.requestfailed;
        entry.httpErrors = sink.httpErrors;
        entry.screenshots = sink.screenshots;
        await context.close().catch(() => {});
      }
      results.push(entry);
      console.log(
        `[${vp.name}] débordement titre=${entry.titre ? entry.titre.horizontalOverflowPx : 'n/a'} px ; jeu=${entry.jeu ? entry.jeu.horizontalOverflowPx : 'n/a'} px ; pageerrors=${entry.pageerrors.length}${entry.erreur ? ' ; erreur=' + entry.erreur.split('\n')[0] : ''}`,
      );
    }
  } finally {
    await browser.close().catch(() => {});
    console.log(`Log : ${C.writeLog('viewports.json', { test: 'Étape 8 — viewports', env, results })}`);
  }
}

main();
