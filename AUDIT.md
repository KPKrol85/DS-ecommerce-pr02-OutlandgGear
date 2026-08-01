# Outland Gear — Final Technical Front-End Audit

**Audit date:** 2026-08-01
**Project type:** Static multi-page demo e-commerce front end (MPA) built with semantic HTML, layered CSS, Vanilla JavaScript ES modules, local JSON data, and a Node.js build pipeline that generates `dist/` for Netlify deployment
**Audit mode:** Final repository and implementation review
**Current readiness:** Ready with minor refinements

## 1. Executive assessment

The implementation is coherent and matches its documented architecture. Product data flows through one validated loader, storage access is uniformly guarded, data-driven DOM construction avoids `innerHTML` for user- and data-derived content, and the design-token system is applied with unusual discipline — only 17 hardcoded colour values exist outside `css/tokens.css` across roughly 3,600 lines of CSS. Both CI workflows are real: linting and a production build on one, Playwright + axe scans on the other. The generated SEO output was verified byte-identical to a fresh regeneration from `data/`, and every asset path referenced from HTML resolves on disk.

Both P1 findings recorded by this audit have since been resolved and are retained below for record. P1-01 covered the client-side layer treating the build's prerendered output as a placeholder — hiding it on every load and destroying it on a failed fetch. P1-02 was found while fixing P1-01 and proved to be the more severe of the two: a regex in the build's HTML transform matched a literal space rather than any whitespace, so the `hidden` attribute it was written to strip was never actually removed, and every prerendered travel-kit page had been shipping its detail block hidden. Both are fixed, with the prerender contract now marked at build time and honoured by both detail-page modules.

Remaining open findings are contained and all P2: two dangling image references that reach production structured data, a component whose background tokens are declared but never consumed, formatting drift that no CI job checks, two forms that carry personal data in a URL on the no-JavaScript path, one documentation claim that the implementation does not support, a missing live region on the catalog result count, and one stale cache-busting query.

The project is suitable for continued development and, once the two P2 items that affect published output are taken, for portfolio presentation within its documented demo scope.

## 2. Audit scope and verification

### Areas inspected

- Repository structure, `package.json` scripts and dependencies, `.gitignore`, `.gitattributes`, `.editorconfig`, `.prettierrc.json`, `eslint.config.mjs`, `stylelint.config.mjs`, `playwright.config.js`, `netlify.toml`, `LICENSE`
- Project documentation: `README.md` (both language sections), `CHANGELOG.md`, `docs/archive/audits/daily-AUDIT-2026-08-01.md`, `docs/archive/plans/PLAN-2026-08-01.md`
- All 15 root HTML pages and both shared partials (`partials/header.html`, `partials/footer.html`)
- All JavaScript sources: `js/app.js`, `js/config.js`, `js/utils.js`, and all 22 modules in `js/modules/`
- CSS entry point and layer order (`css/main.css`), tokens, base, layout, and all component and page stylesheets
- Application data: `data/products.json` (35 records), `data/categories.json`, `data/travel-kits.json` (3 records)
- Build and tooling: `scripts/build-dist.mjs`, `scripts/seo-config.mjs`, `scripts/preview-dist.mjs`, `scripts/optimize-images.mjs`
- Generated output, inspected only to verify the production contract: `dist/produkt/*/index.html`, `dist/assets/img/products/`
- Test suites: `tests/a11y/a11y.spec.js` (11 routes × 2 themes), `tests/a11y/a11y-interactive.spec.js` (interaction-only states × 2 themes)
- CI: `.github/workflows/code-quality-ci.yml`, `.github/workflows/accessibility-ci.yml`
- SEO and PWA surface: `robots.txt`, `sitemap.xml`, `assets/fav-icons/site.webmanifest`

### Verification performed

