'use strict';
// Diagnostic (non concluant par lui-même) : pourquoi la sauvegarde injectée de T-INCR-02 n'est pas chargée.
const path = require('path');
const L = require('./lib');

(async () => {
  const root = path.resolve('C:\\Users\\Noah\\Documents\\Jeux\\incremental');
  const server = await L.startStatic(root, 8104);
  const browser = await L.openBrowser();
  try {
    const url = 'http://127.0.0.1:8104/';
    const { context, page: first } = await L.newPage(browser, { width: 1366, height: 768 });
    const log = L.newLog();
    L.attach(first, log);
    await first.goto(url, { waitUntil: 'load' });
    await L.sleep(2500);
    const payload = JSON.stringify({ tokens: 1000, journal: [{ icon: '<img src=x onerror="window.__xss=1">', text: 'test-diag', value: '', at: 1700000000000 }] });
    await first.evaluate((v) => localStorage.setItem('neon_jackpot_save_v1', v), payload);
    const storedBefore = await first.evaluate(() => (localStorage.getItem('neon_jackpot_save_v1') || '').slice(0, 60));
    console.log('avant fermeture de la page 1 :', storedBefore);
    await first.close({ runBeforeUnload: false });
    const page = await context.newPage();
    L.attach(page, log);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const probe = (label) => page.evaluate((l) => ({
      label: l,
      raw: (localStorage.getItem('neon_jackpot_save_v1') || '').slice(0, 60),
      appDefined: typeof window.App !== 'undefined',
      tokens: window.App && App.state && App.state.data ? App.state.data.tokens : null,
      journalLength: window.App && App.state && App.state.data ? App.state.data.journal.length : null,
    }), label).then((r) => console.log(JSON.stringify(r)));
    await probe('domcontentloaded');
    await L.sleep(500);
    await probe('t+0,5 s');
    await L.sleep(2500);
    await probe('t+3 s');
    console.log('erreurs JS :', JSON.stringify(log.pageErrors));
    console.log('avertissements console :', JSON.stringify(log.console.slice(0, 8)));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
