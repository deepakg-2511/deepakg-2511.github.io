/* Multiscale figures, computed in the browser.

   1. [data-msfig]  — hero figure. Exact solutions of benchmark problems
      from the WPIQNN and ER-WPIQNN papers (arXiv:2512.08256) and their multilevel 2D Haar
      decomposition (standard pyramid: only the coarse block is split again).
   2. [data-qwt-demo] — software page. A state-vector simulation of the gate
      sequence used by the single-level 2D Haar QWT in
      github.com/deepakg-2511/multilevel-2D-QWT-pennylane
      (Hadamard on the last qubit of each register, then a chain of SWAPs).

   No dependencies. Colours come from CSS custom properties so the figures
   follow the light/dark theme. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Benchmark fields (exact solutions as stated in the WPIQNN paper)    */
  /* ------------------------------------------------------------------ */
  /* Each field: f(X, T) is the formula; map(u, v) turns figure coordinates
     (u: 0 → 1 left to right, v: 0 → 1 bottom to top) into the arguments of f.
     axes: [horizontal label, vertical label].
     Time-dependent problems are drawn with t horizontal and x vertical. */
  var FIELDS = {
    heat: {
      name: "Heat conduction",
      axes: ["t", "x"],
      signed: false,
      note: "u = (1 − x²) exp(1 / ((2t − 1)² + ε)), ε = 0.15",
      f: function (X, T) { // X in (-1,1), T in (0,1)
        var eps = 0.15;
        return (1 - X * X) * Math.exp(1 / ((2 * T - 1) * (2 * T - 1) + eps));
      },
      map: function (u, v) { return [-1 + 2 * v, u]; }   // x = vertical, t = horizontal
    },
    helmholtz: {
      name: "Helmholtz",
      axes: ["x", "y"],
      signed: true,
      note: "u = sin(πx) sin(8πy)",
      f: function (X, Y) { return Math.sin(Math.PI * X) * Math.sin(8 * Math.PI * Y); },
      map: function (u, v) { return [-1 + 2 * u, -1 + 2 * v]; }   // x = horizontal, y = vertical
    },
    klein: {
      name: "Klein–Gordon",
      axes: ["t", "x"],
      signed: true,
      note: "u = x cos(10πt) + (xt)³",
      f: function (X, T) { return X * Math.cos(10 * Math.PI * T) + Math.pow(X * T, 3); },
      map: function (u, v) { return [v, u]; }              // x in [0,1] vertical, t horizontal
    },
    Multi_Frequency: {
      name: "Multi-frequency diffusion",
      axes: ["t", "x"],
      signed: true,
      note: "u = sin(φ(x) t), φ(x) = 20π / (1 + 9x²)",
      f: function (X, T) { // X in (-1,1), T in (0,1)
        var phi = 20 * Math.PI / (1 + 9 * X * X);
        return Math.sin(phi * T);
      },
      map: function (u, v) { return [-1 + 2 * v, u]; }   // x = vertical, t = horizontal
    }
  };

  /* Colour map used when a field does not set its own `cmap`:
     "jet"   = Matplotlib's jet,
     "theme" = the site's blue/amber colours (follow light/dark mode).
     To give one problem a different map, add  cmap: "theme"  to its entry. */
  var DEFAULT_CMAP = "jet";


  /* Sample on an N×N grid of cell centres, row 0 at the top (v = 1). */
  function sample(key, N) {
    var F = FIELDS[key], a = new Float64Array(N * N);
    for (var r = 0; r < N; r++) {
      var v = 1 - (r + 0.5) / N;
      for (var c = 0; c < N; c++) {
        var u = (c + 0.5) / N, p = F.map(u, v);
        a[r * N + c] = F.f(p[0], p[1]);
      }
    }
    return a;
  }

  /* ------------------------------------------------------------------ */
  /* Orthonormal 2D Haar pyramid                                         */
  /* ------------------------------------------------------------------ */
  var S2 = Math.SQRT1_2;
  function haarPyramid(src, N, levels) {
    var a = Float64Array.from(src), tmp = new Float64Array(N), s = N;
    for (var L = 0; L < levels && s >= 2; L++) {
      var h = s >> 1, r, c;
      for (r = 0; r < s; r++) {              // rows
        for (c = 0; c < h; c++) {
          var p = a[r * N + 2 * c], q = a[r * N + 2 * c + 1];
          tmp[c] = (p + q) * S2; tmp[h + c] = (p - q) * S2;
        }
        for (c = 0; c < s; c++) a[r * N + c] = tmp[c];
      }
      for (c = 0; c < s; c++) {              // columns
        for (r = 0; r < h; r++) {
          var p2 = a[(2 * r) * N + c], q2 = a[(2 * r + 1) * N + c];
          tmp[r] = (p2 + q2) * S2; tmp[h + r] = (p2 - q2) * S2;
        }
        for (r = 0; r < s; r++) a[r * N + c] = tmp[r];
      }
      s = h;
    }
    return a;
  }

  /* Smallest share of coefficients holding `frac` of the energy. */
  function compaction(a, frac) {
    var sq = new Float64Array(a.length), tot = 0, i;
    for (i = 0; i < a.length; i++) { sq[i] = a[i] * a[i]; tot += sq[i]; }
    sq.sort(); // ascending
    var acc = 0, k = 0;
    for (i = sq.length - 1; i >= 0; i--) { acc += sq[i]; k++; if (acc >= frac * tot) break; }
    return k / a.length;
  }

  /* ------------------------------------------------------------------ */
  /* Colour: OKLab interpolation between CSS tokens                      */
  /* ------------------------------------------------------------------ */
  function hexToRgb(h) {
    h = h.trim().replace("#", "");
    if (h.length === 3) h = h.split("").map(function (x) { return x + x; }).join("");
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function delin(c) { var v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.max(0, Math.min(255, Math.round(v * 255))); }
  function toLab(rgb) {
    var r = lin(rgb[0]), g = lin(rgb[1]), b = lin(rgb[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  function fromLab(L) {
    var l = Math.pow(L[0] + 0.3963377774 * L[1] + 0.2158037573 * L[2], 3);
    var m = Math.pow(L[0] - 0.1055613458 * L[1] - 0.0638541728 * L[2], 3);
    var s = Math.pow(L[0] - 0.0894841775 * L[1] - 1.2914855480 * L[2], 3);
    return [delin(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
            delin(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
            delin(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)];
  }
  function ramp(stops, n) { // stops: array of hex; returns n RGB triples
    var labs = stops.map(function (h) { return toLab(hexToRgb(h)); }), out = [];
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1) * (labs.length - 1), k = Math.min(Math.floor(t), labs.length - 2), f = t - k;
      var A = labs[k], B = labs[k + 1];
      out.push(fromLab([A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f]));
    }
    return out;
  }
  function tokens() {
    var cs = getComputedStyle(document.documentElement);
    var g = function (n) { return cs.getPropertyValue(n).trim(); };
    return { neg: g("--neg"), pos: g("--pos"), mid: g("--mid"), end: g("--seq-end"), surface: g("--surface") };
  }
  /* Jet colour map: Matplotlib's piecewise-linear definition. */
  var JET_SEGMENTS = {
    r: [[0, 0], [0.35, 0], [0.66, 1], [0.89, 1], [1, 0.5]],
    g: [[0, 0], [0.125, 0], [0.375, 1], [0.64, 1], [0.91, 0], [1, 0]],
    b: [[0, 0.5], [0.11, 1], [0.34, 1], [0.65, 0], [1, 0]]
  };
  function jetChannel(seg, x) {
    for (var i = 1; i < seg.length; i++) {
      if (x <= seg[i][0]) {
        var a = seg[i - 1], b = seg[i];
        return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      }
    }
    return seg[seg.length - 1][1];
  }
  function jetRamp(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var x = i / (n - 1);
      out.push([jetChannel(JET_SEGMENTS.r, x), jetChannel(JET_SEGMENTS.g, x), jetChannel(JET_SEGMENTS.b, x)]
        .map(function (v) { return Math.round(v * 255); }));
    }
    return out;
  }
  function cssGradient(rgbs) {
    var stops = [];
    for (var i = 0; i < rgbs.length; i += Math.max(1, Math.floor(rgbs.length / 16))) stops.push("rgb(" + rgbs[i].join(",") + ")");
    stops.push("rgb(" + rgbs[rgbs.length - 1].join(",") + ")");
    return "linear-gradient(90deg, " + stops.join(", ") + ")";
  }
  function palettes() {
    var t = tokens();
    return {
      seq: ramp([t.mid, t.neg, t.end], 256),          // magnitude
      div: ramp([t.neg, t.mid, t.pos], 257),          // sign: negative · zero · positive
      gap: t.surface,
      jet: { seq: jetRamp(256), div: jetRamp(257), gap: t.surface }
    };
  }
  /* Palette for a given field: its own `cmap`, else DEFAULT_CMAP. */
  function palFor(F, pal) {
    return (F.cmap || DEFAULT_CMAP) === "jet" ? pal.jet : pal;
  }

  /* Render coefficient array to RGBA following the pyramid layout. */
  function paint(img, a, N, levels, signed, pal) {
    var d = img.data, s = N >> levels, i, r, c;
    // scale for the coarse block
    var amax = 0, amin = Infinity;
    for (r = 0; r < s; r++) for (c = 0; c < s; c++) {
      var v0 = a[r * N + c]; amax = Math.max(amax, Math.abs(v0)); amin = Math.min(amin, v0);
    }
    // scale for each detail level k = 1..levels (max |c| over its three bands)
    var lev = new Float64Array(levels + 1);
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
      var m = Math.max(r, c); if (m < s) continue;
      var k = levelOf(m, N, levels); lev[k] = Math.max(lev[k], Math.abs(a[r * N + c]));
    }
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
      var val = a[r * N + c], rgb, mm = Math.max(r, c);
      if (mm < s) {
        if (signed) {
          var x = amax > 0 ? val / amax : 0;
          rgb = pal.div[Math.round((x + 1) * 128)];
        } else {
          var lo = levels === 0 ? Math.min(0, amin) : 0; // positive field: anchor at 0
          var y = amax > lo ? (val - lo) / (amax - lo) : 0;
          rgb = pal.seq[Math.max(0, Math.min(255, Math.round(y * 255)))];
        }
      } else {
        var kk = levelOf(mm, N, levels), sc = lev[kk] || 1;
        var z = val / sc; z = (z < 0 ? -1 : 1) * Math.sqrt(Math.abs(z)); // compress for visibility
        rgb = pal.div[Math.round((z + 1) * 128)];
      }
      i = (r * N + c) * 4;
      d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
    }
  }
  function levelOf(m, N, levels) {
    for (var k = 1; k <= levels; k++) if (m >= (N >> k) && m < (N >> (k - 1))) return k;
    return levels;
  }

  function drawToCanvas(canvas, N, img, levels, gapColor) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth || 300;
    var W = Math.round(w * dpr);
    if (canvas.width !== W) { canvas.width = W; canvas.height = W; }
    var off = document.createElement("canvas");
    off.width = N; off.height = N;
    off.getContext("2d").putImageData(img, 0, 0);
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, W);
    ctx.drawImage(off, 0, 0, W, W);
    if (levels > 0) {
      ctx.fillStyle = gapColor;
      var gw = Math.max(2, Math.round(1.5 * dpr));
      for (var k = 1; k <= levels; k++) {
        var p = Math.round(W * (1 / Math.pow(2, k))), ext = Math.round(W / Math.pow(2, k - 1));
        ctx.fillRect(p - gw / 2, 0, gw, ext);
        ctx.fillRect(0, p - gw / 2, ext, gw);
      }
    }
  }

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function pct(x) {
    var p = x * 100;
    return (p < 1 ? p.toFixed(2) : p < 10 ? p.toFixed(1) : p.toFixed(0)) + "%";
  }

  /* ------------------------------------------------------------------ */
  /* 1. Hero figure                                                      */
  /* ------------------------------------------------------------------ */
  function initHero(root) {
    var N = 128, MAXL = 5;
    var canvas = root.querySelector("canvas");
    var levelInput = root.querySelector("input[type=range]");
    var levelOut = root.querySelector("output");
    var readout = root.querySelector(".readout");
    var axX = root.querySelector(".axis-x"), axY = root.querySelector(".axis-y");
    var noteEl = root.querySelector("[data-field-note]");
    var radios = root.querySelectorAll("input[name=ms-field]");
    var keyField = root.querySelector(".ms-key .k-field"), keyDetail = root.querySelector(".ms-key .k-detail");
    var state = { field: "heat", level: Number(levelInput.value), data: null, base: null, pal: palettes() };
    var cache = {};
    var img = new ImageData(N, N);
    var userTouched = false, animTimer = null;

    function load(key) {
      if (!cache[key]) {
        var raw = sample(key, N), coeffs = [];
        for (var L = 0; L <= MAXL; L++) coeffs.push(haarPyramid(raw, N, L));
        cache[key] = { coeffs: coeffs, comp: coeffs.map(function (c) { return compaction(c, 0.999); }) };
      }
      return cache[key];
    }
    function render() {
      var F = FIELDS[state.field], D = load(state.field), L = state.level;
      var P = palFor(F, state.pal);
      paint(img, D.coeffs[L], N, L, F.signed, P);
      if (keyField) keyField.style.background = P === state.pal ? "" : cssGradient(F.signed ? P.div : P.seq);
      if (keyDetail) keyDetail.style.background = P === state.pal ? "" : cssGradient(P.div);
      drawToCanvas(canvas, N, img, L, state.pal.gap);
      axX.textContent = F.axes[0]; axY.textContent = F.axes[1];
      axX.hidden = axY.hidden = L > 0; // axes only describe the raw field
      if (noteEl) noteEl.textContent = F.note;
      levelOut.textContent = L === 0 ? "samples" : L + (L === 1 ? " level" : " levels");
      var msg;
      if (L === 0) {
        msg = "Raw samples on a " + N + "×" + N + " grid: 99.9% of the energy needs " + pct(D.comp[0]) + " of the values.";
      } else {
        msg = "After " + L + (L === 1 ? " level" : " levels") + ", 99.9% of the energy sits in " + pct(D.comp[L]) +
              " of the coefficients (raw samples: " + pct(D.comp[0]) + ").";
      }
      readout.textContent = msg;
      canvas.setAttribute("aria-label", F.name + " benchmark solution" + (L === 0 ? " on a " + N + " by " + N + " grid." :
        ", shown after " + L + " levels of a two-dimensional Haar wavelet decomposition. " + msg));
    }
    function stopAnim() { if (animTimer) { clearInterval(animTimer); animTimer = null; } }

    radios.forEach(function (r) {
      r.addEventListener("change", function () { if (r.checked) { userTouched = true; stopAnim(); state.field = r.value; render(); } });
    });
    levelInput.addEventListener("input", function () { userTouched = true; stopAnim(); state.level = Number(levelInput.value); render(); });
    document.addEventListener("themechange", function () { state.pal = palettes(); render(); });
    if (window.ResizeObserver) new ResizeObserver(function () { render(); }).observe(canvas);
    else window.addEventListener("resize", render);

    // One orchestrated moment: step from raw samples to the target level once.
    var target = Number(levelInput.value);
    if (!reduceMotion && "IntersectionObserver" in window) {
      state.level = 0; levelInput.value = 0; render();
      var io = new IntersectionObserver(function (ents) {
        if (!ents[0].isIntersecting) return;
        io.disconnect();
        if (userTouched) return;
        animTimer = setInterval(function () {
          if (userTouched || state.level >= target) { stopAnim(); return; }
          state.level += 1; levelInput.value = state.level; render();
        }, 650);
      }, { threshold: 0.4 });
      io.observe(canvas);
    } else {
      render();
    }
  }

  /* ------------------------------------------------------------------ */
  /* 2. Gate-level QWT demo                                              */
  /* ------------------------------------------------------------------ */
  // Wire w (0 = most significant, as in PennyLane) ↔ bit (nq-1-w) of the index.
  function opH(s, nq, w) {
    var b = 1 << (nq - 1 - w), len = s.length;
    for (var i = 0; i < len; i++) if (!(i & b)) {
      var j = i | b, x = s[i], y = s[j];
      s[i] = (x + y) * S2; s[j] = (x - y) * S2;
    }
  }
  function opSWAP(s, nq, a, c) {
    var ba = 1 << (nq - 1 - a), bc = 1 << (nq - 1 - c), len = s.length;
    for (var i = 0; i < len; i++) if ((i & ba) && !(i & bc)) {
      var j = (i ^ ba) | bc, t = s[i]; s[i] = s[j]; s[j] = t;
    }
  }
  // qhaar_1d / qhaar_1d_inverse from src/hqwt_1d.py and src/permutations.py
  function qhaar1d(ops, wires) {
    var n = wires.length;
    if (n === 1) { ops.push(["H", wires[0]]); return; }
    ops.push(["H", wires[n - 1]]);
    for (var i = n - 2; i >= 0; i--) ops.push(["SWAP", wires[i], wires[i + 1]]); // P_(2^(n-1),2)
  }
  function qhaar1dInv(ops, wires) {
    var n = wires.length;
    if (n === 1) { ops.push(["H", wires[0]]); return; }
    for (var i = 0; i < n - 1; i++) ops.push(["SWAP", wires[i], wires[i + 1]]);  // P_(2,2^(n-1))
    ops.push(["H", wires[n - 1]]);
  }
  function run(s, nq, ops) {
    ops.forEach(function (o) { if (o[0] === "H") opH(s, nq, o[1]); else opSWAP(s, nq, o[1], o[2]); });
  }

  function initQwtDemo(root) {
    var n = 6, N = 1 << n, nq = 2 * n;
    var cIn = root.querySelector("[data-in]"), cOut = root.querySelector("[data-out]");
    var capOut = root.querySelector("[data-out-cap]");
    var readout = root.querySelector(".readout");
    var select = root.querySelector("select");
    var btn = root.querySelector("button[data-inverse]");
    var rows = [], cols = [];
    for (var w = 0; w < n; w++) { rows.push(w); cols.push(n + w); }
    var fwd = [], inv = [];
    qhaar1d(fwd, rows); qhaar1d(fwd, cols);           // qhaar_2d
    qhaar1dInv(inv, cols); qhaar1dInv(inv, rows);     // qhaar_2d_inverse
    var nH = fwd.filter(function (o) { return o[0] === "H"; }).length, nS = fwd.length - nH;
    var state = { field: select ? select.value : "helmholtz", showInverse: false, pal: palettes() };
    var imgIn = new ImageData(N, N), imgOut = new ImageData(N, N);

    function compute() {
      var F = FIELDS[state.field], raw = sample(state.field, N), norm = 0, i;
      for (i = 0; i < raw.length; i++) norm += raw[i] * raw[i];
      norm = Math.sqrt(norm);
      var psi = new Float64Array(raw.length);
      for (i = 0; i < raw.length; i++) psi[i] = raw[i] / norm;      // amplitude encoding
      var out = Float64Array.from(psi); run(out, nq, fwd);
      var back = Float64Array.from(out); run(back, nq, inv);
      var err = 0;
      for (i = 0; i < psi.length; i++) err = Math.max(err, Math.abs(back[i] - psi[i]));
      return { F: F, psi: psi, out: out, back: back, err: err };
    }
    function render() {
      var R = compute();
      paint(imgIn, R.psi, N, 0, R.F.signed, palFor(R.F, state.pal));
      drawToCanvas(cIn, N, imgIn, 0, state.pal.gap);
      if (state.showInverse) {
        paint(imgOut, R.back, N, 0, R.F.signed, palFor(R.F, state.pal));
        drawToCanvas(cOut, N, imgOut, 0, state.pal.gap);
        capOut.textContent = "After the circuit and its inverse";
        readout.textContent = "Forward then inverse circuit: largest deviation from the input amplitudes is " +
          R.err.toExponential(1).replace("e-", "×10⁻").replace(/(\d+)$/, function (m) { return toSup(m); }) + ".";
        btn.textContent = "Show the transform";
      } else {
        paint(imgOut, R.out, N, 1, R.F.signed, palFor(R.F, state.pal));
        drawToCanvas(cOut, N, imgOut, 1, state.pal.gap);
        capOut.textContent = "Output amplitudes, one level";
        readout.textContent = nH + " Hadamard and " + nS + " SWAP gates on " + nq + " qubits (" + n + " per register). " +
          "Coarse block top-left; the other three blocks hold the horizontal, vertical and diagonal detail.";
        btn.textContent = "Apply the inverse circuit";
      }
      cOut.setAttribute("aria-label", capOut.textContent + ". " + readout.textContent);
    }
    function toSup(d) { var m = "⁰¹²³⁴⁵⁶⁷⁸⁹"; return String(d).split("").map(function (x) { return m[+x]; }).join(""); }
    if (select) select.addEventListener("change", function () { state.field = select.value; render(); });
    if (btn) btn.addEventListener("click", function () { state.showInverse = !state.showInverse; render(); });
    document.addEventListener("themechange", function () { state.pal = palettes(); render(); });
    if (window.ResizeObserver) new ResizeObserver(function () { render(); }).observe(cOut);
    render();
    // exposed for automated checks
    root._qwt = { compute: compute, fwd: fwd, N: N };
  }

  function boot() {
    document.querySelectorAll("[data-msfig]").forEach(initHero);
    document.querySelectorAll("[data-qwt-demo]").forEach(initQwtDemo);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  window.Multiscale = { sample: sample, haarPyramid: haarPyramid, compaction: compaction };
})();
