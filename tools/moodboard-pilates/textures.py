"""Génère des textures PBR tuilables (albedo, normal, orm, height) pour le mood board.
ORM : R = occlusion ambiante, G = rugosité, B = métal (convention glTF / three.js).
Usage : python3 -I textures.py <dossier_sortie>  (numpy et Pillow requis)
"""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
N = 1024
fx = np.fft.fftfreq(N)[None, :]
fy = np.fft.fftfreq(N)[:, None]


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def norm01(a):
    a = a - a.min()
    return a / (a.max() + 1e-9)


def gblur(a, s, su=None, ang=0.0):
    """Flou gaussien périodique (FFT), éventuellement anisotrope."""
    if su is None:
        G = np.exp(-2 * math.pi ** 2 * s * s * (fx ** 2 + fy ** 2))
    else:
        c, sn = math.cos(ang), math.sin(ang)
        u = fx * c + fy * sn
        v = -fx * sn + fy * c
        G = np.exp(-2 * math.pi ** 2 * (su * su * u ** 2 + s * s * v ** 2))
    if a.ndim == 3:
        return np.stack([np.real(np.fft.ifft2(np.fft.fft2(a[..., i]) * G)) for i in range(a.shape[2])], -1)
    return np.real(np.fft.ifft2(np.fft.fft2(a) * G))


def noise(rng, s, su=None, ang=0.0):
    return norm01(gblur(rng.standard_normal((N, N)), s, su, ang))


def fbm(rng, s, oct=5, gain=0.5):
    t, amp, tot = 0, 1, 0
    for i in range(oct):
        t = t + amp * (noise(rng, s / 2 ** i) - .5)
        tot += amp
        amp *= gain
    return norm01(t)