- `npx eslint js scripts tests` — executed and passed (exit 0)
- `npx stylelint "css/**/*.css"` — executed and passed (exit 0)
- `npx prettier --check .` — executed and failed; 58 files reported as unformatted
- `git status` / `git log` — executed; working tree clean, branch `main` up to date with `origin/main`
- Regenerated `robots.txt` and `sitemap.xml` in memory from `scripts/seo-config.mjs` and `data/*.json` and compared against the tracked files — both byte-identical; sitemap contains 46 URLs (8 static + 35 product slugs + 3 travel-kit slugs)
- Resolved all 124 image paths declared in `data/products.json` and `data/travel-kits.json` against the filesystem — 2 missing (see P2-01)
- Resolved all 107 `src`/`href` asset references across the root HTML pages and both partials against the filesystem — 0 missing
- Cross-checked all 9 `sprite.svg#…` references against the ids declared in `assets/svg/sprite.svg` — all present
- Grepped the JavaScript, script, HTML, and JSON sources for credential-like strings, `.env` files, `TODO`/`FIXME`/`HACK`/`debugger`, and `console.log` in application code — none found; `console` use in `js/` is limited to `error` and `warn` diagnostics
- Verified line-ending state in the working tree — files are LF, so the Prettier result is genuine formatting drift, not a checkout artifact
- Confirmed the local Node.js version (v22.22.3) falls inside the declared `engines.node` range (`>=20 <23`)
- Statically inspected all remaining findings against current source; every line reference in this document was re-read at audit time and again after the P1-01 and P1-02 fixes shifted line numbers in `scripts/build-dist.mjs`, `js/modules/travel-kits.js`, and `js/modules/product.js`
- After the P1 fixes: `npx eslint js scripts tests` re-run and passed (exit 0), and `npm run build:html` run into a scratch copy of the repository to inspect generated output — 38 of 38 detail pages carry `data-prerendered="true"`, no root or template page carries it, and the `hidden` attribute is stripped from prerendered kit content while the `komplety.html` template retains it

### Verification limitations

- `npm run build` was not executed. `scripts/build-dist.mjs:732` writes `robots.txt` and `sitemap.xml` into the repository root, which are tracked files, so the build is outside this audit's read-only constraint. Their content was verified in sync by regenerating them in memory instead.
- `npm run qa:a11y` was not executed in the audit environment. Its Playwright `webServer` runs `npm run build` (`playwright.config.js`), and no Playwright browser binaries are present there; installing them would require a dependency install, which is outside audit scope. The suite was subsequently run locally by the project owner after the P1-01 and P1-02 fixes, passing 42 of 42 — that run is the only test evidence behind either resolution, and no browser, runtime, or full-build verification of those fixes was performed in the audit environment.
- No browser or runtime verification was performed. Findings describing rendered behaviour are derived from source and are labelled as such.
- No live deployment was inspected; no live URL was supplied for this audit. `README.md` links to a Netlify address and `scripts/seo-config.mjs:1` declares it as the SEO origin, but deployment status was not verified.
- Colour-contrast compliance was not fully verified, because reliable computed-style analysis was not available in this environment.
- Disabled-control contrast cannot be covered by this project's automated suite: `axe-core` 4.11.2 skips any disabled or inert node inside `colorContrastMatches` (`node_modules/axe-core/axe.js:27543-27556`), so an axe scan returns the same result with or without a fix for that state. Any future work on disabled-state contrast must be verified by direct browser measurement.

## 3. Verified strengths

