'use strict';
// Bibliothèque partagée des tests d'audit (phase 3). Dépendance : Playwright uniquement.
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

const VIEWPORTS = [
  { name: '1920', width: 1920, height: 1080 },
  { name: '1366', width: 1366, height: 768 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844, isMobile: true, hasTouch: true },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function startStatic(root, port) {
  const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    } catch (_) {
      res.writeHead(400);
      return res.end('Bad Request');
    }
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const filePath = path.join(root, urlPath);
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    fs.stat(filePath, (error, stat) => {
      if (error || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found');
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(filePath).pipe(res);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

function newLog() {
  return { console: [], pageErrors: [], failedRequests: [], httpErrors: [], resources: [] };
}

function attach(page, log) {
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      log.console.push({ type: message.type(), text: message.text().slice(0, 400) });
    }
  });
  page.on('pageerror', (error) => {
    log.pageErrors.push({ message: String(error.message).slice(0, 400) });
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    log.failedRequests.push({ url: request.url(), error: failure ? failure.errorText : 'inconnu' });
  });
  page.on('response', async (response) => {
    const status = response.status();
    if (status >= 400) log.httpErrors.push({ url: response.url(), status });
    let bytes = null;
    try {
      bytes = (await response.body()).length;
    } catch (_) {
      bytes = null;
    }
    log.resources.push({ url: response.url(), status, bytes });
  });
}

function counts(log) {
  return {
    pageErrors: log.pageErrors.length,
    httpErrors: log.httpErrors.length,
    failedRequests: log.failedRequests.length,
    console: log.console.length,
  };
}

async function navTimings(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return nav ? { domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd), loadMs: Math.round(nav.loadEventEnd) } : null;
  });
}

async function heapBytes(page) {
  return page.evaluate(() => (performance.memory ? performance.memory.usedJSHeapSize : null));
}

async function horizontalOverflow(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
}

async function measureFps(page, seconds) {
  return page.evaluate((sec) => new Promise((resolve) => {
    const perSecond = [];
    let frames = 0;
    const start = performance.now();
    let bucketStart = start;
    const tick = (now) => {
      frames += 1;
      if (now - bucketStart >= 1000) {
        perSecond.push(frames);
        frames = 0;
        bucketStart = now;
      }
      if (now - start < sec * 1000) {
        requestAnimationFrame(tick);
      } else {
        const avg = perSecond.length ? perSecond.reduce((a, b) => a + b, 0) / perSecond.length : null;
        resolve({
          seconds: sec,
          perSecond,
          avgFps: avg === null ? null : Math.round(avg * 10) / 10,
          minFps: perSecond.length ? Math.min(...perSecond) : null,
        });
      }
    };
    requestAnimationFrame(tick);
  }), seconds);
}

async function shot(page, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file });
  return path.basename(file);
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

async function visible(page, selector) {
  return page.locator(selector).first().isVisible().catch(() => false);
}

// Clique le premier bouton (ou lien) visible dont le libellé correspond à regex. Renvoie le libellé, ou null.
async function clickByText(page, regex, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const candidates = page.locator('button, a, [role="button"]');
    const count = await candidates.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const item = candidates.nth(i);
      const text = ((await item.textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
      if (text && regex.test(text) && (await item.isVisible().catch(() => false))) {
        await item.click({ timeout: 5000 }).catch(() => {});
        return text;
      }
    }
    await sleep(400);
  }
  return null;
}

async function visibleButtonTexts(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('button, a, [role="button"]'))
    .filter((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    })
    .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 40));
}

async function bodyTextLength(page) {
  return page.evaluate(() => document.body.innerText.length);
}

async function openBrowser() {
  return chromium.launch({ headless: true });
}

async function newPage(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: Boolean(viewport.isMobile),
    hasTouch: Boolean(viewport.hasTouch),
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  return { context, page };
}

module.exports = {
  VIEWPORTS,
  sleep,
  startStatic,
  newLog,
  attach,
  counts,
  navTimings,
  heapBytes,
  horizontalOverflow,
  measureFps,
  shot,
  writeJson,
  visible,
  clickByText,
  visibleButtonTexts,
  bodyTextLength,
  openBrowser,
  newPage,
};
