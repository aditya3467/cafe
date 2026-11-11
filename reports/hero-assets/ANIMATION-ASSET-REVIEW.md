# Cup2Eat animation asset review

This preparation stage adds reports and contact sheets only. Existing application files and source assets are unchanged. No cutout, background removal, WebP conversion or scroll animation has been performed.

## Visual inspection

[Contact sheet](contact-sheet.png): regular 20-frame samples starting at frame 1, plus the exact middle (120) and final frame (239). [Detail sheet](detail-sheet.png): early stream onset and late finish samples. The first, middle and final originals were also inspected at full 1280 × 720 resolution.

- Frame 1: complete empty cup, chocolate interior/rim, fine irregular waffle silhouette. Approximate bounds `(448,176)–(850,558)`; centre `(649,367)`. Its detached soft shadow is outside these bounds.
- Frame 120: coffee pouring into a largely filled cup. Approximate visible bounds `(348,176)–(940,720)`. Bottom is outside the recorded image.
- Frame 239: filled coffee surface, steam and no visible stream in the inspected final image. Approximate visible bounds `(280,168)–(1000,720)`. Bottom remains cropped.
- The cup stays near x=640–650 (50% of frame width). Its visible width grows from about 402 to 720 pixels, approximately 1.8×. The rim top stays near y=170–180 while the base moves downward and eventually leaves the image. In these samples, cropping is present by frame 101; exact first clipped frame was not determined.
- This is an apparent camera push-in/zoom with perspective/composition changes, not just filling a stationary cup. The tabletop/background boundary shifts downward, the shadow changes, and light/particles/steam evolve. Generative shape changes may also contribute; the images alone cannot establish a physical camera path.
- Frame 21 is still empty with no stream; frame 31 shows incoming coffee. Exact first stream frame lies within 22–31 and needs frame-by-frame review during timing implementation. Late droplets are visible through frame 221; frame 239 provides a visibly stream-free finish. Do not jump directly from frame 1 to frame 41.
- The star artifact remains near `(1160,600)` in the inspected samples (roughly x=1135–1185, y=575–625). It belongs to the opaque image. No removal was performed. A small rectangular crop would sacrifice scene content and may change framing; it is not a transparent overlay that can simply be hidden independently.

[Bounds CSV](cup-bounds.csv) records visually estimated cup-only bounds throughout the representative samples. Coordinates are source pixels, measured approximately from visual inspection (allow ±12–20 pixels); they exclude stream, particles, steam, and shadow. Bottom=720 for a clipped cup is the visible image boundary, not its actual base. These are layout estimates, not production alpha masks or per-frame tracking data.

## Cutout suitability

No transparent cup cutout exists. Frame 1 is the best matching source for creating one because it exactly matches Layer B's initial state, includes the entire cup, and has no coffee stream. Use its existing pixels, including the chocolate-lined interior. The image has enough contrast for a carefully traced matte, but dark rim edges and fine waffle protrusions need manual edge review. Automatic removal is not assumed safe.

A future derivative should retain the source 1280 × 720 registration canvas, with only the cup opaque; store a separate tight-bounds manifest if a trimmed export is also needed. Preserve edge antialiasing, do not erode protrusions, and inspect on cream, caramel, and espresso backgrounds at 100% and 200%. Compare against frame 1 for lost texture, halos and silhouette displacement. Keep the original unchanged. The source cup is only about 402 × 382 pixels: enlarging it to a dominant viewport size will soften detail. A cutout does not create additional resolution.

## Two independent animation layers

Recommended future structure (a design proposal, not active markup):

```text
hero stage — fixed/pinned only during the future scroll sequence
  environment — espresso background, with separately controlled light/shadow
  layer B — canvas showing the full original sequence in a right-hand viewport
  layer A — transparent frame-1 cup above the canvas
  left content — above the environment, outside the sequence viewport
```

Layer A begins at the viewport centre, enlarged within the source-resolution limits. GSAP transforms its own wrapper toward the right and reduces its scale. Layer B stays on frame 1, invisible, while A moves. Their transforms are independent; do not move the same wrapper containing both layers. The full-scene canvas should occupy a deliberate right-hand viewport; a fullscreen canvas would put the recorded cup back near the page centre and conflict with the requested layout.

### Registered handoff to frame 1

