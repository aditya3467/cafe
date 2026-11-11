# Phase 2 — registered hero derivatives

All edits are new derivatives. Existing application files, previous reports, and all 239 source PNGs remain unchanged. No GSAP or website changes were made. These outputs are not wired into the application yet.

## Deliverables

- `cup-empty-registered.png`: 1280 × 720 RGBA; source cup at its original coordinates; background and detached shadow transparent.
- `hero-background-plate.png`: 1280 × 720 RGB; cup, detached shadow and lower-right Gemini mark removed.
- `hero-asset-comparison.png`: six labelled panels, each at original 1280 × 720 scale: original, cream, caramel, espresso, plate, and registered composite. The overall sheet is 2560 × 2310, including label strips.
- `hero-registered-composite.png`: standalone full-size plate plus extracted cup.
- `frames-clean/frame_000001.png` through `frame_000239.png`: complete 1280 × 720 derivative sequence with the visible lower-right star mark removed. Original filenames are retained inside this separate directory; no original was renamed or replaced.
- `cup-segmentation-mask.png`, `cup-mask-control-points.json`: adjustable alpha matte and source-space control points.
- `background-reconstruction-mask.png`, `gemini-removal-mask.png`: repair-region masks. The background mask records the core cup/shadow region; reconstruction also includes a blend surround and a smooth tabletop surface below y=500.
- `qc-rim-200pct.png`, `qc-waffle-left-200pct.png`, `qc-waffle-base-200pct.png`: edge comparisons enlarged 2× with nearest-neighbour sampling for pixel inspection.
- `qc-logo-removal-200pct.png`: paired source/cleaned patches at representative sequence intervals.
- `validation.json`: technical preservation checks.
- `prepare-assets.py`, `refine-assets.py`: editable local processing recipes; run the preparation recipe first and refinement second. They rebuild only derivatives. Dependencies: Pillow, NumPy, OpenCV. Preparation loads existing silhouette control points if present; refinement uses the same points for the rim. Review masks again after any adjustment. These are offline asset tools, not application JavaScript.

## Extraction method

Used the exact RGB pixels from `frame_000001.png`. A hand-traced silhouette constrains GrabCut to a narrow boundary band; a sure-foreground interior preserves the product. A manually guided, subpixel rim curve refines the low-contrast upper chocolate edge. A small antialias filter softens the hard classification edge without broad feathering. RGB values at fully opaque pixels are unchanged. No cup generation, resizing, distortion or texture synthesis was used.

Registration remains the full source canvas. Transparent pixels contain zero RGB; pixels at partially transparent edges retain source RGB. No detached shadow is included. The alpha mask is supplied separately so edges can be adjusted without changing product pixels.

## Background reconstruction method

The scene behind the cup is not observable in frame 1. A source-based low-order lighting reconstruction estimates it from surrounding unobstructed pixels: horizontal fits for the wall glow and a joint two-dimensional fit for the tabletop, with smooth blending. This avoids cloning repeated patches and avoids inventing a different environment, but necessarily estimates hidden content. The tabletop fit is smoother and less textured than the original. Local masked inpainting removes the star mark.

## Visual review and production status

Inspected the full-size original and registered composite, the six-panel color comparison, and 200% rim/waffle/base crops.

| Check | Finding |
| --- | --- |
| Waffle texture/interior | Source pixels retained; no visible internal texture replacement |
| Chocolate rim | Interior and highlights intact; top contour manually refined after the first pass |
| Fine protrusions | Visible waffle edge relief retained in reviewed crops; no claim of exact subpixel recovery from this soft source |
| Halos | No broad background halo on espresso; a thin dark edge/source-color fringe is more noticeable against cream/caramel at 200% |
| Shadow in cutout | Detached shadow excluded; no alpha below the cup region |
| Alignment | No position or scale transform; opaque cup pixels align exactly with source coordinates |
| Background | Cup removed; gradient/table boundary retained; tabletop detail is visibly simplified |
| Composite | Cup matches spatially, but original shadow and star are intentionally absent; background differs in reconstructed regions |

**Cutout:** suitable for staging on the intended dark espresso scene at approximately native product scale. It is not certified as the final oversized production asset: bright-background edge fidelity needs further manual matte review, and the source cup is only about 400px wide. Enlargement will expose source softness and any residual edge fringe.

**Background plate:** review candidate, not production-approved for a perfectly invisible handoff. The broad lighting is plausible, with no repeated texture tiles, but the reconstructed tabletop is too smooth for an exact original-frame match. Do not label the composite pixel-identical to frame 1. The required removal of its original shadow also changes the floating-cup appearance.

For a stronger final plate, manually retouch the supplied reconstruction mask using nearby source texture with careful gradient matching, or obtain a clean background plate from the original video generation setup. A separate shadow layer can restore the original floating relationship and fade independently; it must not be baked back into the requested shadow-free plate. A deliberate gradual reveal of the full sequence can conceal remaining background differences without promising a mathematically invisible swap.

## Gemini-mark removal

A fixed, tightly bounded star-shaped mask covers the visible mark and antialiased margin in source coordinates. OpenCV Telea inpainting repairs that region independently in each frame. No other pixels in the cleaned sequence are altered. First/final full-frame outputs and representative 200% patches were reviewed. This removes the visible star, not invisible provenance metadata. The mark covered unknown background content; the fill is an estimate. A full motion playback check for small temporal shimmer remains necessary before production integration.

The live application still references the original PNG directory because changing application files was explicitly excluded. These clean derivatives are ready for later review/integration; no WebP conversion has been run.
