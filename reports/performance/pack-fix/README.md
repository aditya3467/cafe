# Remaining live WebP lag — correction

The live modules were fetched and compared with the local code. The site was already using WebP; stale PNG mapping was not the remaining cause. The live trace still missed 211 of 272 target episodes, displayed 82 distinct frames during the test, and requested both cinematic MP4s during the pouring phase.

## Changes

- `js/frame-cache.js`: download 15 compressed packs instead of 239 individual files, sharing each downloaded pack between its component frames. Keep the 20-desktop/12-mobile decoded-frame budget, two decode workers and three downloads. Progressively prefetch the small compressed packs; do not decode all frames. Retain individual WebP/PNG fallback if a pack is missing.
- `js/frame-sequence.js`: embed the pack byte-offset index, preserving `/cafe/` relative paths without an extra index request.
- `js/hero-animation.js`: defer cinematic MP4 warming until the filled frame is rendered. Version the child-module imports for rollout cache safety.
- `assets/derived/hero/frames-webp-q85/packs/`: 15 binary packs plus manifest. All 239 slices were checked byte-for-byte against the approved WebP images. No re-encoding, original-asset change, CSS change or choreography change.

## Focused results

Network simulation: 650ms latency, 8Mbps throughput. Same timed scrolling trace, including forward and rapid reverse movement. Mobile is 390×844 with 4× CPU throttling; desktop is 1440×900.

| Desktop, cold high-latency | Individual WebPs | Packed delivery |
| --- | ---: | ---: |
| Unique frames actually displayed | 41 | 180 |
| p95 interval between draws | 749ms | 51ms |
| Target episodes missed | 92.5% | 28.5% |

Packed mobile under that same high-latency simulation displayed 169 unique frames; p95 draw interval was 51ms. Cold high-latency loading can still skip frames; this is an improvement, not a frame-perfect slow-network guarantee. These are local network simulations, not measurements of a deployed new fix.

Normal-network packed tests: desktop had zero missed target episodes; mobile had 4.7% missed episodes in the aggressive CPU/rapid-scroll trace. All 239 source frames decoded successfully. Both downloaded 15 packs (7.23MB total payload), had no failed requests or console errors, and stayed within cache/concurrency budgets. Pixel/frame data, GSAP `scrub: .18`, cup movement and source aspect ratio are unchanged.

Evidence is in `../webp-before-desktop-cdn-cold.json`, `../packed-main-*-cdn-cold.json`, `../packed-main-*-normal-cold.json` and matching PNG screenshots. `before-*.js` in this directory preserves the previously deployed WebP implementation. Unit checks cover cache limits, no duplicate concurrent decode, stable-target behavior and fallback.

## Manual deployment — nothing was pushed

The runtime change requires **all three JavaScript files and the packs folder**. Uploading only JavaScript will fall back to individual files and retain much of the lag.

From the repository, review and deploy using the existing master/GitHub Pages workflow:

```sh
git add js/frame-cache.js js/frame-sequence.js js/hero-animation.js assets/derived/hero/frames-webp-q85/packs
git diff --cached --stat
git commit -m "Fix hero stalls with packed frame delivery"
git push origin master
```

Those commands are instructions only; they were not executed. Wait for the existing Pages deployment to finish, then hard-reload the homepage. Network requests should show `pack_000.bin` through `pack_014.bin` and no MP4 fetch before pouring finishes. The individual approved WebPs and original PNGs remain in the repository for fallback/rollback. Roll back by reverting this performance commit through the same deployment workflow.
