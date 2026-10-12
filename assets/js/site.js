/* Site-wide behaviour: theme toggle, copy buttons, optional CV link,
   contents-rail highlighting and chart tooltips. No dependencies. */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---- Theme toggle (light / dark), remembered per browser ---- */
  function systemDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return systemDark() ? "dark" : "light";
  }
  function announceTheme() {
    document.dispatchEvent(new CustomEvent("themechange", { detail: currentTheme() }));
  }
  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    var setLabel = function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      toggle.setAttribute("aria-label", "Switch to " + next + " theme");
      toggle.setAttribute("title", "Switch to " + next + " theme");
    };
    setLabel();
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* storage unavailable */ }
      setLabel();
      announceTheme();
    });
  }
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () { if (!root.hasAttribute("data-theme")) announceTheme(); };
    if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
  }

  /* ---- Copy-to-clipboard buttons ---- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.getAttribute("data-copy"));
      if (!target) return;
      var text = target.innerText.trim();
      var done = function (ok) {
        var old = btn.textContent;
        btn.textContent = ok ? "Copied" : "Press Ctrl+C";
        setTimeout(function () { btn.textContent = old; }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var range = document.createRange();
        range.selectNodeContents(target);
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        done(ok);
      }
    });
  });

  /* ---- Optional files: show the CV link only once the PDF exists ---- */
  document.querySelectorAll("[data-optional-file]").forEach(function (el) {
    var url = el.getAttribute("data-optional-file");
    if (!window.fetch || location.protocol === "file:") return;
    fetch(url, { method: "HEAD", cache: "no-store" }).then(function (r) {
      if (!r.ok) return;
      el.hidden = false;
      document.querySelectorAll('[data-optional-fallback="' + url + '"]').forEach(function (fb) { fb.hidden = true; });
    }).catch(function () { /* stays hidden */ });
  });
  /* Optional portrait: shown only if the image loads */
  document.querySelectorAll("[data-optional-img]").forEach(function (fig) {
    var img = fig.querySelector("img");
    if (!img) return;
    var show = function () { if (img.naturalWidth > 0) fig.hidden = false; };
    if (img.complete) show(); else img.addEventListener("load", show);
  });

  /* ---- Contents rail: mark the section in view ---- */
  var toc = document.querySelector(".toc");
  if (toc && "IntersectionObserver" in window) {
    var links = Array.prototype.slice.call(toc.querySelectorAll("a[href^='#']"));
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var first = targets.find(function (t) { return visible[t.id]; });
      if (first) {
        links.forEach(function (a) { a.classList.remove("is-current"); });
        map[first.id].classList.add("is-current");
      }
    }, { rootMargin: "-10% 0px -70% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---- Chart tooltips: any element with data-tip inside .chart-wrap ---- */
  document.querySelectorAll(".chart-wrap").forEach(function (wrap) {
    var tip = document.createElement("div");
    tip.className = "tip";
    tip.setAttribute("aria-hidden", "true");
    wrap.appendChild(tip);
    var show = function (el) {
      var box = wrap.getBoundingClientRect();
      var r = el.getBoundingClientRect();
      tip.textContent = el.getAttribute("data-tip");
      tip.style.left = (r.left + r.width / 2 - box.left) + "px";
      tip.style.top = (r.top - box.top) + "px";
      tip.classList.add("on");
    };
    var hide = function () { tip.classList.remove("on"); };
    wrap.querySelectorAll("[data-tip]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { show(el); });
      el.addEventListener("mouseleave", hide);
      el.addEventListener("focus", function () { show(el); });
      el.addEventListener("blur", hide);
    });
  });
})();
