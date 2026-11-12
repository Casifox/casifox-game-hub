'use strict';
// Concordance de version (protocole 8.8) : fichiers servis sur GitHub Pages comparés à la copie locale
// (C:\Users\Noah\Documents\incremental) et à HEAD Git. Lecture seule : aucun fichier du projet n'est modifié.
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ORIG = 'C:\\Users\\Noah\\Documents\\incremental';
const BASE = 'https://casifox.github.io/neon-jackpot/';
const LOG_DIR = 'C:\\Users\\Noah\\Documents\\CASIFOX-GAME-HUB\\audit\\screenshots\\incremental\\logs';
fs.mkdirSync(LOG_DIR, { recursive: true });

const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const gitBlob = (b) => crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + b.length + '\0'), b])).digest('hex');
const eolNorm = (b) => Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
const git = (args) => execFileSync('git', ['--no-optional-locks', '-C', ORIG, ...args], { maxBuffer: 64 * 1024 * 1024 });

function fetchBuf(url, redirects) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'casifox-audit-readonly/1.0' } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        res.resume();
        resolve(fetchBuf(new URL(res.headers.location, url).toString(), redirects - 1));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, url, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.setTimeout(30000, () => req.destroy(new Error('timeout 30 s')));
    req.on('error', reject);
  });
}

function parseLsTree(text) {
  const map = new Map();
  for (const line of text.split('\n')) {
    const m = line.match(/^\d+ blob ([0-9a-f]{40})\t(.+)$/);
    if (m) map.set(m[2], m[1]);
  }
  return map;
}

(async () => {
  const indexLocal = fs.readFileSync(path.join(ORIG, 'index.html'), 'utf8');
  const refs = new Set(['index.html']);
  for (const m of indexLocal.matchAll(/(?:src|href)="((?:src|assets)\/[^"?#]+)(?:\?[^"#]*)?"/g)) refs.add(m[1]);
  const files = [...refs];

  const head = git(['rev-parse', 'HEAD']).toString('utf8').trim();
  const headTree = parseLsTree(git(['ls-tree', '-r', 'HEAD']).toString('utf8'));
  let autocrlf = null;
  try { autocrlf = git(['config', '--get', 'core.autocrlf']).toString('utf8').trim(); } catch (e) { autocrlf = '(non défini)'; }

  const rows = [];
  const remoteBlobs = new Map();
  for (const f of files) {
    const local = fs.readFileSync(path.join(ORIG, f));
    const r = await fetchBuf(BASE + f, 3);
    const rBlob = gitBlob(r.body);
    remoteBlobs.set(f, rBlob);
    rows.push({
      file: f,
      localBytes: local.length,
      localSha256: sha256(local),
      remoteStatus: r.status,
      remoteFinalUrl: r.url,
      remoteBytes: r.body.length,
      remoteSha256: sha256(r.body),
      remoteGitBlob: rBlob,
      remoteHeaders: {
        'cache-control': r.headers['cache-control'] || null,
        age: r.headers['age'] || null,
        'last-modified': r.headers['last-modified'] || null,
        etag: r.headers['etag'] || null,
      },
      headGitBlob: headTree.get(f) || null,
      localSameAsRemoteSha256: sha256(local) === sha256(r.body),
      localSameAsRemoteEolNormalized: sha256(eolNorm(local)) === sha256(eolNorm(r.body)),
      remoteSameAsHeadBlob: rBlob === headTree.get(f),
    });
  }

  const commitLines = git(['log', '-n', '20', '--format=%H\t%cI\t%s']).toString('utf8').trim().split('\n');
  const commits = commitLines.map((line) => {
    const parts = line.split('\t');
    const sha = parts[0];
    const date = parts[1];
    const subject = parts.slice(2).join('\t');
    const tree = parseLsTree(git(['ls-tree', '-r', sha]).toString('utf8'));
    const matchedFiles = files.filter((f) => tree.get(f) && tree.get(f) === remoteBlobs.get(f)).length;
    return { sha, date, subject, matchedFiles, totalFiles: files.length };
  });
  const bestCommit = commits.reduce((best, c) => (c.matchedFiles > best.matchedFiles ? c : best), commits[0]);
  const fullMatchCommits = commits.filter((c) => c.matchedFiles === c.totalFiles).map((c) => c.sha);

  let pages = null;
  try {
    pages = JSON.parse(execFileSync('gh', ['api', 'repos/Casifox/neon-jackpot/pages']).toString('utf8'));
  } catch (e) {
    pages = { error: String(e.message).split('\n')[0] };
  }

  const result = {
    checkedAt: new Date().toISOString(),
    base: BASE,
    localRoot: ORIG,
    headCommit: head,
    coreAutocrlf: autocrlf,
    pagesApi: pages,
    filesCompared: files.length,
    files: rows,
    commitsScanned: commits,
    bestCommit,
    fullMatchCommits,
  };
  fs.writeFileSync(path.join(LOG_DIR, 'version-concordance.json'), JSON.stringify(result, null, 2), 'utf8');

  const summary = rows.map((r) => ({
    file: r.file,
    http: r.remoteStatus,
    bytesLocal: r.localBytes,
    bytesRemote: r.remoteBytes,
    sha256Identique: r.localSameAsRemoteSha256,
    identiqueFinDeLigneNormalisee: r.localSameAsRemoteEolNormalized,
    distantEgalHEAD: r.remoteSameAsHeadBlob,
  }));
  console.log(JSON.stringify({
    headCommit: head,
    coreAutocrlf: autocrlf,
    pagesStatus: pages.status || null,
    pagesHtmlUrl: pages.html_url || null,
    filesCompared: files.length,
    identiques_sha256: rows.filter((r) => r.localSameAsRemoteSha256).length,
    identiques_fin_de_ligne_normalisee: rows.filter((r) => r.localSameAsRemoteEolNormalized).length,
    distants_egal_HEAD: rows.filter((r) => r.remoteSameAsHeadBlob).length,
    bestCommit: { sha: bestCommit.sha, date: bestCommit.date, matchedFiles: bestCommit.matchedFiles, totalFiles: bestCommit.totalFiles, subject: bestCommit.subject },
    fullMatchCommits,
    summary,
  }, null, 2));
})().catch((e) => {
  console.error('ERREUR', e && e.stack ? e.stack : e);
  process.exit(1);
});