def normal_from_height(h, strength):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * .5 * strength
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * .5 * strength
    n = np.stack([-dx, dy, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return n * .5 + .5


def cavity(h, r, k):
    return np.clip(1 - k * np.maximum(gblur(h, r) - h, 0), 0, 1)


def save(name, albedo, height, rough, metal=0.0, ao=None, nstr=4.0, alpha=None, q=86):
    if ao is None:
        ao = np.ones_like(height)
    if np.isscalar(metal):
        metal = np.full_like(height, metal)
    if np.isscalar(rough):
        rough = np.full_like(height, rough)
    def w(a, suffix, qq=q):
        a = np.clip(a, 0, 1)
        Image.fromarray((a * 255 + .5).astype(np.uint8)).save(f'{OUT}/{name}_{suffix}.jpg', quality=qq, optimize=True)
    w(albedo, 'albedo')
    w(normal_from_height(height, nstr), 'normal', 90)
    w(np.stack([ao, rough, metal], -1), 'orm')
    w(height, 'height', 90)
    if alpha is not None:
        w(alpha, 'alpha')
    print('ok', name)


def lerp(a, b, t):
    return a + (b - a) * t[..., None]


# ---------------------------------------------------------------- terrazzo rose
def polygons_wrap(draw, poly, fill):
    for ox in (-N, 0, N):
        for oy in (-N, 0, N):
            draw.polygon([(x + ox, y + oy) for x, y in poly], fill=fill)


def terrazzo(name, size_cm, seed, matrix, chips, sizes_cm, density):
    rng = np.random.default_rng(seed)
    px = N / size_cm
    idimg = Image.new('I', (N, N), 0)
    d = ImageDraw.Draw(idimg)
    cover = np.zeros((N, N), bool)
    cols = [hexrgb(c) for c, _ in chips]
    wts = np.array([w for _, w in chips]); wts = wts / wts.sum()
    chip_col = [np.zeros(3)]
    count = 1
    for (rmin, rmax), n in zip(sizes_cm, density):
        tries = 0
        placed = 0
        while placed < n and tries < n * 12:
            tries += 1
            r = rng.uniform(rmin, rmax) * px
            cx, cy = rng.uniform(0, N, 2)
            k = rng.integers(5, 9)
            angs = np.sort(rng.uniform(0, 2 * math.pi, k))
            elong = rng.uniform(.55, 1)
            rot = rng.uniform(0, math.pi)
            pts = []
            for a in angs:
                rr = r * rng.uniform(.7, 1)
                x, y = math.cos(a) * rr, math.sin(a) * rr * elong
                pts.append((cx + x * math.cos(rot) - y * math.sin(rot), cy + x * math.sin(rot) + y * math.cos(rot)))
            xs = np.clip(np.array([int(cx - r), int(cx + r)]) % N, 0, N - 1)
            ys = np.clip(np.array([int(cy - r), int(cy + r)]) % N, 0, N - 1)
            # rejet si la zone est déjà trop couverte
            sub = cover[np.ix_(np.arange(int(cy - r * .6), int(cy + r * .6)) % N, np.arange(int(cx - r * .6), int(cx + r * .6)) % N)]
            if sub.size and sub.mean() > .12:
                continue
            polygons_wrap(d, pts, count)
            ci = rng.choice(len(cols), p=wts)
            chip_col.append(cols[ci] * rng.uniform(.94, 1.05))
            count += 1
            placed += 1
            cover = np.asarray(idimg) > 0
    ids = np.asarray(idimg).astype(int)
    chip_col = np.array(chip_col)
    m = hexrgb(matrix)
    fine = noise(rng, .7)
    base = m * (0.94 + .1 * fbm(rng, 40, 4))[..., None] * (0.95 + .08 * fine)[..., None]
    # micro-granulats dans la matrice
    speck = noise(rng, .9)
    sp_mask = speck > .82
    sp_col = lerp(base, np.broadcast_to(hexrgb('#f6e9da'), base.shape), (sp_mask * .55).astype(float))
    sp_mask2 = speck < .13
    sp_col = lerp(sp_col, np.broadcast_to(hexrgb('#c46a48'), base.shape), (sp_mask2 * .35).astype(float))
    alb = sp_col
    chipmask = ids > 0
    cc = chip_col[ids]
    stone = (0.9 + .14 * fbm(rng, 6, 4))[..., None]
    alb = np.where(chipmask[..., None], cc * stone, alb)
    # liseré légèrement plus sombre au bord des éclats (ponçage)
    edge = np.clip(gblur(chipmask.astype(float), 1.2), 0, 1)
    border = np.clip(1 - np.abs(edge - .5) * 2, 0, 1) * chipmask
    alb = alb * (1 - .08 * border)[..., None]
    h = .78 + .22 * chipmask - .05 * fine * (~chipmask) + .02 * fbm(rng, 3, 3)
    h = gblur(h, .8)
    rough = np.where(chipmask, .2, .34) + .08 * fbm(rng, 30, 3)
    ao = cavity(h, 3, 3)
    save(name, alb * (0.92 + .08 * ao[..., None]), h, rough, ao=ao, nstr=3)


terrazzo('terrazzo', 40, 7, '#e2b09b',
         [('#f3e3cd', 40), ('#f8f1e6', 16), ('#efc3a0', 13), ('#e3ad5f', 9), ('#d9804f', 8), ('#e7a594', 11), ('#bb5c3c', 3)],
         [(2.6, 3.8), (1.4, 2.4), (.7, 1.3), (.25, .6)], [9, 70, 260, 900])

terrazzo('terrazzo_fin', 30, 11, '#dfae98',
         [('#f3e3cd', 34), ('#f8f1e6', 10), ('#efc3a0', 14), ('#e3ad5f', 13), ('#d9804f', 11), ('#e7a594', 12), ('#bb5c3c', 4)],
         [(.6, 1.0), (.3, .55), (.12, .28)], [90, 600, 2600])

# ---------------------------------------------------------------- béton ciré
def beton(name, col, seed, rough_base, pores=True, size_hint=1):
    rng = np.random.default_rng(seed)
    c = hexrgb(col)
    clouds = fbm(rng, 120, 5)
    t = 0
    masks = [noise(rng, 160) for _ in range(3)]
    for i, ang in enumerate((.3, 1.4, 2.4)):
        t = t + (noise(rng, 7, su=45, ang=ang) - .5) * masks[i]
    t = norm01(t)
    alb = c * (0.9 + .16 * clouds + .035 * (t - .5) + .05 * (fbm(rng, 25, 4) - .5))[..., None]
    alb = alb * (0.97 + .05 * noise(rng, .8))[..., None]
    h = .5 + .25 * (t - .5) + .1 * clouds
    if pores:
        p = noise(rng, 1.2)
        pm = p < .035
        h = h - .35 * gblur(pm.astype(float), .8)
        alb = alb * (1 - .25 * gblur(pm.astype(float), .7))[..., None]
    rough = rough_base + .14 * (t - .5) + .08 * clouds
    ao = cavity(h, 2, 4)
    save(name, alb, norm01(h), rough, ao=ao, nstr=2.5)


beton('beton_cire', '#cbc5ba', 3, .42)
beton('pierre_vasque', '#8e8980', 5, .62)

# ---------------------------------------------------------------- peintures / enduits
def peinture(name, col, seed, rough, stipple=1.0, speck=False, limewash=0.0):
    rng = np.random.default_rng(seed)
    c = hexrgb(col)
    st = noise(rng, 1.6) * .6 + noise(rng, 4) * .4
    lw = fbm(rng, 90, 5)
    alb = c * (0.985 + .03 * (st - .5) + limewash * (lw - .5))[..., None]
    h = st * stipple + .3 * noise(rng, 18)
    if speck:
        s = noise(rng, .6)
        dark = (s < .03).astype(float)
        light = (s > .975).astype(float)
        alb = lerp(alb, np.broadcast_to(hexrgb('#8f5a45'), alb.shape), gblur(dark, .5) * .9)
        alb = lerp(alb, np.broadcast_to(hexrgb('#f3dccb'), alb.shape), gblur(light, .5) * .8)
    r = rough + .05 * (st - .5)
    save(name, alb, norm01(h), r, ao=cavity(norm01(h), 2, 1.5), nstr=1.6)


peinture('peinture_beige', '#e6dac4', 21, .9)
peinture('peinture_rose', '#d8bba8', 22, .88, limewash=.07)
peinture('enduit_rose', '#d6ad98', 23, .74, speck=True, limewash=.05)
peinture('laque_rose', '#d69a86', 24, .38, stipple=.25)
peinture('laque_creme', '#ebe2cf', 25, .36, stipple=.25)
peinture('ceramique_mate', '#f2f0ec', 26, .7, stipple=.8, limewash=.04)

# ---------------------------------------------------------------- chêne clair (plaqué, fil horizontal en x)
def chene(name, seed, light, dark, rough):
    rng = np.random.default_rng(seed)
    y = np.arange(N)[:, None] / N
    dist = fbm(rng, 110, 4) * .45 + noise(rng, 6, su=300, ang=0) * .12
    phase = 2 * math.pi * (41 * y + 1.0 * dist)
    rings = .5 + .5 * np.sin(phase)
    rings = rings ** 3
    late = np.clip((rings - .35) * 2, 0, 1)
    pores = noise(rng, .6, su=26, ang=0)
    pore_m = np.clip((.3 - pores) * 6, 0, 1)
    fiber = noise(rng, 1.1, su=90, ang=0)
    rays = noise(rng, 1.5, su=9, ang=0.02)
    ray_m = np.clip((rays - .8) * 6, 0, 1) * noise(rng, 50)
    t = np.clip(.28 * late * noise(rng, 60) * 1.4 + .35 * (fiber - .5) + .5 * noise(rng, 2.5, su=140, ang=0) - .15 + .12 * fbm(rng, 140, 3), 0, 1)
    alb = lerp(np.broadcast_to(hexrgb(light), (N, N, 3)), np.broadcast_to(hexrgb(dark), (N, N, 3)), t)
    alb = alb * (1 - .22 * pore_m)[..., None]
    alb = lerp(alb, np.broadcast_to(hexrgb(light) * 1.04, alb.shape), ray_m * .5)
    h = .6 + .15 * (fiber - .5) - .35 * pore_m - .05 * late
    h = norm01(h)
    r = rough + .1 * pore_m - .04 * ray_m
    save(name, alb, h, r, ao=cavity(h, 1.5, 2.5), nstr=3)


chene('chene_clair', 31, '#dcc6a4', '#c2a57f', .58)

# ---------------------------------------------------------------- bouclette
def bouclette(name, seed, col):
    # boucles de fil (≈ 3 à 6 mm) en saillie sur un fond tissé plus bas
    rng = np.random.default_rng(seed)
    h = .18 * noise(rng, 2)
    for count, lift in ((1500, .55), (1250, .8), (1000, 1.0)):
        im = Image.new('L', (N, N), 0)
        d = ImageDraw.Draw(im)
        for _ in range(count):
            r = rng.uniform(8, 15)
            cx, cy = rng.uniform(0, N, 2)
            e = rng.uniform(.55, 1)
            a0 = rng.uniform(0, 360)
            span = rng.uniform(260, 360)
            wdt = int(rng.integers(4, 7))
            for ox in (-N, 0, N):
                for oy in (-N, 0, N):
                    if -2 * r < cx + ox < N + 2 * r and -2 * r < cy + oy < N + 2 * r:
                        d.arc([cx + ox - r, cy + oy - r * e, cx + ox + r, cy + oy + r * e], a0, a0 + span, fill=255, width=wdt)
        a = gblur(np.asarray(im).astype(float) / 255, 1.6)
        a = np.clip(a * 1.5, 0, 1) ** .7
        h = np.maximum(h, a * lift)
    h = norm01(h + .03 * noise(rng, 1))
    c = hexrgb(col)
    alb = c * (0.86 + .16 * h)[..., None] * (0.97 + .05 * noise(rng, 40))[..., None]
    ao = cavity(h, 5, 1.2)
    save(name, alb * (.9 + .1 * ao[..., None]), h, .95, ao=ao, nstr=5)


bouclette('bouclette', 41, '#efe6d4')

# ---------------------------------------------------------------- simili-cuir (grain cellulaire)
def worley(rng, cells):
    cs = N / cells
    pts = rng.uniform(0, 1, (cells, cells, 2))
    yy, xx = np.mgrid[0:N, 0:N] / cs
    ci, cj = yy.astype(int), xx.astype(int)
    f1 = np.full((N, N), 9.0)
    f2 = np.full((N, N), 9.0)
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            ii, jj = (ci + di) % cells, (cj + dj) % cells
            p = pts[ii, jj]
            dy = (ci + di + p[..., 0]) - yy
            dx = (cj + dj + p[..., 1]) - xx
            d = np.sqrt(dx * dx + dy * dy)
            f2 = np.where(d < f1, f1, np.minimum(f2, d))
            f1 = np.minimum(f1, d)
    return f1, f2


def cuir(name, seed, col):
    rng = np.random.default_rng(seed)
    f1, f2 = worley(rng, 110)
    crease = np.clip((f2 - f1) * 3, 0, 1)
    f1b, f2b = worley(rng, 37)
    crease2 = np.clip((f2b - f1b) * 4, 0, 1)
    h = crease ** .6 * .7 + crease2 ** .7 * .3 + .05 * noise(rng, .8)
    h = norm01(gblur(h, .7))
    c = hexrgb(col)
    alb = c * (0.82 + .3 * h)[..., None]
    r = .5 + .2 * (1 - h)
    save(name, alb, h, r, ao=cavity(h, 2, 2), nstr=6)


cuir('simili_noir', 51, '#1c1b1a')

# ---------------------------------------------------------------- voilage (toile, fils irréguliers)
def toile(name, seed, col, threads=96):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:N, 0:N] / N
    slub_x = noise(rng, 2, su=200, ang=math.pi / 2)  # variation le long des fils de chaîne
    slub_y = noise(rng, 2, su=200, ang=0)
    wx = np.abs(np.sin(math.pi * threads * x + .4 * (slub_x - .5)))
    wy = np.abs(np.sin(math.pi * threads * y + .4 * (slub_y - .5)))
    thick_x = .45 + .35 * slub_x
    thick_y = .45 + .35 * slub_y
    warp = np.clip((wx - (1 - thick_x)) / thick_x, 0, 1) ** .5
    weft = np.clip((wy - (1 - thick_y)) / thick_y, 0, 1) ** .5
    cx = np.floor(threads * x).astype(int)
    cy = np.floor(threads * y).astype(int)
    over = ((cx + cy) % 2).astype(float)
    h = np.maximum(warp * (.6 + .4 * over), weft * (.6 + .4 * (1 - over)))
    cover = np.clip(np.maximum(warp, weft) * 1.6, 0, 1)
    c = hexrgb(col)
    alb = c * (0.86 + .16 * h)[..., None] * (0.96 + .06 * slub_x)[..., None]
    save(name, alb, h, .93, ao=cavity(h, 1.5, 1.5), nstr=4, alpha=.25 + .75 * cover)


toile('voilage_lin', 61, '#e3dccd', threads=70)

# ---------------------------------------------------------------- assise tissée (corde papier, natte 2x2)
def natte(name, seed, col, grey):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:N, 0:N] / N
    k = 32
    cx = np.floor(k * x).astype(int)
    cy = np.floor(k * y).astype(int)
    fxp = (k * x) % 1
    fyp = (k * y) % 1
    block = ((cx // 2 + cy // 2) % 2)
    horiz = block == 0
    across = np.where(horiz, fyp, fxp)
    along = np.where(horiz, fxp, fyp)
    cord = np.sin(math.pi * across) ** .6
    twist = .5 + .5 * np.sin(2 * math.pi * (along * 3 + across * .8))
    h = cord * (.8 + .2 * twist)
    c = hexrgb(col)
    g = hexrgb(grey)
    fleck = noise(rng, 1.2, su=12, ang=0)
    fleck = np.where(horiz, fleck, noise(rng, 1.2, su=12, ang=math.pi / 2))
    t = np.clip((fleck - .62) * 4, 0, 1)
    alb = lerp(np.broadcast_to(c, (N, N, 3)), np.broadcast_to(g, (N, N, 3)), t * .8)
    alb = alb * (0.75 + .28 * h)[..., None]
    save(name, alb, h, .88, ao=cavity(h, 2, 2), nstr=5)


natte('natte_papier', 71, '#eee6d6', '#8e877b')

# ---------------------------------------------------------------- métal thermolaqué noir (peau d'orange)
def thermolaque(name, seed, col, rough):
    rng = np.random.default_rng(seed)
    op = noise(rng, 5) * .7 + noise(rng, 1.5) * .3
    c = hexrgb(col)
    alb = c * (0.95 + .08 * op)[..., None]
    save(name, alb, op, rough + .06 * (op - .5), ao=None, nstr=1.2)


thermolaque('metal_noir', 81, '#1d1d1e', .55)

# ---------------------------------------------------------------- émail (carreaux)
def email(name, seed, col, rough):
    rng = np.random.default_rng(seed)
    pool = fbm(rng, 60, 4)
    wave = noise(rng, 25)
    c = hexrgb(col)
    alb = c * (0.95 + .08 * pool)[..., None] * (0.98 + .04 * noise(rng, 1))[..., None]
    pin = (noise(rng, .9) < .02).astype(float)
    h = .5 + .4 * (wave - .5) - .3 * gblur(pin, .6)
    save(name, alb, norm01(h), rough + .05 * pool, ao=None, nstr=2)


email('email_blanc', 91, '#f5f3ef', .1)

print('fin')