- All four product-consuming features route through one validated, memoized loader. `cart.js`, `catalog.js`, `product.js`, and `travel-kits.js` each import `loadNormalizedProducts` from `js/modules/product-data.js:120-166`, which validates required fields, applies defaults, detects duplicate ids and slugs, and cross-checks category/subcategory against `data/categories.json`.
- Every browser-storage access is guarded and degrades to a user-visible notice rather than a silent failure (`js/modules/storage.js:14-30`, `js/modules/theme.js:12-25`, `js/modules/legal-modal.js:16-31`, surfaced through `js/modules/cart.js:17-46`).
- Data-driven DOM construction is safe throughout: cart rows, catalog cards, product specs, and travel-kit cards are built with `document.createElement` and `textContent`. `innerHTML` is used only to clear containers, to insert the project's own static partial files (`js/modules/partials.js:36`), and for one summary block built from numeric currency output (`js/modules/cart.js:186-196`).
- A pre-paint inline script resolves and applies the theme before stylesheets render (`index.html:36-49`), so a stored or system dark preference does not flash light on load — a real gap that this project has closed rather than deferred.
- Generated SEO output is derived from live data rather than hand-maintained, and is currently in sync: `scripts/seo-config.mjs:46-60` builds the sitemap from `data/products.json` and `data/travel-kits.json`, and regeneration reproduces the tracked files exactly.
- Indexing policy is applied deliberately rather than uniformly: `produkt.html` and `komplety.html` carry `noindex, follow` as templates, cart/checkout/confirmation pages carry `noindex`, and only the build-generated `/produkt/<slug>/` and `/komplety/<slug>/` pages receive index directives with per-item titles, descriptions, canonicals, and JSON-LD (`scripts/build-dist.mjs:309-451`, `500-641`).
- The prerender contract is declared in the output rather than inferred by the client: build-generated detail pages carry `data-prerendered="true"` on their page root, both detail-page modules read it through one shared helper (`js/modules/routes.js:41-42`), and the build throws if the root it expects to mark is absent (`scripts/build-dist.mjs:197-211`) — so the marker cannot silently stop being applied.
- The token system is applied consistently: outside `css/tokens.css` only 17 raw hex values remain across all component and page stylesheets, and both themes declare matching semantic tokens rather than overriding component rules.
- Accessible interaction patterns are implemented uniformly rather than ad hoc — focus trapping, focus restoration, and `aria-expanded`/`aria-hidden`/`aria-current`/`aria-pressed` synchronisation appear in the drawer, search panel, dropdowns, gallery, and modal (`js/modules/nav.js:47-191`, `js/modules/legal-modal.js:88-120`, `js/modules/theme.js:47-58`).
- Closed interactive containers are removed from the layout with `display: none` rather than merely visually hidden (`css/components/nav.css:339-350`, `css/components/dropdown.css:60-77`), so no focusable content sits inside an `aria-hidden` subtree at rest.
- The project's demo boundary is stated where a user encounters it, not only in documentation: the checkout action reads "Złóż zamówienie (demo)" (`checkout.html:198`), the confirmation page is titled accordingly, and `README.md` explicitly records the absence of an order backend, accounts, payments, and a service worker.
- Two independent CI workflows exercise the project on every pull request and push to `main`: lint plus a real production build (`.github/workflows/code-quality-ci.yml`) and the axe suite (`.github/workflows/accessibility-ci.yml`).

## 4. P0 — Critical risks

None detected.

## 5. P1 — Important issues worth fixing next

No outstanding findings — 2 resolved (see below).

### [P1-01] Prerendered detail-page content is hidden and re-rendered client-side, and is destroyed outright on a data-fetch failure — RESOLVED

- **Status:** Resolved 2026-08-01 — the prerender contract is now explicit rather than inferred. `scripts/build-dist.mjs:197-211` adds `markPrerenderedRoot`, which stamps `data-prerendered="true"` onto the `<main>` page root of every build-generated detail page (`scripts/build-dist.mjs:320` for products, `:508` for travel kits) and throws if the expected root is missing, so a template rename fails the build instead of silently disabling the guard. `js/modules/routes.js:41-42` exposes the shared `isPrerenderedRoot` reader, consumed by both detail-page modules. `js/modules/travel-kits.js:441-452` now runs `hideKitContent` and the loading state only when the page is not prerendered, so served content is never withdrawn. Both destructive error paths were replaced: `js/modules/travel-kits.js:425-432` and `js/modules/product.js:411-418` route failures through `reportKitLoadFailure` / `reportProductLoadFailure`, which on a prerendered page render a non-blocking banner in the existing `[data-kit-state]` / `[data-product-state]` region via `setUiState` — reusing the `ui-state` component rather than introducing a new one — and leave the content in place; on non-prerendered routes the previous behaviour is unchanged. One case beyond the finding's original wording was closed at the same time: `js/modules/product.js:439-442` now blocks the `matchedProduct || products[0]` fallback on prerendered pages, so a slug that no longer resolves shows the banner instead of silently rendering a different product under a URL, canonical link and `Product` schema that name the original. Verified by the project owner locally with `npm run qa:a11y`, 42 of 42 passing.
- **Classification:** Defect
- **Affected area:** Travel-kit and product detail pages, progressive enhancement, prerender contract
- **Evidence:** `js/modules/travel-kits.js:418` (`hideKitContent(root)` runs unconditionally at init); `komplety.html:129` and `scripts/build-dist.mjs:615-622` (the build fills the template and removes its `hidden` attribute); `js/modules/travel-kits.js:390-409` and `js/modules/product.js:377-396` (both error paths begin with `root.innerHTML = ""`)
- **Current behavior:** The build produces complete, self-contained HTML for `/produkt/<slug>/` and `/komplety/<slug>/`, including the travel-kit detail block with its `hidden` attribute removed. At runtime `initTravelKits` immediately re-sets `content.hidden = true` and shows a loading state, then rebuilds the same content after `travel-kits.json` and `products.json` resolve. On both page types, a rejected fetch or a non-array payload causes `renderKitLoadError` / `renderProductLoadError` to clear the page root and replace it with a retry notice.
- **Impact:** On travel-kit pages the prerendered content is withheld on every single load until two network round-trips complete, which is the opposite of what the prerender step is built to deliver. On both page types, a transient data failure downgrades a page that was already complete and correct in the HTML response into an error state, so the client-side layer can only ever make the delivered page worse, never better. This also weakens the no-JavaScript and slow-network baseline that the prerendered routes otherwise provide.
- **Recommended direction:** Treat prerendered content as the baseline rather than as a placeholder. Initialisation should detect that the page is already populated and either skip the hide-and-rebuild cycle or re-render in place without hiding, and the error paths should preserve existing content and attach the notice alongside it instead of clearing the root. The detection mechanism (a build-set data attribute, a content check, or a separate entry path) is an implementation decision, not fixed by this finding.
- **Verification criteria:** Loading a prerendered travel-kit page never hides its detail block, and blocking `data/products.json` and `data/travel-kits.json` on a prerendered product or kit page leaves the prerendered content visible, with any failure notice added rather than substituted.

