# Writes chart.svg: the WPIQNN accuracy-vs-parameters chart used inline in research/index.html.
# Run: python3 tools/wpiqnn_chart.py  then paste chart.svg into the <div class="panel chart chart-wrap"> on the research page.
import math
# WPIQNN paper (arXiv:2512.08256), Table 1, heat conduction, eps = 0.15. (mean, std) relative L2 error; trainable params
data = [
  ("Classical PINN", 29521, 1.05, 0.13, "right", False),
  ("PIQNN-I", 97, 4.37e-1, 0.87e-1, "left", False),
  ("PIQNN-II", 115, 2.85e-1, 0.53e-1, "right-low", False),
  ("W-PINN", 1574692, 3.96e-4, 1.3e-4, "above", False),
  ("WPIQNN", 22652, 2.13e-4, 0.43e-4, "right", True),
]
W, H = 640, 372
ml, mr, mt, mb = 66, 26, 18, 54
x0, x1 = 1, 7
y0, y1 = -4, 1
pw, ph = W - ml - mr, H - mt - mb
X = lambda v: ml + (math.log10(v) - x0) / (x1 - x0) * pw
Y = lambda v: mt + (y1 - math.log10(v)) / (y1 - y0) * ph
sup = {"-": "−"}
def p10(e):
    return f'10<tspan dy="-6" font-size="9">{str(e).replace("-", "−")}</tspan>'
o = []
A = o.append
A(f'<svg viewBox="0 0 {W} {H}" role="img" aria-labelledby="wp-ch-t wp-ch-d" xmlns="http://www.w3.org/2000/svg">')
A('<title id="wp-ch-t">Relative L2 error against number of trainable parameters, heat conduction problem with epsilon 0.15</title>')
A('<desc id="wp-ch-d">Log–log scatter of five methods. Classical PINN: 29,521 parameters, error 1.05. PIQNN-I: 97 parameters, error 0.437. '
  'PIQNN-II: 115 parameters, error 0.285. W-PINN: 1,574,692 parameters, error 3.96e-4. WPIQNN: 22,652 parameters, error 2.13e-4.</desc>')
A('<g class="grid">')
for e in range(x0, x1 + 1):
    A(f'<line x1="{X(10**e):.1f}" y1="{mt}" x2="{X(10**e):.1f}" y2="{mt+ph}"/>')
for e in range(y0, y1 + 1):
    A(f'<line x1="{ml}" y1="{Y(10**e):.1f}" x2="{ml+pw}" y2="{Y(10**e):.1f}"/>')
A('</g>')
A(f'<line class="axis-line" x1="{ml}" y1="{mt+ph}" x2="{ml+pw}" y2="{mt+ph}"/>')
for e in range(x0, x1 + 1):
    A(f'<text class="tick" x="{X(10**e):.1f}" y="{mt+ph+20}" text-anchor="middle">{p10(e)}</text>')
for e in range(y0, y1 + 1):
    A(f'<text class="tick" x="{ml-10}" y="{Y(10**e)+4:.1f}" text-anchor="end">{p10(e)}</text>')
A(f'<text class="axis-title" x="{ml+pw/2}" y="{H-8}" text-anchor="middle">Trainable parameters (log scale)</text>')
A(f'<text class="axis-title" x="14" y="{mt+ph/2}" text-anchor="middle" transform="rotate(-90 14 {mt+ph/2})">Relative L² error (log scale)</text>')
for name, n, m, s, pos, hl in data:
    cx, cy = X(n), Y(m)
    lo, hi = max(m - s, 1e-9), m + s
    cls = ' hl' if hl else ''
    A(f'<line class="err{cls}" x1="{cx:.1f}" y1="{Y(hi):.1f}" x2="{cx:.1f}" y2="{Y(lo):.1f}"/>')
    A(f'<line class="err{cls}" x1="{cx-4:.1f}" y1="{Y(hi):.1f}" x2="{cx+4:.1f}" y2="{Y(hi):.1f}"/>')
    A(f'<line class="err{cls}" x1="{cx-4:.1f}" y1="{Y(lo):.1f}" x2="{cx+4:.1f}" y2="{Y(lo):.1f}"/>')
for name, n, m, s, pos, hl in data:
    cx, cy = X(n), Y(m)
    cls = ' hl' if hl else ''
    A(f'<circle class="pt{cls}" cx="{cx:.1f}" cy="{cy:.1f}" r="5.5"/>')
    if pos == "right": tx, ty, anc = cx + 12, cy - 2, "start"
    elif pos == "left": tx, ty, anc = cx - 12, cy - 6, "end"
    elif pos == "right-low": tx, ty, anc = cx + 12, cy + 14, "start"
    else: tx, ty, anc = cx, cy - 26, "middle"
    em = ' font-weight="600"' if hl else ''
    A(f'<text class="lbl" x="{tx:.1f}" y="{ty:.1f}" text-anchor="{anc}"{em}>{name}</text>')
    A(f'<text class="lbl-sub" x="{tx:.1f}" y="{ty+14:.1f}" text-anchor="{anc}">{n:,} params</text>')
    err = f"{m:.3g}" if m >= 0.01 else f"{m:.2e}".replace("e-0", "×10⁻").replace("4", "4")
    A(f'<circle class="hit" cx="{cx:.1f}" cy="{cy:.1f}" r="14" tabindex="0" data-tip="{name}: {n:,} parameters, error {m:.3g} ± {s:.2g}"><title>{name}: {n:,} parameters, relative L2 error {m:.3g} ± {s:.2g}</title></circle>')
A('</svg>')
open('chart.svg', 'w').write("\n".join(o))
print("ok")
