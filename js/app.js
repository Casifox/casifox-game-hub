/* CASIFOX GAME HUB — rendu des données, recherche, filtres, tri et fiches. */
(function () {
  "use strict";

  const games = Array.isArray(window.CASIFOX_GAMES) ? window.CASIFOX_GAMES : [];
  const root = document.body.dataset.root || "";
  const bySlug = new Map(games.map((game) => [game.slug, game]));
  const state = { query: "", genre: "Tous", sort: "score-desc" };

  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));
  const esc = (value) =>
    String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const score = (game) => `${game.score}<span aria-hidden="true">/100</span>`;

  function gameHref(game) {
    return root + "games/" + game.slug + "/";
  }

  function card(game) {
    return `
      <article class="game-card reveal" style="--game-accent:${esc(game.accent)}">
        <div class="card-media">
          <img src="${root}${esc(game.image)}" alt="Capture d'écran de ${esc(game.name)}" width="1920" height="1080" loading="lazy" decoding="async">
          <span class="status-badge"><span class="live-dot" aria-hidden="true"></span>${esc(game.status)}</span>
        </div>
        <div class="card-body">
          <span class="card-genre">${esc(game.genre)}</span>
          <h3 class="card-title"><a href="${gameHref(game)}" style="text-decoration:none">${esc(game.name)}</a></h3>
          <p class="card-desc">${esc(game.description)}</p>
          <div class="card-foot">
            <div class="card-score" aria-label="Note ${game.score} sur 100"><strong>${score(game)}</strong></div>
            <div class="card-actions">
              <a class="btn btn-primary btn-small" href="${esc(game.url)}" target="_blank" rel="noopener">Jouer <span class="visually-hidden">à ${esc(game.name)}</span></a>
              <a class="btn btn-ghost btn-small" href="${gameHref(game)}">Fiche</a>
            </div>
          </div>
        </div>
      </article>`;
  }

  function filteredGames() {
    const query = state.query.trim().toLowerCase();
    let list = games.filter((game) => {
      const matchesQuery = !query || [game.name, game.tagline, game.genre, game.description].join(" ").toLowerCase().includes(query);
      const matchesGenre = state.genre === "Tous" || game.genre === state.genre;
      return matchesQuery && matchesGenre;
    });
    if (state.sort === "score-desc") list.sort((a, b) => b.score - a.score);
    else if (state.sort === "score-asc") list.sort((a, b) => a.score - b.score);
    else if (state.sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    else if (state.sort === "recent") list.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return list;
  }

  function renderGrid() {
    const grid = $("#games-grid");
    if (!grid) return;
    const list = filteredGames();
    grid.innerHTML = list.map(card).join("");
    const count = $("#result-count");
    if (count) count.textContent = `${list.length} jeu${list.length > 1 ? "x" : ""} affiché${list.length > 1 ? "s" : ""}`;
    const empty = $("#empty-state");
    if (empty) empty.hidden = list.length > 0;
    initReveal();
  }

  function initFilters() {
    const chips = $("#genre-chips");
    const genres = ["Tous"].concat(Array.from(new Set(games.map((game) => game.genre))).sort((a, b) => a.localeCompare(b, "fr")));
    if (chips) {
      chips.innerHTML = genres
        .map((genre) => `<button class="chip" type="button" data-genre="${esc(genre)}" aria-pressed="${genre === "Tous"}">${esc(genre)}</button>`)
        .join("");
      chips.addEventListener("click", (event) => {
        const button = event.target.closest("[data-genre]");
        if (!button) return;
        state.genre = button.dataset.genre;
        $$(".chip", chips).forEach((chip) => chip.setAttribute("aria-pressed", String(chip === button)));
        renderGrid();
      });
    }
    const search = $("#search");
    if (search) {
      search.addEventListener("input", () => {
        state.query = search.value;
        renderGrid();
      });
    }
    const sort = $("#sort");
    if (sort) {
      sort.addEventListener("change", () => {
        state.sort = sort.value;
        renderGrid();
      });
    }
  }

  function renderFeatured() {
    const host = $("#featured");
    if (!host || games.length === 0) return;
    const best = games.slice().sort((a, b) => b.score - a.score)[0];
    host.innerHTML = `
      <article class="featured">
        <div class="featured-media">
          <img src="${root}${esc(best.image)}" alt="Capture de ${esc(best.name)}" width="1920" height="1080">
        </div>
        <div class="featured-body">
          <span class="featured-rank">Rang 1 · ${esc(best.genre)}</span>
          <h3 class="featured-title">${esc(best.name)}</h3>
          <p class="featured-desc">${esc(best.description)}</p>
          <div class="score-row">
            <span class="score-big">${best.score}</span>
            <span class="score-denom">/100</span>
            <span class="score-delta">+${best.delta} après corrections</span>
          </div>
          <div class="featured-actions">
            <a class="btn btn-primary" href="${esc(best.url)}" target="_blank" rel="noopener">Jouer maintenant</a>
            <a class="btn btn-ghost" href="${gameHref(best)}">Lire la fiche</a>
          </div>
        </div>
      </article>`;
  }

  function renderRanking() {
    const host = $("#ranking");
    if (!host) return;
    const list = games.slice().sort((a, b) => b.score - a.score);
    host.innerHTML = `
      <div class="rank-row rank-row--head" role="row">
        <span role="columnheader">Rang</span>
        <span role="columnheader">Jeu</span>
        <span role="columnheader">Genre</span>
        <span role="columnheader">Note</span>
        <span role="columnheader">Points</span>
        <span role="columnheader">Delta</span>
      </div>
      ${list
        .map(
          (game, index) => `
        <div class="rank-row" role="row">
          <span class="rank-pos" role="cell">${String(index + 1).padStart(2, "0")}</span>
          <span class="rank-name" role="cell"><a href="${gameHref(game)}" style="text-decoration:none">${esc(game.name)}</a><small>${esc(game.tagline)}</small></span>
          <span class="rank-genre" role="cell">${esc(game.genre)}</span>
          <span class="rank-bar" role="cell" aria-label="Note ${game.score} sur 100"><span style="width:${game.score}%"></span></span>
          <span class="rank-score" role="cell">${game.score}/100</span>
          <span class="rank-delta" role="cell">+${game.delta}</span>
        </div>`
        )
        .join("")}`;
  }

  function breakdownItem(label, value, max) {
    const percent = Math.round((value / max) * 100);
    return `<li><span>${esc(label)}</span><span class="bar" aria-hidden="true"><span style="width:${percent}%"></span></span><b>${value}/${max}</b></li>`;
  }

  function renderDetail() {
    const host = $("#game-detail");
    if (!host) return;
    const game = bySlug.get(document.body.dataset.slug);
    if (!game) {
      host.innerHTML = `<div class="empty-state"><p><strong>Jeu introuvable.</strong></p><p><a href="${root}index.html#jeux">Revenir au catalogue</a></p></div>`;
      return;
    }
    document.title = `${game.name} — CASIFOX GAME HUB`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", game.description);
    const b = game.breakdown;
    host.innerHTML = `
      <div class="detail-hero">
        <div>
          <span class="kicker">${esc(game.genre)} · ${esc(game.status)}</span>
          <h1>${esc(game.name)}</h1>
          <p><strong>${esc(game.tagline)}</strong> — ${esc(game.longDescription)}</p>
          <div class="detail-meta">
            <span class="pill">Note ${game.score}/100</span>
            <span class="pill">Avant ${game.scoreBefore}/100</span>
            <span class="pill">+${game.delta} après corrections</span>
            <span class="pill">${esc(game.date)}</span>
          </div>
          <div class="hero-actions">
            <a class="btn btn-primary" href="${esc(game.url)}" target="_blank" rel="noopener">Jouer sur GitHub Pages</a>
            <a class="btn btn-ghost" href="${esc(game.repo)}" target="_blank" rel="noopener">Voir le dépôt</a>
          </div>
        </div>
        <div class="detail-media">
          <img src="${root}${esc(game.image)}" alt="Capture de ${esc(game.name)}" width="1920" height="1080">
        </div>
      </div>
      <div class="detail-grid">
        <section class="panel">
          <h2>Ce que c'est</h2>
          <p>${esc(game.description)}</p>
          <p style="margin-top:10px">${esc(game.genre)} · ${esc(game.tech.join(" · "))}</p>
        </section>
        <section class="panel">
          <h2>Note par critère</h2>
          <ul class="breakdown">
            ${breakdownItem("Gameplay", b.gameplay, 25)}
            ${breakdownItem("Originalité", b.originality, 15)}
            ${breakdownItem("Technique", b.technique, 20)}
            ${breakdownItem("Design / UX", b.design, 15)}
            ${breakdownItem("Rejouabilité", b.replayability, 15)}
            ${breakdownItem("Performance", b.performance, 10)}
          </ul>
        </section>
        <section class="panel">
          <h2>Commandes réelles</h2>
          <ul class="controls-list">${game.controls.map((control) => `<li>${esc(control)}</li>`).join("")}</ul>
        </section>
        <section class="panel">
          <h2>Technologies</h2>
          <div class="detail-meta">${game.tech.map((tech) => `<span class="pill">${esc(tech)}</span>`).join("")}</div>
          <p>Publication : <a href="${esc(game.url)}" target="_blank" rel="noopener">${esc(game.url)}</a></p>
        </section>
        <section class="panel">
          <h2>Points forts</h2>
          <div class="pros-cons"><ul>${game.strengths.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
        </section>
        <section class="panel">
          <h2>À améliorer</h2>
          <div class="pros-cons"><ul>${game.weaknesses.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
        </section>
      </div>
      <p style="margin-top:22px"><a class="back-link" href="${root}index.html#jeux">← Tous les jeux</a></p>`;
  }

  let observer = null;
  function initReveal() {
    const items = $$(".reveal:not(.is-visible)");
    if (items.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
      );
    }
    items.forEach((item) => observer.observe(item));
  }

  function initHome() {
    renderFeatured();
    initFilters();
    renderGrid();
    renderRanking();
    initReveal();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.page === "game") renderDetail();
    else initHome();
  });
})();