### [P1-02] Build regex never stripped the `hidden` attribute it targeted, so prerendered travel-kit pages shipped their content hidden — RESOLVED

- **Status:** Resolved 2026-08-01 — `scripts/build-dist.mjs:193` changed from `match.replace(/\s hidden\b/, "")` to `match.replace(/\s+hidden\b/, "")`. Confirmed against generated output before and after: the tracked pre-fix `dist/` contained `hidden` on `[data-kit-content]` in all three kit pages, and an isolated `npm run build:html` into a scratch copy of the repository after the fix produced `<div class="kit-detail product-layout" data-kit-content>` for all three, with `[data-kit-label]` likewise stripped and the non-prerendered `dist/komplety.html` template correctly retaining both `hidden` attributes. Verified by the project owner locally with `npm run qa:a11y`, 42 of 42 passing.
- **Classification:** Defect
- **Affected area:** Build HTML transform, prerendered travel-kit pages, no-JavaScript baseline, crawlability
- **Evidence:** `scripts/build-dist.mjs:192-193` (`removeHiddenAttributeFromElement`); its two call sites at `scripts/build-dist.mjs:632-639`, which target `data-kit-content` and `data-kit-label`; the tracked pre-fix output `dist/komplety/daily-carry/index.html`, `dist/komplety/road-trip/index.html`, and `dist/komplety/weekend-w-gorach/index.html`, each of which contained `<div class="kit-detail product-layout" data-kit-content hidden>` and `<span class="badge" data-kit-label hidden>`
- **Current behavior:** The helper's pattern `/\s hidden\b/` matched one whitespace character followed by a literal space and then `hidden`, so it required two whitespace characters before the attribute. The generated markup has exactly one space, so the pattern never matched and both `hidden` attributes survived into every prerendered kit page. The two `removeHiddenAttributeFromElement` calls therefore returned their input unchanged while appearing to succeed.
- **Impact:** More severe than P1-01 as that finding was originally written. P1-01 described prerendered content being hidden by JavaScript and restored a moment later; in reality the content was never unhidden by the build at all, so on every prerendered travel-kit page the entire detail block was delivered hidden and became visible only once `renderKit` set `content.hidden = false` after two network fetches. Any client that does not execute JavaScript — including crawlers that do not run scripts — received a page whose main content was present in the DOM but hidden, which nullifies the prerender step for exactly the audience it exists to serve. The failure was silent end to end: the build exits 0, and neither lint, CI, nor the axe suite inspects the result of a string transform, so no existing check could surface it.
- **Recommended direction:** Match any run of whitespace before the attribute rather than a fixed two-character sequence, and treat the build's regex-based HTML transforms as logic that needs its own coverage, so a pattern that silently stops matching fails visibly instead of degrading the output.
- **Verification criteria:** No generated `/komplety/<slug>/index.html` carries a `hidden` attribute on `[data-kit-content]` or `[data-kit-label]`, the non-prerendered `komplety.html` template still carries both, and prerendered kit content is visible in the served HTML before any script executes.