1. Decode and draw frame 1 in the canvas before revealing it. Keep the static poster fallback if loading fails.
2. Set Layer A's final position and scale using exactly the same source-to-screen mapping as the canvas. With canvas CSS scale `s` and image offset `(ox,oy)`, the cup centre is `(ox + 649s, oy + 367s)` and its initial box is approximately `402s × 382s`. A tight-cropped cutout also needs its `(448,176)` source offset restored. Full-size transparent registration avoids this extra offset.
3. Align identical frame-1 pixels while holding both layers still. Reveal B beneath A, then fade A out without advancing frames. Do not crossfade two differently scaled cups; that produces double edges. Make this phase reversible for backward scroll.
4. Reveal B's background gradually during the approach to the handoff, with a clipped viewport/soft outer scene edge where appropriate. After A is fully gone, scrub B from frame 1 through the sequence, including its short empty lead-in. Natural source camera growth continues inside the right-hand viewport.
5. Hold frame 239 for the finish. It cannot provide a full uncropped filled cup. A complete filled-cup ending would require a matching additional source asset or different footage.

Pixel registration can make the **cup** handoff seamless. A perfectly unchanged **background** is not currently achievable with an isolated cup over a flat espresso color: frame 1 includes a glow, tabletop and shadow. For an exact environment match throughout the move, a separately prepared cup-free frame-1 background plate is required; none exists. Until then, a gradual scene reveal is an intentional transition, not a guaranteed invisible replacement. Do not keep the original full frame behind the moving cutout, which would expose a second stationary cup.

The recorded push-in and final crop mean the filled cup will grow within its viewport. Allow this as the cinematic finish or revise the viewport transform with measured tracking later. Do not pretend one frame-1 box remains valid through all 239 images. Mobile needs a separate stacked composition; forcing the desktop right column onto a 390px viewport would make the product too small.

## WebP conversion strategy — no conversions run

The existing `cwebp` encoder is available locally (version 1.6.0). First run a small pilot on frames 1, 41, 120, 201 and 239 into a new `assets/derived/coffee-webp-pilot/` directory. Compare quality 80, 85 and 90 using method 6, keeping 1280 × 720 and the original stems. Compare against a lossless pilot where useful. Example for a future pilot only:

```sh
cwebp -q 85 -m 6 Coffee_pouring_into_waffle_cup_0f483f6d_frames/frame_000001.png -o assets/derived/coffee-webp-pilot/frame_000001-q85.webp
```

Choose quality by inspecting waffle edges, rim reflections, fine particles, crema and dark-gradient banding at display size and full resolution. Check successive samples for compression flicker. Measure byte savings and browser decode time on a representative phone before choosing the setting. No size-saving percentage is asserted before measurement. Conversion preserves baked-in artifacts and camera motion.

Once quality is selected, export all 239 files to a separate versioned derived directory; never write into the PNG directory. Require an empty destination or skip existing outputs, and verify count, numbering, dimensions and decode success. Keep the PNG manifest/fallback and an explicit WebP manifest. Do not silently switch source extensions before outputs have passed verification. Lower-resolution derivatives may be evaluated separately after mobile framing is chosen; do not upscale the originals.

WebP lowers transfer bytes, but decoded pixels still cost about 3.52 MiB/frame at 1280 × 720 RGBA. All 239 would consume approximately 840 MiB. Use a bounded, direction-aware decoded cache (initial target 12–24 frames, about 42–84 MiB), limited concurrent fetch/decode, bitmap release on eviction, and a persistent first-frame fallback. Tune the cache on mobile. Draw only when the requested frame or size changes; avoid upscaling the canvas backing store beyond useful source detail. Under rapid scrub, retain the last valid frame while the target loads, reprioritize requests, and avoid blanking the canvas. Test reverse scrolling and cache misses before settling the preload window.

## Browser test

Tested the actual local page with headless Google Chrome over HTTP at `http://127.0.0.1:8000/`.

| Check | Result |
| --- | --- |
| Desktop viewport | 1440 × 900; hero stage 900px high |
| Mobile viewport | 390 × 844; hero stage 844px high |
| HTML, both CSS files, main.js and hero-animation.js | HTTP 200; correct MIME types |
| First-frame image | HTTP 200; decoded to 1280 × 720 |
| Sequence module | Dynamic import succeeded; first and last generated URLs returned 200 |
| Representative contact-sheet frames | All decoded successfully over HTTP |
| JavaScript runtime exceptions | None observed |
| Console errors | One network error: automatic `/favicon.ico` request returns 404 |
| Horizontal overflow | None at either tested size |
| Canvas | Hidden as intended; no animation active |

[Desktop screenshot](hero-desktop.png), [mobile screenshot](hero-mobile.png), and [raw browser results](browser-results.json) are included. The sequence-module URL check was a separate browser evaluation after the raw capture.

The current desktop poster is letterboxed vertically by 45px at each edge. On mobile the complete 16:9 scene is 390 × 219px, centred vertically, leaving large empty areas; the cup is approximately 122px wide. Paths and CSS work, but this static source preview does not yet deliver the oversized isolated-cup hero. No final animation, cutout handoff, WebP decode, physical-device performance or scroll behavior has been tested because those are not implemented in this stage. The favicon error is reported without changing existing application files.
