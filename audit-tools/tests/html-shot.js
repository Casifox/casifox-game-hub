'use strict';
// Capture le rendu A4 de la source HTML du PDF (contrôle de mise en page).
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const input = path.resolve(__dirname, '..', '..', 'audit', 'report-pdf.html');
  const outDir = path.resolve(__dirname, '..', '..', 'audit', 'screenshots');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.goto('file:///' + input.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'pdf-source-top.png') });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, total - 1123));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'pdf-source-bottom.png') });
    console.log('captures écrites ; hauteur totale = ' + total + ' px');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
