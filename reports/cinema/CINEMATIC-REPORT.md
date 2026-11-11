# Cup2Eat — cinematic continuation

The homepage now continues from the filled hero cup into the two supplied MP4s and ends with **DRINK IT. CRACK IT. EAT IT.** The standalone prototype, all images and both original MP4s remain unchanged.

## Compatibility findings — inspected before implementation

Used normal browser video decoding and seeking to inspect the opening/closing compositions. No video-to-image extraction, transcoding or frame sequence was created. [Source comparison](screenshots/source-compatibility.png) is a screenshot of a browser page containing the existing hero PNG and live video elements, not extracted video assets. [Video metadata](video-metadata.json) records the inspected media dimensions and times.

| Source | Actual dimensions / duration | Composition |
| --- | --- | --- |
| Clean hero frame 239 | 1280 × 720 PNG | Filled close-up; lower cup cropped; no hand; dark tabletop/background |
| Sipping opening | 1280 × 720; 5.041667s | Smaller, nearly complete filled cup, held by a hand on a differently textured tabletop; changed rim shape and perspective |
| Sipping closing | Same MP4 | Empty chocolate-lined cup in a hand; lower cup cropped; different angle from the next clip |
| Crack-and-eat opening | 1280 × 720; 8.042667s | Empty cup tilted toward the camera with two hands; changed framing/person/background |

The waffle/chocolate material cues and warm brown palette are compatible. Geometry, scale, hands, camera angle, coffee surface and tabletop are not identical. An unoccluded morph or direct crossfade would expose a displaced/doubled cup and would not be an honest seamless match. Both original videos also contain visible lower-right star marks, unlike the cleaned hero sequence.

**Chosen transition:** push toward the hero cup's rim, then briefly cover the scene with an espresso/caramel occlusion. Switch to the decoded incoming shot only while completely covered, then uncover. Use the same warm treatment between the empty-cup ending of sipping and the changed empty-cup shot in crack-and-eat. This creates an intentional cinematic edit without showing two cups at once; it does not claim photographic identity between sources. The cover is a deliberate warm-brown transition, not a black media flash.

## Implementation

- `js/cinema.js`: scene controller, readiness promises, native video playback, IntersectionObserver, document-visibility handling, pause/play, replay and reverse-scene navigation.
- `css/cinema.css`: desktop film stage, separate mobile crop/layout, controls, warm occlusion and final brand reveal. The initial overlay is transparent so the existing hero remains visible.
- `index.html`: supplied MP4 video elements, brief scene headings, playback controls, and final brand/CTA. Videos stay at their original paths and format. No unrelated imagery or new product claims.
- `js/main.js`: creates the continuation controller and passes it into the existing hero module.
- `js/hero-animation.js`: small continuation hook after the original hero distance. Original geometry, handoff, frame mapping, ImageBitmap cache and reverse behavior are retained. Existing GSAP/ScrollTrigger distributions are reused once each.

### Scroll and playback

The original hero still occupies its original five-viewport/minimum-3200px scroll range. A six-viewport/minimum-4800px continuation extends the same pinned stage, avoiding a second scrolling cup copy at a section boundary. Its opening 20% pushes the existing frame-239 canvas toward the rim while fading the left copy. The filled frame must actually be rendered before the film stage can advance.

At 22%, the ready sipping shot is introduced. The video plays natively in real time; it is not scrubbed frame-by-frame. Its `ended` event opens crack-and-eat, whose `ended` event opens the brand reveal. A visitor can stop scrolling to watch the full chain. A fast jump late within the stage still starts with sipping and does not skip unfinished actions. Ordinary scrolling/navigation can leave the stage at any time; there is no scroll trap. Leaving the stage pauses playback, and reentering resumes an active unfinished film.

Reverse scrolling below the later-scene thresholds restores/restarts crack-and-eat or sipping; reversing through the camera intro returns to the held hero and then the earlier pouring frames. Video footage itself continues to play forward. The replay control restarts the story, and pause/play is available. Seeks for a replay/reverse entry occur behind the fully opaque transition; an incoming frame is ready before uncovering.

### Readiness and lifecycle

No MP4 requests occur at initial load. Near hero progress 85%, the first video warms; once its first frame is decodable, the second prepares. A `loadeddata`/`HAVE_CURRENT_DATA` gate requires a decodable current frame rather than metadata alone. The outgoing valid cup image/film stays visible while loading. Only one film layer is visible, and only one video may play. IntersectionObserver and document visibility pause inactive/background playback. Muted inline playback includes a play-button fallback if the browser rejects autoplay.

Reduced-motion mode does not move the camera, pin the film scenes or autoplay. Both videos stay in ordinary document flow with native controls, followed by the static brand message. They prepare near visibility and pause when offscreen. The markup is also usable without JavaScript.

Desktop retains the full video aspect ratio in a centred film window. Mobile uses a separate central crop and places scene text above the film and controls below it. Central cup/sipping/breaking action was visually checked; outer hands/background can be cropped. The underlying MP4 dimensions are never changed.

## Validation

