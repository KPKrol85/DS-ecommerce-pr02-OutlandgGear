# Daily Front-End Audit — Outland Gear

**Audit date:** 2026-07-26
**Project type:** Static multi-page demo e-commerce frontend (MPA) built with semantic HTML, modular CSS, Vanilla JavaScript ES modules, local JSON data, and a Node.js build pipeline generating production files into `dist/` for Netlify deployment.
**Audit mode:** static repository review

## Overall assessment

The implementation is stable and consistent with its documented architecture: MPA HTML pages, layered CSS, and guarded Vanilla JS modules coordinated through `js/app.js`. No blockers were found — forms, storage access, and focus management are defensively coded across the board, and `robots.txt`/`sitemap.xml` are currently in sync with `data/products.json` and `data/travel-kits.json`. The structural gap in the automated accessibility suite that let two toast contrast defects (P1-02, P1-03) reach production undetected has been closed: a new interaction-state spec (P2-05) now scans interaction-only component states, and its first run immediately caught a real contrast defect in the navigation drawer (P1-04), since fixed. Two further contrast-related items remain open: an unaddressed disabled-button contrast mismatch (P2-06) and an unconfirmed question of whether the existing resting-state scans include the legal modal (P2-07). Remaining findings are minor and proportionate to a solo-maintained static frontend project. The project is ready for normal continued development.

## Verified strengths

- Consistent defensive JavaScript: every `localStorage`/`sessionStorage` access is wrapped in try/catch with a safe fallback and a user-facing storage-unavailable notice (`js/modules/storage.js:20-37`, `js/modules/theme.js:12-25`, `js/modules/legal-modal.js:16-31`).
- Accessible interaction patterns implemented uniformly rather than ad hoc: focus trapping, Escape handling, and focus restoration are present in both the nav drawer and the legal-info modal (`js/modules/nav.js:100-191`, `js/modules/legal-modal.js:88-133`).
- Safe DOM construction: cart and product rendering build elements with `document.createElement` and `textContent` for data-driven content; `innerHTML` is used only to clear containers or to inject the project's own static partial files (`js/modules/cart.js:130-183`, `js/modules/partials.js:26-40`).
- Honest, non-misleading demo checkout: the UI explicitly labels the checkout action "Złóż zamówienie (demo)" and the flow behavior matches the documented scope in `README.md` (`checkout.html:198`).
- Automated accessibility coverage is wired into CI: Playwright + `@axe-core/playwright` scan 11 routes in both light and dark themes (`tests/a11y/a11y.spec.js:4-177`, `.github/workflows/accessibility-ci.yml`).
- SEO output is code-generated from live data rather than hand-maintained: `sitemap.xml` currently contains exactly the 35 product slugs and 3 travel-kit slugs present in `data/products.json` and `data/travel-kits.json` (verified by count).

## P0 — Critical risks

None detected.

## P1 — Important issues worth fixing next

No outstanding findings — 4 resolved (see below).

### [P1-01] Validated product-data pipeline is unused; four modules duplicate raw data loading — RESOLVED