## 6. P2 — Minor refinements

### [P2-01] Two product records reference image files that do not exist, and the paths reach production structured data

- **Classification:** Defect
- **Affected area:** Application data, prerendered product pages, structured data
- **Evidence:** `data/products.json:285` (`assets/img/products/pr-id-112-640x427.jpg`, product `outland-summit-2p`) and `data/products.json:492` (`assets/img/products/pr-id-121-07-640x427.jpg`, product `outland-trek-pro-55l`); neither file exists in `assets/img/products/` or `dist/assets/img/products/`; `scripts/build-dist.mjs:279-282` maps the full `images` array into the JSON-LD `Product.image` list
- **Current behavior:** Both products declare a seventh image entry pointing at a file that was never generated. `produkt.html` provides only six thumbnail buttons, so the entry never renders as a visible thumbnail; it surfaces only in the generated structured data, where `dist/produkt/outland-summit-2p/index.html:90` and the equivalent line in `dist/produkt/outland-trek-pro-55l/index.html` publish an absolute URL to a 404 asset.
- **Impact:** Two indexable product pages publish a `Product.image` array containing a dead URL. Search engines fetch these URLs, and an unresolvable entry can degrade or invalidate the product rich result. The dangling reference is also a data-integrity problem that any future consumer of `images` — a lightbox, a larger gallery, an image sitemap — would hit as a visible broken image.
- **Recommended direction:** Decide per product whether the seventh image should exist and be generated from `assets/img-src/`, or whether the entry is a leftover and should be removed from `data/products.json`. Consider making the missing-asset check part of an existing validation step so the same class of drift is caught before a build.
- **Verification criteria:** Every path in every `images` array in `data/products.json` resolves on disk, and no generated `Product.image` entry points at a missing asset.

### [P2-02] `.ui-state` variants declare background tokens that no rule consumes

- **Classification:** Defect
- **Affected area:** Loading, empty, error, and success state panels across catalog, cart, checkout, product, and travel-kit pages
- **Evidence:** `css/components/ui-state.css:36,43,50,57,64` (five `--ui-state-bg` declarations); `css/components/ui-state.css:5-13` (`.ui-state` declares `border`, `border-left`, `color`, and no `background`); no other rule in `css/` reads `--ui-state-bg`
- **Current behavior:** Each state variant sets a `--ui-state-bg` custom property, but the `.ui-state` block never declares a `background` property, so the value is never applied. All five state panels render transparent over whatever surface is behind them. Separately, `--ui-state-border` for the error and success variants is set to hardcoded light-theme values (`#f0cbc7`, `#b9dbc9`) with no dark-theme counterpart.
- **Impact:** The tinted fills that are meant to distinguish an error panel from a success panel at a glance never render, leaving a 4px left border as the only colour signal — weaker differentiation than the stylesheet was written to provide. The unconsumed declarations also read as working code, so a future maintainer changing them will observe no effect. In the dark theme, the two hardcoded pale borders sit against dark surfaces, inconsistent with every other themed component.
- **Recommended direction:** Decide whether the state panels should have a tinted background. If yes, apply `--ui-state-bg` from `.ui-state` and give the error and success variants dark-theme values, preferably as tokens in `css/tokens.css` alongside the existing `--color-notice-*` pair. If no, remove the five dead declarations so the stylesheet reflects what it renders.
- **Verification criteria:** `--ui-state-bg` is either consumed by a `background` declaration with both themes covered, or absent from the stylesheet, and every colour used by `.ui-state` has a defined value in both themes.

### [P2-03] Repository does not satisfy its own Prettier configuration, and no automated check enforces it

