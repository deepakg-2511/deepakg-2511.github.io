# deepakg-2511.github.io

Source of [deepakg-2511.github.io](https://deepakg-2511.github.io/), the academic website of Deepak Gupta (PhD researcher, Computational and Data Sciences, IISc Bangalore).

It is a plain static site: hand-written HTML, one stylesheet, two small scripts, self-hosted fonts. There is no build step, no framework and nothing to install, so GitHub Pages serves the files exactly as they are.

## Publish it on GitHub Pages

The repository `deepakg-2511/deepakg-2511.github.io` already exists and currently holds only a sample `README.md`. A repository with that exact name is served at `https://deepakg-2511.github.io/`.

1. Replace the repository's contents with this folder:

   ```bash
   git clone https://github.com/deepakg-2511/deepakg-2511.github.io.git
   cd deepakg-2511.github.io
   # copy every file and folder from this package in here, including the hidden .nojekyll file,
   # and let it overwrite the old README.md
   git add -A
   git commit -m "New academic website"
   git push origin main
   ```

2. On GitHub, open the repository's **Settings → Pages**. Under *Build and deployment*, set **Source** to *Deploy from a branch*, **Branch** to `main` and the folder to `/ (root)`, then save.

3. After a minute or two the site is live at `https://deepakg-2511.github.io/`. The **Actions** tab shows each deployment.

`.nojekyll` tells GitHub Pages to serve the files as they are instead of running Jekyll on them.

## Preview locally

The pages use root-relative paths (`/assets/...`), so open them through a local web server rather than by double-clicking the HTML files:

```bash
cd deepakg-2511.github.io
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What is where

```
index.html            Home: introduction, multiscale figure, research lines, papers, software, recent news
research/index.html   The research question, each paper in detail, BibTeX, talks
software/index.html   The quantum wavelet transform code, with an in-browser circuit simulation
about/index.html      Biography, education, honours, teaching and service, methods, contact
404.html              Page shown for unknown addresses
assets/css/site.css   All styles (colour and type tokens are at the top)
assets/js/site.js     Theme toggle, copy buttons, optional CV/portrait, contents highlighting, chart tooltips
assets/js/multiscale.js  The two computed figures (hero decomposition and QWT circuit simulation)
assets/fonts/         Self-hosted, subset WOFF fonts and their licences
assets/img/og-card.png   Preview image used when the site is shared on social media
assets/cv/            Put your CV here (see MAINTAINING.md)
tools/                Small Python scripts that regenerate the inline circuit and chart SVGs
sitemap.xml, robots.txt, favicon.svg, favicon-32.png, apple-touch-icon.png
```

How to add papers, news, a CV or a photo is described in [MAINTAINING.md](MAINTAINING.md).

## Credits

- Typefaces: TeX Gyre Pagella and Latin Modern Math (GUST Font License), Instrument Sans (SIL Open Font License). Licence texts are in `assets/fonts/`.
- Benchmark solutions in the figures are the exact solutions stated in Gupta, Pandey and Behera, arXiv:2512.08256. The circuit simulation follows the gate sequence in [multilevel-2D-QWT-pennylane](https://github.com/deepakg-2511/multilevel-2D-QWT-pennylane).