Tested local Chrome at **1440 × 900** and **390 × 844**. Evidence: [cinematic playback](browser-validation.json), [reduced motion / rapid-scroll gating](reduced-motion-validation.json), [delayed first frame](loading-validation.json), [hero regression](hero-regression-validation.json), and [preservation](preservation-validation.json).

| Test | Result |
| --- | --- |
| Full native sipping → crack/eat → brand chain | Passed at both sizes |
| Hero-filled-cup camera push and shot change | Visually reviewed at both sizes |
| First playable frame before shot reveal | Incoming media ready; no black decoded frame exposed |
| Artificially blocked MP4 responses | Frame 239 stayed visible at canvas opacity 1; zero visible film layers until release |
| Release blocked video responses | Sipping became ready (readyState 4) and played |
| Replay / pause / resume | Passed at both sizes |
| Reverse brand → crack → sipping → hero | Passed at both sizes |
| Inactive/offscreen videos | Both paused |
| Fast jump to continuation 98% | Still starts sipping; no skipped action |
| Reduced motion | Zero pins, no startup video requests, no autoplay; native controls work and offscreen film pauses |
| Horizontal overflow | None at either size |
| Original hero geometry/frame mapping | Identical to validated prototype samples |
| Original handoff position/size error | 0 CSS pixels in x, y, width and height |
| Hero resident frame cache | Peak 18 |
| Normal browser console / HTTP | No errors / no failed HTTP responses |

Native playback was exercised through both complete source durations in the desktop/mobile cinematic test. Some media transfers are canceled during source loading/navigation (four in the captured normal run); these are recorded separately from failures and did not produce console errors or playback failures. The delayed-first-frame test was also rerun in a fresh Chrome instance using its standard autoplay policy; muted native playback succeeded after the held MP4 responses were released.

An initial opaque stage-background regression was found through screenshot review and corrected before final validation. The final initial-hero and push screenshots show the source cup continuously visible. Existing hero regression tests pass after the continuation hook.

## Screenshots

| Scene | Desktop | Mobile |
| --- | --- | --- |
| Preserved initial hero | [View](screenshots/desktop-hero-initial.png) | [View](screenshots/mobile-hero-initial.png) |
| Camera push | [View](screenshots/desktop-camera-push.png) | [View](screenshots/mobile-camera-push.png) |
| Hero-to-sipping handoff | [View](screenshots/desktop-hero-to-sipping.png) | [View](screenshots/mobile-hero-to-sipping.png) |
| Sipping | [View](screenshots/desktop-sipping.png) | [View](screenshots/mobile-sipping.png) |
| Crack and eat | [View](screenshots/desktop-crack-eat.png) | [View](screenshots/mobile-crack-eat.png) |
| Final brand reveal | [View](screenshots/desktop-brand-reveal.png) | [View](screenshots/mobile-brand-reveal.png) |
| Reverse to held hero | [View](screenshots/desktop-reverse-bridge.png) | [View](screenshots/mobile-reverse-bridge.png) |
| Reduced-motion manual layout | [View](screenshots/desktop-reduced-motion.png) | [View](screenshots/mobile-reduced-motion.png) |

Also see [held cup while video responses were delayed](screenshots/desktop-waiting-for-video.png). Every cinematic capture is a page screenshot, not a generated video frame asset.

## Remaining visual and behavioral limits

- Shot matching is intentional editing, not a pixel-identical cup morph. Hands, geometry and scenery change beneath the warm cover.
- The supplied MP4 star marks remain. They were not edited or hidden with a misleading overlay. Mobile cropping may exclude them in some shots.
- The original hero resolution/matte/background differences and cropped final cup remain. The camera push enlarges existing source detail.
- Native real-time playback and scrolling are separate: reverse scroll revisits/restarts scenes, not reverse-rate video playback. A user who deliberately skips past the entire pinned stage can bypass the films; inactive playback pauses rather than forcing continued viewing.
- Mobile central cropping sacrifices outer scenery/parts of hands. Reduced-motion/native-control layout retains the complete source framing.
- Tests are Chrome desktop/mobile viewport simulations, not physical iPhone/Safari or screen-reader certification. Blocked autoplay exposes a manual play action.

Integrity checks verify **522 existing files** preserved: prototype files, original/prepared images and both MP4s. No video extraction or conversion occurred. The original MP4 sizes/hashes are included in the preservation JSON.

## Run and reproduce

Start `python3 -m http.server 8000 --bind 127.0.0.1` from the project root and open `/`. The unchanged standalone prototype remains at `/prototype/hero-preview.html`.

Repeatable Chrome DevTools Protocol checks are in `tests/cinema-browser.mjs`, `tests/cinema-reduced.mjs`, `tests/cinema-loading.mjs`, and `tests/cinema-hero-regression.mjs`. Use Node with built-in WebSocket support, an otherwise unused Chrome page on local debug port 9222, and the HTTP server on port 8000. Run checks sequentially. The loading test briefly holds MP4 requests to verify readiness gating; it restores them and disables interception. The reduced-motion test restores normal emulation before its rapid-scroll check. Reports and page screenshots are written under `reports/cinema/`.
