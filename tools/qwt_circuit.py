# Writes circuit.svg: the 2D Haar QWT circuit used inline on the home and software pages.
# Run: python3 tools/qwt_circuit.py  then paste circuit.svg into the <div class="circuit-scroll"> blocks.
# Generates the inline SVG circuit for the 2D Haar QWT from the repo's gate sequence.
n = 3
wires = [f"x{i}" for i in range(n)] + [f"y{i}" for i in range(n)]
def qhaar_1d(ws):
    ops = [("H", ws[-1])]
    for i in reversed(range(len(ws) - 1)):
        ops.append(("SWAP", ws[i], ws[i + 1]))
    return ops
lvl1x, lvl1y = qhaar_1d(wires[:n]), qhaar_1d(wires[n:])
lvl2x, lvl2y = qhaar_1d(wires[1:n]), qhaar_1d(wires[n + 1:])
# columns: pair x-op and y-op that act in parallel
cols = [(a, b, 1) for a, b in zip(lvl1x, lvl1y)] + [(a, b, 2) for a, b in zip(lvl2x, lvl2y)]

dy, top, left = 36, 42, 46
y = {w: top + i * dy + (14 if i >= n else 0) for i, w in enumerate(wires)}
enc_x0, enc_x1 = left + 12, left + 92
col_x = []
x = enc_x1 + 46
for i, c in enumerate(cols):
    if i > 0 and cols[i - 1][2] != c[2]:
        x += 34
    col_x.append(x); x += 54
right = x + 4
W = right + 118
H = y[wires[-1]] + 44
out = []
A = out.append
A(f'<svg viewBox="0 0 {W} {H}" role="img" aria-labelledby="qwt-c-title qwt-c-desc" xmlns="http://www.w3.org/2000/svg">')
A('<title id="qwt-c-title">Circuit for two levels of the 2D Haar quantum wavelet transform on 3 + 3 qubits</title>')
A('<desc id="qwt-c-desc">Six wires, x0 to x2 for the row index and y0 to y2 for the column index, start from an amplitude-encoded state. '
  'Level 1 applies a Hadamard gate to x2 and y2, then SWAP gates x1–x2 and x0–x1 on the row register and y1–y2 and y0–y1 on the column register. '
  'Level 2 repeats the pattern on x1, x2 and y1, y2: a Hadamard on x2 and y2, then SWAPs x1–x2 and y1–y2.</desc>')
for w in wires:
    A(f'<line class="wire" x1="{left}" y1="{y[w]}" x2="{right}" y2="{y[w]}"/>')
    sub = w[1]
    A(f'<text class="wl" x="{left-10}" y="{y[w]+5}" text-anchor="end">{w[0]}<tspan baseline-shift="sub" font-size="11">{sub}</tspan></text>')
# encoding box
A(f'<rect class="enc" x="{enc_x0}" y="{y[wires[0]]-16}" width="{enc_x1-enc_x0}" height="{y[wires[-1]]-y[wires[0]]+32}" rx="4"/>')
mid = (y[wires[0]] + y[wires[-1]]) / 2
A(f'<text class="enc-t" x="{(enc_x0+enc_x1)/2}" y="{mid-6}" text-anchor="middle">amplitude</text>')
A(f'<text class="enc-t" x="{(enc_x0+enc_x1)/2}" y="{mid+11}" text-anchor="middle">encoding</text>')
# stage boxes
for lv in (1, 2):
    xs = [cx for cx, c in zip(col_x, cols) if c[2] == lv]
    x0, x1 = xs[0] - 24, xs[-1] + 24
    A(f'<rect class="stage" x="{x0}" y="{top-30}" width="{x1-x0}" height="{H-top+12}" rx="4"/>')
    A(f'<text class="stage-t" x="{x0+6}" y="{top-17}">Level {lv}</text>')
def gate(op, cx):
    if op[0] == "H":
        yy = y[op[1]]
        A(f'<rect class="gate" x="{cx-13}" y="{yy-13}" width="26" height="26" rx="3"/>')
        A(f'<text class="gate-t" x="{cx}" y="{yy+5}" text-anchor="middle">H</text>')
    else:
        y1, y2 = y[op[1]], y[op[2]]
        A(f'<line class="swap" x1="{cx}" y1="{y1}" x2="{cx}" y2="{y2}"/>')
        for yy in (y1, y2):
            A(f'<path class="swap" d="M{cx-6} {yy-6} L{cx+6} {yy+6} M{cx+6} {yy-6} L{cx-6} {yy+6}"/>')
for cx, (a, b, lv) in zip(col_x, cols):
    gate(a, cx); gate(b, cx)
# register brackets
for reg, ws in (("row", wires[:n]), ("column", wires[n:])):
    y0, y1 = y[ws[0]] - 10, y[ws[-1]] + 10
    bx = right + 12
    A(f'<path class="grp" d="M{bx} {y0} h6 V{y1} h-6"/>')
    A(f'<text class="grp-t" x="{bx+14}" y="{(y0+y1)/2-2}">{reg}</text>')
    A(f'<text class="grp-t" x="{bx+14}" y="{(y0+y1)/2+13}">register</text>')
A('</svg>')
open('circuit.svg', 'w').write("\n".join(out))
print(W, H, len(cols))
