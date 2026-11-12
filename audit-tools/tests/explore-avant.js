// Exploration (non officielle) : relève les libellés réels des écrans d'AVANT LE SILENCE pour écrire les scripts de test.
// Lecture seule sur le jeu. Sortie : audit\screenshots\avant-le-silence\logs\exploration-avant.json
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://127.0.0.1:8101/';
const OUT = 'C:\\Users\\Noah\\Documents\\CASIFOX-GAME-HUB\\audit\\screenshots\\avant-le-silence\\logs\\exploration-avant.json';

async function visibleButtons(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('button'))
      .filter((b) => {
        const r = b.getBoundingClientRect();
        const s = getComputedStyle(b);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
      })
      .map((b) => ({
        text: (b.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 90),
        aria: b.getAttribute('aria-label'),
        cls: b.className,
        disabled: b.disabled,
        itemKey: b.dataset.itemKey || null
      }))
  );
}

async function snap(page, label, log) {
  log.push({ label, hash: await page.evaluate(() => location.hash), buttons: await visibleButtons(page) });
}

(async () => {
  const log = [];
  const browser = await chromium.launch({ headless: true });
  log.push({ browserVersion: browser.version() });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  page.on('console', (m) => log.push({ console: m.type(), text: m.text() }));
  page.on('pageerror', (e) => log.push({ pageerror: String(e.message || e) }));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  await snap(page, 'accueil', log);

  await page.getByRole('button', { name: 'Commencer le parcours' }).first().click();
  await page.waitForTimeout(800);
  await snap(page, 'avertissement', log);

  await page.getByRole('button', { name: "J'ai compris, continuer" }).click();
  await page.waitForTimeout(800);
  await snap(page, 'apres-avertissement', log);

  const prologueStart = page.getByRole('button', { name: 'Commencer le parcours' }).first();
  if (await prologueStart.count()) {
    await prologueStart.click();
    await page.waitForTimeout(800);
  }
  await snap(page, 'apres-prologue', log);

  await fs.promises.writeFile(OUT, JSON.stringify(log, null, 2), 'utf8');
  await page.screenshot({ path: 'C:\\Users\\Noah\\Documents\\CASIFOX-GAME-HUB\\audit\\screenshots\\avant-le-silence\\logs\\exploration-apres-prologue.png' });
  await browser.close();
  console.log('OK', OUT);
})().catch(async (e) => {
  console.error('ERREUR', e && e.message);
  process.exitCode = 1;
});