- **Classification:** Maintenance risk
- **Affected area:** Code formatting, CI coverage
- **Evidence:** `npx prettier --check .` — executed, reported 58 unformatted files spanning HTML pages, both partials, `css/`, `js/`, `scripts/`, `tests/`, and several config files including `.prettierrc.json` and `eslint.config.mjs`; `package.json` — `scripts.format:check`; `.github/workflows/code-quality-ci.yml` runs `lint:js`, `lint:css`, and `build`, but not `format:check`
- **Current behavior:** The project declares a Prettier configuration, a `.prettierignore`, and both `format` and `format:check` scripts, but the tracked sources do not satisfy that configuration and no workflow runs the check. Working-tree line endings are LF, so this is genuine formatting drift rather than a checkout artifact.
- **Impact:** The declared formatting standard is not the actual one. Anyone who runs `npm run format` will produce a 58-file diff unrelated to their change, which obscures review and raises the chance of spurious conflicts. Both lint tools are wired into CI, so the omission of the one check that currently fails makes the pipeline look more complete than it is.
- **Recommended direction:** Decide whether Prettier governs this repository. If yes, normalise the tracked files in one dedicated commit and add `format:check` to `code-quality-ci.yml`. If Prettier's HTML output is not wanted, narrow `.prettierignore` or the config to the file types it should own, then apply and enforce that narrower scope.
- **Verification criteria:** `npm run format:check` exits 0 on a clean checkout, and the same check runs in CI on pull requests and pushes to `main`.

### [P2-04] Checkout and newsletter forms submit personal data via GET on the no-JavaScript path

- **Classification:** Security exposure
- **Affected area:** Checkout form, newsletter form, progressive enhancement
- **Evidence:** `checkout.html:120` (`<form … data-checkout-form action="checkout-potwierdzenie.html" method="get">` with `name`, `email`, `phone`, `address`, `city`, and `zip` fields); `partials/footer.html:9` (`<form class="site-footer__subscribe" action="newsletter-potwierdzenie.html" method="get" data-newsletter-form>`); `js/modules/checkout.js:24-43` and `js/modules/newsletter.js:23-44` (both call `event.preventDefault()` and navigate to the action URL without a query string)
- **Current behavior:** With JavaScript active, neither form performs a native submission, so no field value reaches the URL. Without JavaScript — or before `js/app.js` finishes initialising, since initialisation is deferred until the partials fetch resolves — both forms fall back to their declared `method="get"`. The checkout form then appends a full name, e-mail address, phone number, street address, city, and postcode to the confirmation page URL; the newsletter form appends an e-mail address.
- **Impact:** On that path, personal data is written into the address bar, browser history, and the hosting provider's request logs, and would be forwarded in any same-origin referrer. The demo scope limits the consequences — nothing is stored or processed — but a checkout form that places a postal address in a URL is the wrong default for a page that also links to a privacy policy, and it is the behaviour a reviewer will read from the markup.
- **Recommended direction:** Change both forms' declared method so the no-JavaScript fallback does not carry field values in the URL, or remove the field-carrying fallback for these two forms specifically. The chosen mechanism should keep the existing JavaScript flow unchanged.
- **Verification criteria:** Submitting either form with JavaScript disabled produces a destination URL containing no field values.

### [P2-05] README claims Escape-key handling for the modal, which the modal does not implement

- **Classification:** Documentation mismatch
- **Affected area:** Legal information modal, accessibility documentation
- **Evidence:** `README.md:147` and `README.md:332` ("Escape-key handling, focus trapping, and focus restoration in the mobile drawer and modal"); `js/modules/legal-modal.js:88-89` (`trapFocus` returns immediately unless `event.key === "Tab"`); `js/modules/legal-modal.js:122` (the only `keydown` listener registered on the modal)
- **Current behavior:** The navigation drawer implements Escape (`js/modules/nav.js:154-156`), and the legal modal implements focus trapping and focus restoration — but no Escape handling. The modal's only exit is the "Akceptuję" button, and while it is open the body is scroll-locked.
- **Impact:** The README overstates the project's accessibility surface in both language sections, in a list that is otherwise accurate and deliberately hedged. A reviewer or maintainer reading it will assume dismissal-by-Escape is covered for the dialog and will not look for it. The behaviour itself may well be intentional for a mandatory acceptance notice; the documentation is what is currently wrong.
- **Recommended direction:** Decide whether the acceptance modal should be dismissible by Escape. If it should not, narrow the README claim to the mobile drawer in both sections. If it should, add the handler and route it through the same acceptance-and-restore path the button uses.
- **Verification criteria:** The README's accessibility list describes only mechanisms present in the source, and any Escape behaviour it claims for the modal is implemented.

