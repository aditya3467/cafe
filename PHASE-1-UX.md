# Cup2Eat Phase 1 UX, Strategy and Wireframes

## 1. Audit

- Architecture: one self-contained `cafe.html` with inline CSS and two inline JavaScript modules. The page has no build step or backend.
- Product: edible cups in six flavours. Every pack contains 8 cups.
- Flavours and prices preserved from the original data model: Chocolate INR 79, Pista INR 89, Strawberry INR 89, Mango INR 69, Elaichi INR 65, Vanilla INR 75 per pack.
- Ordering logic preserved: quantity is 1-30 packs; cups equal packs x 8; packaging is INR 29 per pack; delivery is location-dependent; optional chocolate-coated rim is included in the generated message but has no invented price; total before delivery is flavour price x packs + packaging.
- Existing conversion path: hero -> product story -> six flavour cards -> order builder -> copy message -> Instagram.
- Existing friction: the fixed WebGL canvas dominates the experience, real product imagery is not used, the order tool appears late, flavour cards are mostly colour placeholders, and the mobile navigation hides discovery links.
- Supplied assets: genuine Cup2Eat product photos for chocolate, chocolate pour, elaichi, mango, pista, strawberry, vanilla, and a rim-pour use case in `public/imgs/`.

## 2. Audience and customer journey

Primary customers are curious cafe drinkers and sustainability-minded hosts who want a memorable serving format without plastic waste. They need to understand the edible-cup idea quickly, see the product clearly, compare flavours, and know the exact pre-delivery price before contacting the brand.

1. Arrive: see the real cup in use and understand the product in one sentence.
2. Believe: scan a short proof rail using only claims already present in the original site.
3. Explore: browse all six flavours with a clear pack size and price.
4. Configure: select flavour, packs, and optional rim coating in one visible order module.
5. Confirm: review packs, cups, subtotal, packaging, and total before delivery.
6. Handoff: copy the prefilled message and continue to @cup2eat on Instagram.

## 3. Information architecture

- Home / product promise
- How it works / pour, sip, eat
- Six flavours
- Build your order
- Brand contact and Instagram

Primary navigation mirrors this order. The order anchor remains available as the highest-contrast action.

## 4. Wireframes

### Desktop

```text
[sticky brand] [How it works] [Flavours] [Order now]
[large editorial hero copy] [genuine chocolate cup image]
[proof strip: edible | pure veg | vegan friendly | eco friendly]
[dark how-it-works band: POUR / SIP / EAT + chocolate-pour image]
[cream flavour heading] [six flavour product cards in 3 x 2 grid]
[dark order heading and explanatory copy] [order builder + live summary]
[footer: brand line | Instagram]
```

### Mobile

```text
[brand] [order icon/action]
[hero copy]
[hero product image]
[primary order action]
[2 x 2 proof grid]
[how-it-works steps stacked]
[horizontal flavour cards / 2-column compact cards]
[order builder with full-width controls]
[sticky bottom order summary action]
[footer]
```

## 5. UX decisions

- Real product images are the primary visual language; decorative geometry stays quiet.
- Flavour cards select the same state as the order builder so discovery never forks from checkout.
- The live order summary uses explicit labels for pack price, packaging, delivery caveat, and total before delivery.
- The rim option retains the original no-price behavior and message wording; no claim or price is invented.
- Copy remains the operational handoff because the original site has no checkout or payment integration.
- Motion is limited to reveal, hover lift, and image scale. No complex 3D animation is used in Phase 1.
- All meaningful interactions are keyboard reachable and labels remain readable at mobile widths.
