/* CASIFOX GAME HUB — navigation collante, menu mobile, section active. */
(function () {
  "use strict";

  const header = document.getElementById("site-header");
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    links.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Ouvrir le menu");
      }
    });
  }

  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const navLinks = Array.from(document.querySelectorAll('#nav-links a[href^="#"]'));
  if (sections.length === 0 || navLinks.length === 0 || !("IntersectionObserver" in window)) return;

  const visible = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => visible.set(entry.target.id, entry.intersectionRatio));
      let bestId = null;
      let bestRatio = 0;
      visible.forEach((ratio, id) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      });
      navLinks.forEach((link) => {
        const id = link.getAttribute("href").slice(1);
        if (id === bestId && bestRatio > 0) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] }
  );
  sections.forEach((section) => observer.observe(section));
})();