### [P2-06] Catalog result count changes are not announced to assistive technology

- **Classification:** Source-visible risk
- **Affected area:** Catalog filtering and search, accessibility
- **Evidence:** `kategoria.html:116` (`<p class="badge" data-listing-count>0 produktów</p>`, no `aria-live` and no `role`); `js/modules/catalog.js:181-183` (`renderListing` rewrites its `textContent` on every update); `js/modules/catalog.js:309-332` (`updateListing` runs on every filter change, every debounced search keystroke, and every "show more" click)
- **Current behavior:** Filtering and searching update the visible result count and rebuild the grid without a page navigation. The count element has no live-region semantics. The only announced feedback is the separate `[data-listing-state]` region, which `js/modules/ui-state.js:22-23` gives `role="status"` — but that region is populated only when the result set is empty.
- **Impact:** A screen-reader user changing a filter from a result set of 24 to one of 5 receives no announcement at all; only the zero-result case is spoken. The count is present and correct on screen, so this is a gap in announcing an implemented interaction rather than missing information. Classified as a source-visible risk because it was not confirmed by assistive-technology testing in this audit.
- **Recommended direction:** Give the result-count element polite live-region semantics, or announce the count through the existing `[data-listing-state]` region for non-empty results as well. Whichever is chosen, only one of the two should announce, to avoid duplicate output.
- **Verification criteria:** Changing a filter or search term on `/kategoria.html` produces exactly one announcement carrying the new result count, in both the empty and non-empty cases.

### [P2-07] Travel-kit data path carries a stale cache-busting query that no other data path uses

- **Classification:** Maintenance risk
- **Affected area:** Data loading
- **Evidence:** `js/modules/travel-kits.js:24` (`const TRAVEL_KITS_DATA_PATH = "/data/travel-kits.json?v=20260406-2";`) against `js/modules/product-data.js:4` (`export const PRODUCTS_DATA_PATH = "/data/products.json";`); `netlify.toml` — the `/data/*` header block sets `Cache-Control: public, max-age=0, must-revalidate`
- **Current behavior:** One of the project's two data fetches carries a hand-maintained version query while the other does not. The deployment already sends `must-revalidate` for `/data/*`, so the query changes nothing about caching. `js/modules/data.js:8-10` keys its cache on the exact path string, so the versioned and unversioned forms of the same file would be treated as distinct entries.
- **Impact:** No current runtime effect — `travel-kits.json` has only this one consumer. It is an inconsistency of the same kind the project already eliminated from its import specifiers, and it leaves a date-stamped string that must be remembered and updated by hand to mean anything.
- **Recommended direction:** Align the travel-kit data path with `PRODUCTS_DATA_PATH` and let the deployment's cache policy handle revalidation, or, if a version query is wanted, apply the same mechanism to both paths from one place.
- **Verification criteria:** No hand-maintained version query remains on a data fetch path in `js/`, or every data path derives one from a single shared source.

## 7. Extra quality improvements

### Add a branded 404 page and wire it into the deployment

- **Relevant area:** Deployment and routing.
- **Current evidence:** No `404.html` exists at the repository root, `netlify.toml` declares no redirects or error-page handling, and `scripts/preview-dist.mjs:57-60` responds with a plain-text `Not found`. Any mistyped path — including `/produkt/<unknown-slug>/`, which is reachable from the site's own URL shape — currently drops the visitor onto the hosting provider's default page with no header, footer, or route back into the catalog.
- **Potential value:** Keeps a visitor inside the site on a bad URL, which matters more here than on most static sites because product and kit routes are slug-based and generated. It also removes a visible gap in what is otherwise a fully branded, consistently shelled set of pages.
- **Scope boundary:** Optional. The current behaviour is a standard hosting default, not a malfunction, and nothing in the project documentation promises a custom error page.

### Decide the `pointer-events` policy for the `aria-disabled` branch before the attribute is introduced