- **Status:** Resolved 2026-07-26 — `cart.js`, `catalog.js`, `product.js`, and `travel-kits.js` were migrated to `loadNormalizedProducts` through a single shared `product-data.js` module instance, `imageAlt` was added to `normalizeProduct` as a pass-through field, and the duplicated `ensureProductsCollection` helpers were removed.
- **Classification:** Maintenance risk
- **Evidence:** `js/modules/product-data.js:116-162` (exported `loadNormalizedProducts`, never imported); `js/modules/cart.js:227-248`; `js/modules/catalog.js:256,295`; `js/modules/product.js:14,387,401`; `js/modules/travel-kits.js:19,429-430`
- **Current behavior:** `product-data.js` defines `loadNormalizedProducts`, which validates records, applies field defaults, detects duplicate ids/slugs, and cross-checks category/subcategory against `categories.json`. No other module calls it. Instead, `cart.js`, `catalog.js`, and `product.js` each define their own near-identical `ensureProductsCollection` helper and fetch `data/products.json` directly, and `travel-kits.js` does the same inline. The four call sites also use three different literal paths (`"data/products.json"`, `"/data/products.json"`, `"/data/products.json?v=20260406-2"`).
- **Impact:** The project's own sanitization/validation layer is bypassed on every render path that shows product data (cart, catalog, product detail, travel kits), and the differing path strings prevent `js/modules/data.js`'s module-level fetch cache from being shared across features, defeating its purpose. Any future malformed record would be caught only by whichever of the four ad hoc guards happens to run, not by the dedicated validator.
- **Recommended direction:** Route all four consumers through `loadNormalizedProducts` (or delete it if the simpler approach is the intended design) and standardize on a single fetch path string.

### [P1-02] Toast panel background used a text-role token that inverts in dark theme — RESOLVED

- **Status:** Resolved 2026-07-26 — introduced `--color-toast-bg`, declared `#1d2a26` in both theme blocks, and switched the toast panel's `background` to it, raising dark-theme text contrast to 14.88:1 with no change to the light theme.
- **Classification:** Defect
- **Evidence:** `css/components/toast.css:5` (`background: var(--color-ink)`, prior to fix); `css/tokens.css:4` (`--color-ink: #1d2a26` in the light theme) vs. `css/tokens.css:150` (`--color-ink: #edf4ee` in the dark theme)
- **Current behavior:** `--color-ink` is primarily a text-role token that intentionally flips between themes — `#1d2a26` in light, `#edf4ee` in dark — because it is tuned for text legibility, not background fills. `toast.css` used it as the toast panel's `background`, so in the dark theme the panel rendered as a near-white fill.
- **Impact:** Every toast variant rendered white text (`--color-white`) on a near-white panel in the dark theme, measured at 1.12:1 contrast — far below the 4.5:1 text threshold, making toast messages effectively unreadable. The existing axe suite did not catch this because toasts are absent from the DOM at rest and static page scans never encounter them.
- **Recommended direction:** Introduce a dedicated background token for the toast panel, declared explicitly per theme rather than reusing a text-role token.

### [P1-03] Toast info variant used a low-contrast dark-theme border and silently absorbed a cart-save failure — RESOLVED

- **Status:** Resolved 2026-07-26 — `js/modules/cart.js:61`'s cart-save failure call now passes `{ type: "error" }`, rendering with label "Błąd", `role="alert"`, `aria-live="assertive"`, and a 4000 ms duration instead of the implicit info fallback. The info variant's border received a dedicated token, `--color-toast-info-border` (`#eef4f6` light, `#94b09a` dark), raising its dark-theme contrast against the toast background from 1.05:1 to 6.33:1.
- **Classification:** Defect
- **Evidence:** `js/modules/toast.js` (`getToastType` falls back to `TOAST_TYPES.info` for a missing/unrecognized type); `js/modules/cart.js:61` (prior call passed no options object); `css/components/toast.css:39` (`border-left-color: var(--color-sky)`, prior to fix)
- **Current behavior:** A cart-save failure reached the info fallback implicitly, rendering as label "Informacja" with `role="status"`, `aria-live="polite"`, and a 2500 ms duration — understating the severity of a failed save. Independently, the info border's dark-theme value composited to 1.05:1 against the toast panel, below the 3:1 non-text contrast threshold.
- **Impact:** Users could miss a cart-save failure — it was announced politely rather than assertively and dismissed sooner than a failure warrants, and the border meant to visually distinguish it was nearly invisible in the dark theme.
- **Recommended direction:** Pass an explicit `{ type: "error" }` for the cart-save failure, and give the info variant's border a dedicated opaque token per theme.

### [P1-04] Theme-toggle drawer status label failed color-contrast in the light theme — RESOLVED

