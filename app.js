/* MEDLENS — shared behavior */
(function () {
  "use strict";

  /* ---------- Theme (light / dark) ---------- */
  var root = document.documentElement;
  function getStored() { try { return localStorage.getItem("medlens-theme"); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem("medlens-theme", v); } catch (e) {} }

  var saved = getStored();
  if (saved === "dark" || saved === "light") {
    root.setAttribute("data-theme", saved);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-theme-toggle]");
    if (!t) return;
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store(next);
  });

  /* ---------- Discipline filter chips ---------- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  // content blocks on lesson pages + lesson rows on the syllabus hub
  var lenses = document.querySelectorAll("[data-lens]");
  function lensList(el) { return (el.getAttribute("data-lens") || "").trim().split(/\s+/); }
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        lenses.forEach(function (l) {
          var match = f === "all" || lensList(l).indexOf(f) !== -1;
          l.classList.toggle("dim", !match);
        });
        // on the syllabus hub, fade whole sections that have no matching lesson
        document.querySelectorAll(".lsec").forEach(function (sec) {
          if (f === "all") { sec.classList.remove("dim-sec"); return; }
          var any = Array.prototype.some.call(
            sec.querySelectorAll(".lrow[data-lens]"),
            function (r) { return lensList(r).indexOf(f) !== -1; }
          );
          sec.classList.toggle("dim-sec", !any);
        });
      });
    });
  }

  /* ---------- Stub links (lessons not yet built) ---------- */
  document.querySelectorAll("a[data-stub]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); });
  });

  /* ---------- Mobile TOC toggle ---------- */
  var tocToggle = document.querySelector(".toc-mobile-toggle");
  if (tocToggle) {
    var toc = tocToggle.closest(".toc");
    tocToggle.addEventListener("click", function () {
      var open = toc.getAttribute("data-open") === "true";
      toc.setAttribute("data-open", String(!open));
      tocToggle.setAttribute("aria-expanded", String(!open));
    });
    // close after picking a section on mobile
    toc.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 999px)").matches) toc.setAttribute("data-open", "false");
      });
    });
  }

  /* ---------- TOC scroll-spy ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  var sections = links
    .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = en.target.id;
          links.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + id);
          });
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }
})();
