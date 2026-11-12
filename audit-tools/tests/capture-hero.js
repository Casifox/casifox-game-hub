'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const L = require('./lib');

const ROOT = 'C:\\Users\\Noah\\Documents\\Jeux\\doomscroll-dungeon\\dist';
const OUT = 'C:\\Users\\Noah\\Documents\\CASIFOX-GAME-HUB\\assets\\images\\hero.png';
const PORT = 8140;

(async () => {
  const server = await L.startStatic(ROOT, PORT);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, locale: 'fr-FR' });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Nouvelle descente' }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Lancer la descente/ }).click();
  await page.waitForTimeout(2500);
  const skip = page.getByRole('button', { name: /PASSER LE TUTORIEL/i });
  if (await skip.count()) { await skip.first().click().catch(() => {}); }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: OUT });
  console.log('hero gameplay ok');
  await browser.close();
  await server.close();
})();