- **Status:** Resolved 2026-07-27 — added a `.nav-drawer__panel .theme-toggle--drawer` rule in `css/components/nav.css` restoring `opacity: 1`, at equal selector specificity to the rule it overrides so it wins by source order, with no `!important`. Confirmed only the theme-toggle is affected; the drawer's close button keeps its original `opacity: 0.88`. Verified in the browser with two consecutive full runs of `npm run qa:a11y`, both 42 of 42 passing.
- **Classification:** Defect
- **Evidence:** `tests/a11y/a11y-interactive.spec.js` (the new P2-05 spec's first run, which surfaced this defect); `css/components/nav.css:363-367` (`.nav-drawer__panel .btn--small` sets `opacity: 0.88`, prior to fix)
- **Current behavior:** The theme-toggle status label ("Jasny") inside the open navigation drawer measured 4.29:1 against white in the light theme, below the 4.5:1 threshold. `--color-muted` itself was not at fault, measuring 5.58:1 at full opacity; the cause was `.nav-drawer__panel .btn--small` applying `opacity: 0.88` to the whole button, including its text, and ancestor opacity cannot be undone by a child's own color.
- **Impact:** The same class of contrast defect as P1-02/P1-03, this time caught by the newly added interactive spec (P2-05) on its first run rather than reaching production undetected.
- **Recommended direction:** Restore full opacity for the drawer theme toggle specifically, without altering the opacity rule applied to other `.btn--small` elements or the underlying color token.

## P2 — Minor refinements

2 outstanding — 5 resolved (see below).

### [P2-01] Product-page quantity limit is not enforced beyond the input's `max` attribute — RESOLVED

- **Status:** Resolved 2026-07-26 — the add-to-cart handler in `js/modules/product.js` now reads `qtyInput.max`, clamps the requested quantity to it before calling `addToCart`, and surfaces the clamp to the user via the existing `showToast` "warning" type; `cart.js`'s `clamp(qty, 1, 99)` was left unchanged.
- **Classification:** Defect
- **Evidence:** `produkt.html:188` (`<input ... max="10" data-qty-input />`); `js/modules/product.js:302-311` (`addBtn` handler reads `qtyInput.value` directly); `js/modules/cart.js:56-58` (`clamp(qty, 1, 99)`)
- **Current behavior:** The add-to-cart handler reads the quantity field's raw value without calling `checkValidity()`, and `cart.js` clamps it to 1–99 rather than to the field's own declared maximum of 10.
- **Impact:** A user can type a value above 10 and have the full (up to 99) quantity added in a single click, silently exceeding the limit implied by the markup.
- **Recommended direction:** Validate the quantity field against its own `max` (or call `checkValidity()`) before calling `addToCart`, or raise the field's `max` to match the enforced ceiling.

### [P2-02] No repository-level line-ending enforcement — RESOLVED

- **Status:** Resolved 2026-07-26 — added `.gitattributes` at the project root with `* text=auto eol=lf` as the baseline, explicit `text eol=lf` overrides for `.svg`/`.webmanifest`, and `binary` rules for the project's binary asset extensions; `.gitattributes` is committed. Renormalizing the 21 files flagged in `git diff --stat` was found unnecessary — measurement showed those tracked text files were already stored as LF in the Git index, and the drift existed only in the working tree.
- **Classification:** Maintenance risk
- **Evidence:** `.editorconfig:5` (`end_of_line = lf`); no `.gitattributes` file present in the repository; current `git diff --stat` shows 21 tracked files (including `package.json`, `package-lock.json`, several `css/js` and config/test files) with matching insertion/deletion counts per file, consistent with a full CRLF/LF flip rather than content changes.
- **Current behavior:** Line-ending consistency relies solely on `.editorconfig`, which most editors honor but Git itself does not enforce. The working tree currently shows exactly the drift this gap allows.
- **Impact:** Noisy, hard-to-review diffs and elevated risk of spurious merge conflicts or mixed line endings being committed.
- **Recommended direction:** Add a `.gitattributes` (e.g. `* text=auto eol=lf`) to normalize line endings at the Git level.

### [P2-03] `--color-sky` switches opacity model between light and dark themes — RESOLVED

- **Status:** Resolved 2026-07-26 — seven consumers of `--color-sky` were analysed. Six — `badges.css`, `cards.css`, `table.css`, `travel-kits.css`, and two `color-mix()` usages in `legal.css` — measured contrast ratios between 5.06:1 and 13.09:1 against their real backdrops and were intentionally left unchanged. The seventh, the toast info-variant border, was replaced with a dedicated opaque token. `--color-sky` itself was deliberately not modified; keeping it is the outcome of the analysis, not an omission. No single opaque replacement value exists, because the dark-theme consumers do not share one backdrop.
- **Classification:** Source-visible risk
- **Evidence:** `css/tokens.css:16` (`--color-sky: #eef4f6` — opaque, light theme) vs. `css/tokens.css:155` (`--color-sky: #12201d70` — ~44% alpha, dark theme); consumed as a flat `background: var(--color-sky)` in `css/components/badges.css:11`, `cards.css:232`, `table.css:15`, `toast.css:39`, `ui-state.css:64` (sets `--ui-state-bg`, a custom property never read elsewhere — `.ui-state` declares no `background` property — not an actual rendering consumer), and `css/pages/travel-kits.css:53`; also consumed through `color-mix()` rather than as a flat background in `css/pages/legal.css:147` and `css/pages/legal.css:154`
- **Current behavior:** The same design token is a solid fill in light mode but a semi-transparent fill in dark mode, while the components consuming it treat it as a flat background in both themes.
- **Impact:** The visual weight of badges, table headers, the toast border, and `ui-state` panels in dark mode depends on whatever is rendered behind them — a rendering risk that requires browser verification, not a confirmed defect from source alone.
- **Recommended direction:** Confirm the dark-mode translucency is an intentional layering effect for each consuming component, or convert `--color-sky` to an opaque dark-theme value consistent with its light-theme counterpart.

### [P2-04] Duplicate `data.js` module instance from differing import specifiers — RESOLVED

- **Status:** Resolved 2026-07-26 — `travel-kits.js`'s `data.js` import specifier was aligned with `product-data.js`'s, collapsing the two instances into one. The same versioned-specifier pattern was then traced project-wide: the remaining five versioned specifiers in `travel-kits.js` (`dom.js`, `ui-state.js`, `fallback.js`, `utils.js`, `routes.js`) and all 14 versioned specifiers in `js/app.js` (including `config.js`, `dom.js`, and `cart.js`, the only three of those 14 with another importer) were aligned to plain specifiers, confirmed by grep to leave no versioned import specifier anywhere in `js/`.
- **Classification:** Maintenance risk
- **Evidence:** `js/modules/travel-kits.js` imports `./data.js?v=20260405-3`; `js/modules/product-data.js` imports `./data.js` (no query string)
- **Current behavior:** The differing specifiers cause the module resolver to treat them as two distinct modules, so `data.js` is instantiated twice.
- **Impact:** Not a defect — `products.json` is fetched only through `product-data.js`, and the `travel-kits.js` instance serves only `travel-kits.json`, so `product-data`'s caching is unaffected. This is a duplication/maintenance concern only.
- **Recommended direction:** Align `travel-kits.js`'s import specifier for `data.js` with `product-data.js`'s to collapse the two instances into one, consistent with the specifier fix already applied to `product-data.js`'s own consumers (P1-01).

### [P2-05] Automated accessibility suite does not scan interaction-only component states — RESOLVED

- **Status:** Resolved 2026-07-27 — added `tests/a11y/a11y-interactive.spec.js`, 20 tests covering both themes across: all four toast variants (success and warning triggered through real UI interaction on a product page; error triggered by breaking `Storage.prototype.setItem` for the cart's storage key so the real `saveCart`/`showToast` path runs under an engineered failure; info reproduced via `page.evaluate` since no call site reaches that fallback, explicitly labelled as constructed rather than interaction-triggered), the navigation drawer, the header search panel, the legal information modal's auto-open, and three state banners (cart empty, checkout validation error, travel-kit loading). Each axe scan is scoped to the component under test via `AxeBuilder`'s `include` option, and each test asserts the state is actually present before scanning, so a broken trigger fails the test rather than passing an empty scan. `package.json`'s `qa:a11y` script was changed to run the whole `tests/a11y` directory instead of naming `a11y.spec.js` alone, so both specs execute together.
- **Classification:** Maintenance risk
- **Evidence:** `tests/a11y/a11y.spec.js:4-118` (all 11 `ROUTES` entries wait only for each page's resting/loaded state — a hero, a listing grid, a product root, a cart summary, a form, or a legal heading — none perform a click, toggle, or submit); `tests/a11y/a11y.spec.js:164-165` (a single `AxeBuilder(...).analyze()` runs immediately after that wait, once per route per theme); P1-02, P1-03 (the two toast contrast defects this gap allowed through); `js/modules/nav.js:51-67` (drawer/search panel `aria-hidden`/`aria-expanded` set only on click); `js/modules/legal-modal.js:54-55` (`hidden`/`aria-hidden` set only on open); `js/modules/ui-state.js:7,20-23` (`hidden`/`aria-live` set only when a state is actively rendered)
- **Current behavior:** The suite scans 11 routes in both light and dark themes (22 scans total), each waited only to its normal resting/loaded state before a single axe pass; no route performs an interaction before scanning.
- **Impact:** The toast component's contrast defects (P1-02, P1-03) reached production undetected because the toast region is absent from the DOM until `showToast` runs. The same mechanism — accessible markup that only exists post-interaction — applies to the nav drawer, search panel, legal modal, and state banners; a regression in any of them would pass the suite the same way.
- **Recommended direction:** Extend the suite's coverage to include at least one interaction-triggered state per affected component, starting with the toast variants already found to fail; the specific mechanism is an open implementation decision, not fixed by this finding.

### [P2-06] `.btn:disabled`/`[aria-disabled="true"]` text fails color-contrast against its background

- **Classification:** Defect
- **Evidence:** `css/components/buttons.css:62` (`color: var(--color-muted)` on `background: var(--color-stone)`, `#e5e1d8` in the light theme); no axe-core spec in `tests/a11y/` currently exercises a disabled or `aria-disabled` button, so this state is not covered by either `a11y.spec.js` or `a11y-interactive.spec.js`.
- **Current behavior:** `--color-muted` on `--color-stone` measures 4.28:1 in the light theme, below the 4.5:1 threshold. This is unrelated to the opacity mechanism behind P1-04 — no ancestor opacity or gradient is involved, it is a direct token-on-token mismatch. Found by manual contrast auditing of `--color-muted`'s other consumers while investigating P1-04.
- **Impact:** Disabled/`aria-disabled` button text renders below the WCAG AA text-contrast threshold in the light theme.
- **Recommended direction:** Address the token-on-token contrast mismatch between `--color-muted` and `--color-stone` for this state; the specific color value is a decision for the project owner, not fixed by this finding.

### [P2-07] Unconfirmed: existing resting-state a11y scans may include the legal modal

- **Classification:** Methodological/coverage question — not a confirmed defect
- **Evidence:** `tests/a11y/a11y.spec.js`'s 22 existing scans do not seed the legal modal's acceptance flag (localStorage key `outlandGearLegalAcceptedAt` or sessionStorage key `outlandGearLegalAcceptedSession`), while `tests/a11y/a11y-interactive.spec.js` seeds it for every state except the modal's own auto-open test. The modal opens 700ms after load when neither key is present. A timing analysis — not an instrumented run of `a11y.spec.js` — suggests the modal is very likely already open during some or all of the 22 existing resting-state scans.
- **Current behavior:** Unconfirmed. This has not been verified by running `a11y.spec.js` with instrumentation to check the modal's actual state at scan time; it remains an open question, not a settled fact.
- **Impact:** If confirmed, this would mean the 22 existing resting-state scans include the legal modal in what they analyse, rather than scanning each route's page content in isolation as their names imply — a coverage/interpretation question about what those scans actually validate, not a described rendering defect.
- **Recommended direction:** Confirm or rule out the modal's presence during those 22 scans by instrumented execution (e.g. checking `#outland-legal-modal`'s `aria-hidden` state at scan time) before drawing further conclusions.

## Extra quality improvements

### Pin the Node.js engine version

- **Evidence:** `package.json` has no `engines` field; `.github/workflows/*.yml` pin CI to `node-version: 20`.
- **Potential value:** Prevents local/CI Node-version drift (the audit environment resolved Node v22) from causing hard-to-reproduce build or dependency differences.
- **Scope boundary:** Add an `engines.node` field to `package.json`; no behavior change required.

## Verification performed

- Inspected repository structure, `package.json`, `README.md`, `netlify.toml`, `scripts/build-dist.mjs`, `scripts/seo-config.mjs`, and both GitHub Actions workflows.
- Read all core JavaScript modules involved in data loading, cart, checkout, contact/newsletter forms, navigation, theme, and the legal modal, plus representative HTML templates (`index.html`, `produkt.html`, `checkout.html`, `kontakt.html`) and `css/tokens.css`.
- Cross-checked `sitemap.xml` and `robots.txt` against `data/products.json` (35 slugs) and `data/travel-kits.json` (3 slugs) by count — currently in sync.
- Verified referenced image assets (hero, sample product images) and web manifest icons exist on disk.
- Ran read-only `git status` / `git diff --stat` to identify current working-tree drift as a focus signal (not treated as a defect on its own).
- Grepped the JavaScript source for `TODO`/`FIXME`, `console.log`/`console.debug`, `eval`/`new Function`, and credential-like strings — none found.
- Computed WCAG contrast ratios by hand for a sample of light/dark token pairs from `css/tokens.css`; all sampled pairs met AA thresholds (informal spot check, not a full audit).
- Did not run `npm ci`, `npm run lint`, `npm run build`, or `npm run qa:a11y` — `node_modules` is absent and dependency installation is outside this audit's allowed scope, so the checks wired into `code-quality-ci.yml` and `accessibility-ci.yml` could not be executed locally.
- On 2026-07-26, the project owner independently ran `npm run build`, exercised the local preview build in a browser session, and ran `npm run qa:a11y`, passing 22 of 22 across both themes — the checks this audit's environment could not execute (above) were subsequently verified outside it.
- On 2026-07-27, the project owner ran `npm run qa:a11y` twice, both times 42 of 42 passing across both themes, confirming P2-05's resolution and the P1-04 fix.

## Senior rating

**Rating:** 9/10

The codebase is well-architected for its stated scope: defensive storage handling, consistent accessible-interaction patterns, and CI-enforced accessibility scanning are all real and verifiable. P1-01's architectural inconsistency is resolved, and the build/lint/a11y pipeline is now verified passing (`npm run qa:a11y`, 42/42, both themes) rather than unverifiable. The interaction-state spec added to close P2-05's coverage gap proved its value immediately, catching a real contrast defect (P1-04) on its first run. The score is held to 9 rather than 10 by two open items: a confirmed but unaddressed contrast defect on disabled/`aria-disabled` buttons (P2-06), and an unconfirmed question of whether the existing resting-state scans include the legal modal (P2-07).
