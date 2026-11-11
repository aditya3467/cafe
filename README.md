# Cup2Eat

Original HTML, CSS and vanilla JavaScript homepage with a scroll-synchronised edible-waffle-cup hero, a native-MP4 cinematic continuation, and **The Edible Coffee Experience** section. The validated standalone prototype remains unchanged at `prototype/hero-preview.html`.

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
css/cinema.css             Film scenes, controls and brand reveal
js/main.js                 Initialization and accessible section navigation
js/cinema.js               Camera continuation and native MP4 scene lifecycle
js/hero-animation.js       Registered movement, handoff, scroll phases, CTA
js/frame-cache.js          Bounded ImageBitmap loading and eviction
js/frame-sequence.js       Validated cleaned-frame paths and source manifest
assets/derived/hero/       Existing cutout, plate, composite and clean sequence
assets/videos/             Original sipping.mp4 and crack-eat.mp4
prototype/                 Unmodified standalone reference and dependencies
reports/homepage/          Homepage integration findings and screenshots
reports/cinema/            Video compatibility, validation and screenshots
tests/                     Homepage browser checks
```

The main hero preserves the prototype's geometry, easing, source registration, phases and cache algorithm. The cup begins centred and enlarged; it moves to the product destination as copy appears; frame 1 aligns with it before the cutout fades; scrolling then scrubs the 239-frame sequence. Reverse scrolling restores earlier states. The final CTA appears during the filled-cup hold and leads to the next section. Mobile uses a stacked composition.

The production loader holds at most 20 resident ImageBitmaps on desktop and 12 on mobile, with three downloads and two decodes in flight. It predicts upcoming requests, retains bounded compressed bytes for reverse playback, and presents the nearest valid frame while the exact target loads. It keeps the last valid canvas image while loading. It never preloads all 239 frames at startup. Reduced motion presents a static cup with visible copy/CTA, no scroll pinning and no frame-sequence requests. Native links and a static layout remain available without JavaScript; a skip link bypasses the long hero.

## Cinematic continuation

After the original hero completes, an additional scroll range pushes toward its filled cup. A brief warm-brown occlusion changes to the first decoded frame of `sipping.mp4`. Native playback finishes the coffee, then changes to `crack-eat.mp4`, and finally reveals **DRINK IT. CRACK IT. EAT IT.** GSAP controls camera/scene transitions; the videos remain MP4 and are not converted to frame sequences. The original hero phases keep their original scroll distances.

IntersectionObserver and document visibility manage playback. Inactive films pause, while playback completion gates later scenes so a rapid scroll within the stage does not cut off an action. Scrolling backwards returns to earlier scenes; the films play forward from the selected scene. Pause/play and replay controls are available. Leaving the whole stage pauses playback and does not trap scrolling. The navigation and final CTA still lead to the edible-experience section.

The first film is warmed near the hero finish; the second prepares after the first is decodable. The source image stays visible until the incoming film has a decodable frame. There are no MP4 requests at initial page load. Under reduced motion, both videos appear in ordinary flow with native controls, no autoplay or cinematic camera movement. They load near visibility and pause offscreen. No video frames were extracted; inspection and evidence use normal browser playback/seek and page screenshots.

See the [cinematic implementation report](reports/cinema/CINEMATIC-REPORT.md) for compatibility findings, screenshots, behavior and validation limits. The supplied MP4s contain visible star marks; those baked-in marks remain because the videos are preserved unchanged.

## Assets and design boundaries

The original 239 PNGs are preserved. Main animation uses the approved 1280 × 720 Q85 WebP derivatives in `assets/derived/hero/frames-webp-q85/`, with the original cleaned PNG directory retained for fallback and rollback. The prototype retains its original PNG loader unchanged. The 1280 × 720 registered cutout and independent background plate are also referenced in place. There are no separate product photographs in the current working tree, so the next section reuses the existing registered cup composite. No unrelated stock imagery, prices, business details, menus or testimonials were added.

The cup source is approximately 400px wide and softens when enlarged. The reconstructed plate differs from the sequence background; the existing soft scene reveal mitigates that difference. Late frames crop the filled cup at the bottom. These inherited prototype limitations remain; integration does not create missing source detail.

## Review and validation

See [homepage integration report](reports/homepage/INTEGRATION-REPORT.md), [browser results](reports/homepage/browser-validation.json), [accessibility/reduced-motion results](reports/homepage/accessibility-validation.json), and screenshots in `reports/homepage/screenshots/`.

Earlier asset findings remain in [animation asset review](reports/hero-assets/ANIMATION-ASSET-REVIEW.md), [derivative quality control](assets/derived/hero/ASSET-QC.md), and [standalone prototype documentation](prototype/README.md). Prototype files and original/prepared assets are checksum-verified unchanged during integration.

## Production hero performance

The approved Q85 sequence is 7.23 MB versus 141.99 MB for the cleaned PNG sequence. See [root cause, full measurements and screenshots](reports/performance/PERFORMANCE-REPORT.md) and [manual deployment / rollback instructions](reports/performance/DEPLOYMENT.md). No deployment was performed. The production-matched fixture applies only the three hero JavaScript modules and WebP assets; it does not publish unrelated pending cinematic homepage changes. Severe cold-network throttling still skips frames and is documented in the report.
