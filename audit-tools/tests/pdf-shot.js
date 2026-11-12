'use strict';
// Capture la première page du PDF pour contrôle visuel.
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const pdf = 'C:\\Users\\Noah\\Documents\\CASIFOX-MISES-A-JOUR.pdf';
  const out = path.resolve(__dirname, '..', '..', 'audit', 'screenshots', 'pdf-page1.png');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1240, height: 1754 } });
    await page.goto('file:///' + pdf.replace(/\\/g, '/') + '#page=1', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: out });
    console.log('capture : ' + out);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