- **Relevant area:** Base button and link disabled states.
- **Current evidence:** `css/base.css:87-94` applies `pointer-events: none` to both of its selector lists, the second of which is the `[aria-disabled="true"]` branch covering `.btn`, `a`, `[role="button"]`, `.dropdown__toggle`, and `.nav-toggle`. The attribute is never set by JavaScript and never declared in markup — a repository-wide grep finds it only inside CSS selectors — so the branch currently matches no element at runtime.
- **Potential value:** The `aria-disabled` pattern exists specifically so an element stays focusable and reachable while being marked unavailable; `pointer-events: none` suppresses click-to-focus and hover feedback, working against that purpose. Settling this while the branch is inert avoids a silent behaviour change on the day the attribute is first used.
- **Scope boundary:** Optional, with no current runtime effect. Splitting the rule's two selector lists is one way to resolve it, but the decision belongs to the project owner.

### Extend `imageAlt` coverage across the product catalog

- **Relevant area:** Product imagery, accessibility.
- **Current evidence:** 4 of 35 records in `data/products.json` declare `imageAlt`. `js/modules/product-data.js:102` passes the field through when present, and `js/modules/product.js:270`, `js/modules/travel-kits.js:239`, and `scripts/build-dist.mjs:391` all fall back to `product.name`, so the remaining 31 products render an alt text identical to the adjacent visible heading.
- **Potential value:** The field, the pass-through, and the fallback chain are already built; only the data is thin. Filling it in converts the duplicated-name fallback into descriptive alternative text on catalog cards, kit cards, and prerendered product pages at once.
- **Scope boundary:** Optional. The current fallback produces valid, non-empty alternative text, so this is a quality improvement rather than a correction.

## 8. Current readiness conclusion

**Status:** Ready with minor refinements

No blocker prevents the project from being built, deployed, or used, and no P0 or open P1 finding remains. Both P1 findings are closed: the prerender contract is now explicit in the generated output and honoured by both detail-page modules, and the build transform that had been silently failing to unhide prerendered kit content is fixed. The prerendered routes now deliver their content to clients that do not execute JavaScript, which they demonstrably did not do before.

The seven open findings are all P2, contained, and independently addressable. Two of them — the dangling image references reaching production structured data (P2-01) and the GET-submitted personal data on the no-JavaScript path (P2-04) — touch what the deployed site publishes and are the most worthwhile to take next. The remainder concern maintainability, documentation accuracy, one accessibility announcement gap, and one stale data path.

This status reflects a repository-level review with static analysis and the linters actually executed, plus one owner-run `npm run qa:a11y` pass behind the two P1 resolutions. It is not an accessibility certification, a security guarantee, a browser-compatibility guarantee, or a statement about production performance, none of which were verified here.

## 9. Senior rating

**Rating:** 9/10

The architecture is coherent and the discipline behind it is visible in places that are usually neglected: one validated data loader serving every consumer, storage access guarded without exception, safe DOM construction throughout, a token system with almost no leakage, deliberate per-page indexing policy, and generated SEO output that regeneration reproduces exactly. Two CI workflows do real work, and the pre-paint theme script shows attention to a detail many projects leave broken. The documentation is largely honest about the project's limits — no order backend, no accounts, no service worker — which is rarer than it should be.

The score moves from 8 to 9 because both P1 findings are closed and closed well. The prerender contract is no longer an assumption the client makes about the server's output — it is declared in the HTML, read through one shared helper, and fails the build loudly if the marked root disappears. The fix also went further than the finding required, blocking the silent product substitution that would otherwise have contradicted a page's own canonical link and `Product` schema.

It is held at 9 rather than 10 by two things. First, the seven open P2 items, of which the dead asset URL in production structured data and the personal data placed in a URL on the no-JavaScript path affect what the deployed site actually publishes. Second, and more structurally, P1-02 demonstrated that the build's regex-based HTML transforms can stop matching and go on reporting success, with no lint rule, CI job, or test able to notice — a whole page's main content was shipped hidden for an unknown period. That layer is now known to be load-bearing and remains uncovered. The formatting drift across 58 files with no CI check behind it is a smaller instance of the same theme: declared standards the pipeline does not actually enforce. None of these are deep architectural problems; all are correctable without touching the structure the project has built.
