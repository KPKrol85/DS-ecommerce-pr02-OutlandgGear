# Outland Gear — Final Technical Front-End Audit

**Audit date:** 2026-08-01
**Project type:** Static multi-page demo e-commerce front end (MPA) built with semantic HTML, layered CSS, Vanilla JavaScript ES modules, local JSON data, and a Node.js build pipeline that generates `dist/` for Netlify deployment
**Audit mode:** Final repository and implementation review
**Current readiness:** Ready with minor refinements

## 1. Executive assessment

The implementation is coherent and matches its documented architecture. Product data flows through one validated loader, storage access is uniformly guarded, data-driven DOM construction avoids `innerHTML` for user- and data-derived content, and the design-token system is applied with unusual discipline — only 17 hardcoded colour values exist outside `css/tokens.css` across roughly 3,600 lines of CSS. Both CI workflows are real: linting and a production build on one, Playwright + axe scans on the other. The generated SEO output was verified byte-identical to a fresh regeneration from `data/`, and every asset path referenced from HTML resolves on disk.

No critical or important findings remain open. The prerender contract is now declared in the generated output and honoured by both detail-page modules, so the build's prerendered routes deliver their content without depending on JavaScript to reveal it.

Open findings are contained and all P2: a missing live region on the catalog result count and one stale cache-busting query.

The project is suitable for continued development and portfolio presentation within its documented demo scope.

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
- `npx prettier --check .` — executed and passed (exit 0)
- `git status` / `git log` — executed; working tree clean, branch `main` up to date with `origin/main`
- Regenerated `robots.txt` and `sitemap.xml` in memory from `scripts/seo-config.mjs` and `data/*.json` and compared against the tracked files — both byte-identical; sitemap contains 46 URLs (8 static + 35 product slugs + 3 travel-kit slugs)
- Resolved all 124 image paths declared in `data/products.json` and `data/travel-kits.json` against the filesystem — all present
- Resolved all 107 `src`/`href` asset references across the root HTML pages and both partials against the filesystem — 0 missing
- Cross-checked all 9 `sprite.svg#…` references against the ids declared in `assets/svg/sprite.svg` — all present
- Grepped the JavaScript, script, HTML, and JSON sources for credential-like strings, `.env` files, `TODO`/`FIXME`/`HACK`/`debugger`, and `console.log` in application code — none found; `console` use in `js/` is limited to `error` and `warn` diagnostics
- Confirmed the local Node.js version (v22.22.3) falls inside the declared `engines.node` range (`>=20 <23`)
- Statically inspected all remaining findings against current source; every line reference in this document was re-read at audit time and again after the prerender and build-transform changes shifted line numbers in `scripts/build-dist.mjs`, `js/modules/travel-kits.js`, and `js/modules/product.js`
- `npm run build:html` run into a scratch copy of the repository to inspect generated output — 38 of 38 detail pages carry `data-prerendered="true"`, no root or template page carries it, and the `hidden` attribute is stripped from prerendered kit content while the `komplety.html` template retains it

### Verification limitations

- `npm run build` was not executed. `scripts/build-dist.mjs:732` writes `robots.txt` and `sitemap.xml` into the repository root, which are tracked files, so the build is outside this audit's read-only constraint. Their content was verified in sync by regenerating them in memory instead.
- `npm run qa:a11y` was not executed in the audit environment. Its Playwright `webServer` runs `npm run build` (`playwright.config.js`), and no Playwright browser binaries are present there; installing them would require a dependency install, which is outside audit scope. The suite was subsequently run locally by the project owner after the prerender and build-transform changes, passing 42 of 42 — that run is the only test evidence behind those changes, and no browser, runtime, or full-build verification of them was performed in the audit environment.
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

None detected.

## 6. P2 — Minor refinements

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

No blocker prevents the project from being built, deployed, or used, and no P0 or P1 finding is open. The prerender contract is explicit in the generated output and honoured by both detail-page modules, so the prerendered routes deliver their content to clients that do not execute JavaScript.

The two open findings are all P2, contained, and independently addressable. They concern one accessibility announcement gap and one stale data path.

This status reflects a repository-level review with static analysis and the linters actually executed, plus one owner-run `npm run qa:a11y` pass. It is not an accessibility certification, a security guarantee, a browser-compatibility guarantee, or a statement about production performance, none of which were verified here.

## 9. Senior rating

**Rating:** 9/10

The architecture is coherent and the discipline behind it is visible in places that are usually neglected: one validated data loader serving every consumer, storage access guarded without exception, safe DOM construction throughout, a token system with almost no leakage, deliberate per-page indexing policy, and generated SEO output that regeneration reproduces exactly. Two CI workflows do real work, and the pre-paint theme script shows attention to a detail many projects leave broken. The documentation is largely honest about the project's limits — no order backend, no accounts, no service worker — which is rarer than it should be.

The prerender contract earns particular credit: it is not an assumption the client makes about the server's output but a marker declared in the HTML, read through one shared helper, with the build failing loudly if the marked root disappears. The detail-page modules treat the served document as the baseline and refuse to render a product that the page's own canonical link and `Product` schema do not name.

It is held at 9 rather than 10 by two things. First, the two open P2 items, none of which touch published output but which remain worth closing. Second, and more structurally, the build's regex-based HTML transforms are load-bearing and uncovered: a pattern there can stop matching and the build will still exit 0, with no lint rule, CI job, or test able to notice that the generated output changed. None of these are deep architectural problems; all are correctable without touching the structure the project has built.
