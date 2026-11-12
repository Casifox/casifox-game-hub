'use strict';
// Vérification en lecture seule du build testé (the-lying-game\docs\) : empreintes SHA-256,
// présence de chaînes dans le bundle, état git (lecture seule : --no-optional-locks).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO = 'C:\\Users\\Noah\\Documents\\the-lying-game';
const DOCS = path.join(REPO, 'docs');
const LOG_DIR = 'C:\\Users\\Noah\\Documents\\CASIFOX-GAME-HUB\\audit\\screenshots\\the-lying-game\\logs';

fs.mkdirSync(LOG_DIR, { recursive: true });

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(DOCS).map((file) => {
  const buffer = fs.readFileSync(file);
  return {
    path: path.relative(REPO, file),
    bytes: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
  };
});

const jsFile = files.find((f) => /assets[\\/]index-.*\.js$/.test(f.path));
const bundle = jsFile ? fs.readFileSync(path.join(REPO, jsFile.path), 'utf8') : '';
const countOf = (needle) => bundle.split(needle).length - 1;

function git(args) {
  try {
    return execFileSync('git', ['--no-optional-locks', '-C', REPO, ...args], {
      encoding: 'utf8',
      windowsHide: true,
    }).trim();
  } catch (error) {
    return `ERREUR : ${String(error.message).split('\n')[0]}`;
  }
}

const result = {
  test: 'verification du build teste (docs/)',
  repo: REPO,
  docsFiles: files,
  bundle: jsFile ? jsFile.path : null,
  bundleOccurrences: {
    'max-width: 600px) and (orientation: portrait': countOf('max-width: 600px) and (orientation: portrait'),
    'the-lying-game.save.v1': countOf('the-lying-game.save.v1'),
    'the-lying-game.archive.v1': countOf('the-lying-game.archive.v1'),
    'the-lying-game.settings.v1': countOf('the-lying-game.settings.v1'),
  },
  git: {
    head: git(['rev-parse', 'HEAD']),
    remotes: git(['remote', '-v']) || '(aucun remote)',
    docsTracked: git(['ls-files', 'docs']).split('\n'),
    docsStatus: git(['status', '--porcelain', '--', 'docs']) || '(docs/ sans modification)',
  },
};

const out = path.join(LOG_DIR, 'build-check.json');
fs.writeFileSync(out, JSON.stringify(result, null, 2), 'utf8');
console.log(`Fichiers docs : ${files.length} ; bundle : ${result.bundle}`);
console.log(`Occurrences : ${JSON.stringify(result.bundleOccurrences)}`);
console.log(`HEAD : ${result.git.head}`);
console.log(`Statut docs/ : ${result.git.docsStatus}`);
console.log(`Log : ${out}`);
