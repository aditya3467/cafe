# Cup2Eat — standalone hero prototype

Open `hero-preview.html` over HTTP. From the project root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit **http://127.0.0.1:8000/prototype/hero-preview.html**. All prototype code, vendored libraries, reports and screenshots are confined to `prototype/`. The main website and all existing assets are unchanged. No build or package installation is needed.

## Interaction

- 0–34%: the registered cutout moves from the exact silhouette-bounds centre to the product destination with uniform scale. Left text reveals during 12–32%.
- 34–40%: the canvas reveals the decoded first frame beneath the cup, after movement ends. A soft scene mask blends its opaque background into the independent plate.
- 39–47%: the cutout fades away, aligned to the exact same source-space canvas transform. Frame 1 stays fixed through 48%.
- 48–94%: scroll progress maps to frames 1–239, rounded to the nearest frame. The source's empty lead-in, camera push-in, pouring and finish are preserved.
- 94–100%: hold frame 239. All phases reverse when scrolling upward.

The hero pins for five viewport heights (minimum 3200px) with 0.18-second scrub smoothing. The page below is only a prototype end marker/restart link. `window.heroPreview` exposes phase boundaries, current state, scroll positioning and refresh for inspection; the temporary on-screen debug panel shows displayed/target frame and cache occupancy.

Desktop places text on the left and cup on the right. Mobile stacks text above a separately sized product region; the initial cup still starts at the viewport centre. Both layers retain the original 16:9 registration canvas. CSS transforms scale uniformly. The visible product's registration anchor is `(648,367.5)`, the centre of the extracted alpha bounds `(448,176)–(848,559)`.

GSAP and ScrollTrigger **3.13.0** are stored locally in `vendor/`, with their upstream headers. Download source: jsDelivr's `gsap@3.13.0/dist/` distributions. Implementation API reference: [official ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/). These files are dependencies, not design references; no external layouts or templates were used.

## Loading and canvas

`frame-cache.js` caps the resident decoded cache at 18 ImageBitmaps, with up to three requests/decodes in flight. It retains frame 1, the requested frame and the displayed frame while evicting older entries. It prioritizes the exact target, nine frames ahead and three behind according to scroll direction; queued priorities reset after target/direction changes. It does not fetch the entire sequence at initialization (initial window: frames 1–10).

Canvas pixels are changed only when a newly requested frame is available. Missing/loading frames retain the last rendered image; callbacks never draw obsolete targets. On reversal into the handoff, cached frame 1 is restored before the cutout returns. Failed requests are marked and reported; they are not retried repeatedly. Reload the page to retry a failed frame. Cache eviction explicitly closes ImageBitmaps. Page exit disposes the cache and trigger.

An 18-frame RGBA cache represents roughly 63 MiB of pixel data, plus up to three transient decodes, canvas, poster/background and browser overhead. PNG transfer volume is unchanged. This is a bounded prototype loader, not a guarantee of perfect frame delivery over slow networks. The canvas keeps its native 1280 × 720 backing resolution instead of allocating a larger high-DPR buffer without extra source detail.

Reduced-motion preference shows the centred static empty cup without pinning. JavaScript/library failure retains image markup; JavaScript is required for the intended interaction.

## Browser validation

Tested in local headless Google Chrome over HTTP at **1440 × 900** and **390 × 844**. Captured evidence is in `screenshots/`; numeric results are in `browser-validation.json` and `resilience-validation.json`.

- Both sizes: initial, movement, destination, handoff, pour start, middle, final hold, reverse pour, reverse handoff and return to initial state passed. Hero stayed pinned at y=0; no horizontal overflow.
- Handoff rectangle differences: x=0, y=0, width=0, height=0 CSS pixels at both sizes. Screenshots show one aligned cup, without a displaced duplicate.
- Middle sample: displayed frame 125 at 72%; final hold: frame 239 at 97%; reverse sample: frame 89 at 65%; reverse handoff returns to frame 1.
- Rapid forward/backward scroll jumps settled on the correct final target. Peak resident cache: 18 at each size; no blanking was observed.
- Normal pass: **zero JavaScript/console errors and zero failed HTTP requests**. Local libraries and sampled cleaned PNGs loaded successfully.
- Throttled test (150ms latency, 1.2 MB/s): target 125 retained frame 1 while pending, then rendered frame 125. One measured jump took about 2.84 seconds to settle, including loading and scrub; this is a local simulation, not a phone benchmark.
- Deliberately failed frame 125: last valid frame 1 remained visible and a status notice appeared. The resulting request failure/warning is expected in this separate fault-injection test, not a normal-load error.
- Reduced motion: zero ScrollTriggers/pins; static preview. Mid-pour resize from desktop to mobile retained a rendered frame and switched to the mobile geometry without horizontal overflow.

Reproducible Chrome DevTools Protocol checks are in `tests/`. Start a local Chrome headless instance with `--remote-debugging-port=9222` and a separate temporary `--user-data-dir`, then run `node prototype/tests/browser-check.mjs` or `node prototype/tests/resilience-check.mjs` while the HTTP server is running. They require Node with built-in WebSocket support and save evidence inside this prototype. Run sequentially against an otherwise unused debug tab. The resilience check deliberately fails one image request and changes network/media emulation before restoring normal settings.

## Visual limits

The source cup is only about 400px wide, so its enlarged starting state exposes source softness and matte-edge limitations. No product deformation or source upscaling asset was introduced. The reconstructed plate has smoother tabletop detail and different lighting/horizon placement from the sequence; a gradual masked reveal reduces the discontinuity but cannot produce an invisible photographic match. The source shadow fades in with the full scene during handoff because the separate cutout has no shadow.

Later source frames move closer and cut off the cup's base. The canvas keeps the recorded aspect ratio and composition; a soft lower edge blends that existing crop into the background, and the cup's body/rim remain visible. This is not a complete uncropped filled-cup finish. The incoming stream also fades at the scene's upper edge. Mobile shows visible background/horizon variation between the plate and source viewport. Final production polish needs a better background plate/matte or an intentional art-directed scene transition, an uncropped ending if required, and physical-device testing. No main-site integration has been performed.
