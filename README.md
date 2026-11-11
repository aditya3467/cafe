# Cup2Eat

Original HTML, CSS and vanilla JavaScript homepage with a scroll-synchronised edible-waffle-cup hero and **The Edible Coffee Experience** section. The validated standalone prototype remains unchanged at `prototype/hero-preview.html`.

## Local preview

From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000/**. Use HTTP rather than `file://` for JavaScript modules. No build step or installation is required. GSAP and ScrollTrigger 3.13.0 load once each from the existing `prototype/vendor/` files, without CDN/network dependencies.

## Main project

```text
index.html                 Homepage markup, navigation, hero, next section
css/style.css              Hero and editorial section styles
css/responsive.css         Mobile composition and reduced-motion styles
js/main.js                 Initialization and accessible section navigation
js/hero-animation.js       Registered movement, handoff, scroll phases, CTA
js/frame-cache.js          Bounded ImageBitmap loading and eviction
js/frame-sequence.js       Validated cleaned-frame paths and source manifest
assets/derived/hero/       Existing cutout, plate, composite and clean sequence
prototype/                 Unmodified standalone reference and dependencies
reports/homepage/          Integration findings, browser results, screenshots
tests/                     Homepage browser checks
```

The main hero preserves the prototype's geometry, easing, source registration, phases and cache algorithm. The cup begins centred and enlarged; it moves to the product destination as copy appears; frame 1 aligns with it before the cutout fades; scrolling then scrubs the 239-frame sequence. Reverse scrolling restores earlier states. The final CTA appears during the filled-cup hold and leads to the next section. Mobile uses a stacked composition.

The cache holds at most 18 resident ImageBitmaps and permits three requests/decodes in flight, prioritising the target and nearby frames by direction. It keeps the last valid canvas image while loading. It never preloads all 239 frames at startup. Reduced motion presents a static cup with visible copy/CTA, no scroll pinning and no frame-sequence requests. Native links and a static layout remain available without JavaScript; a skip link bypasses the long hero.

## Assets and design boundaries

The original 239 PNGs are preserved. Main animation uses `assets/derived/hero/frames-clean/` directly; no sequence was copied or converted. The 1280 × 720 registered cutout and independent background plate are also referenced in place. There are no separate product photographs in the current working tree, so the next section reuses the existing registered cup composite. No unrelated stock imagery, prices, business details, menus or testimonials were added.

The cup source is approximately 400px wide and softens when enlarged. The reconstructed plate differs from the sequence background; the existing soft scene reveal mitigates that difference. Late frames crop the filled cup at the bottom. These inherited prototype limitations remain; integration does not create missing source detail.

## Review and validation

See [homepage integration report](reports/homepage/INTEGRATION-REPORT.md), [browser results](reports/homepage/browser-validation.json), [accessibility/reduced-motion results](reports/homepage/accessibility-validation.json), and screenshots in `reports/homepage/screenshots/`.

Earlier asset findings remain in [animation asset review](reports/hero-assets/ANIMATION-ASSET-REVIEW.md), [derivative quality control](assets/derived/hero/ASSET-QC.md), and [standalone prototype documentation](prototype/README.md). Prototype files and original/prepared assets are checksum-verified unchanged during integration.
