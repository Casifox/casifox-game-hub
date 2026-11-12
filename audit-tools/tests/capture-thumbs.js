'use strict';
// Regenere les vignettes 1920x1080 du hub depuis les versions locales.
// Usage : node tests/capture-thumbs.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const L = require('./lib');

const OUT = 'C:\\Users\\Noah\\Documents\\CASIFOX-GAME-HUB\\assets\\images';
const GAMES = [
  { file: 'avant-le-silence.png', root: 'C:\\Users\\Noah\\Documents\\Jeux\\AVANT LE SILENCE', port: 8201 },
  { file: 'doomscroll-dungeon.png', root: 'C:\\Users\\Noah\\Documents\\Jeux\\doomscroll-dungeon\\dist', port: 8202 },
  { file: 'neon-jackpot.png', root: 'C:\\Users\\Noah\\Documents\\Jeux\\incremental', port: 8203 },
  { file: 'quand-les-notes-seffacent.png', root: "C:\\Users\\Noah\\Documents\\Jeux\\QUAND LES NOTES S'EFFACENT", port: 8204 },
  { file: 'the-lying-game.png', root: 'C:\\Users\\Noah\\Documents\\Jeux\\the-lying-game\\docs', port: 8205 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const g of GAMES) {
    if (!fs.existsSync(path.join(g.root, 'index.html'))) {
      console.log(`[SKIP] ${g.file} : ${g.root}\\index.html absent`);
      continue;
    }
    const server = await L.startStatic(g.root, g.port);
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'fr-FR' });
    const page = await ctx.newPage();
    try {
      await page.goto(`http://127.0.0.1:${g.port}/`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(3000);
      for (const label of ['Voir le guide', "C'est parti"]) {
        const b = page.getByRole('button', { name: label });
        if (await b.count()) { await b.first().click().catch(() => {}); await page.waitForTimeout(500); }
      }
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT, g.file) });
      if (g.file === 'doomscroll-dungeon.png') {
        fs.copyFileSync(path.join(OUT, g.file), path.join(OUT, 'hero.png'));
        console.log('[OK] hero.png (depuis Doomscroll)');
      }
      console.log(`[OK] ${g.file}`);
    } catch (e) {
      console.log(`[ECHEC] ${g.file} : ${e.message.split('\n')[0]}`);
    }
    await ctx.close();
    await server.close();
  }
  await browser.close();
})();
