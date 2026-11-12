'use strict';
const path = require('path');
const L = require('./lib');

(async () => {
  const hub = path.resolve(__dirname, '..', '..');
  const server = await L.startStatic(hub, 8201);
  const browser = await L.openBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page.goto('http://127.0.0.1:8201/', { waitUntil: 'load' });
    await L.sleep(1200);
    const data = await page.evaluate(() => {
      const width = window.innerWidth;
      const items = Array.from(document.querySelectorAll('body *')).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || '').slice(0, 60),
          id: el.id || '',
          right: Math.round(rect.right),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          over: Math.round(rect.right - width),
        };
      });
      return {
        innerWidth: width,
        scrollWidth: document.documentElement.scrollWidth,
        offenders: items.filter((item) => item.over > 1).sort((a, b) => b.over - a.over).slice(0, 20),
      };
    });
    console.log(JSON.stringify(data, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
