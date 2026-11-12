'use strict';
// Génère le PDF de synthèse à partir de audit/report-pdf.html, avec Chromium (déjà installé).
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const input = path.resolve(__dirname, '..', '..', 'audit', 'report-pdf.html');
  const output = 'C:\\Users\\Noah\\Documents\\CASIFOX-MISES-A-JOUR.pdf';
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('file:///' + input.replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', right: '14mm', bottom: '18mm', left: '14mm' },
    });
    console.log('PDF écrit : ' + output);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
