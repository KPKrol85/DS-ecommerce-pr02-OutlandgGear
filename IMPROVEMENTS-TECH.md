# Outland Gear — Technical Improvements

**Analysis date:** 2026-11-25  
**Project type:** Static multi-page e-commerce demo frontend (HTML, layered CSS, vanilla JavaScript ES modules, local JSON, Node.js build)  
**Analysis mode:** Evidence-based technical improvement review  
**Focus:** Project-wide technical implementation

## Improvement overview

Root HTML pages and shared partials define the storefront. Browser modules handle interactions and read catalog data from local JSON. The Node.js build uses the same data to prerender product and travel-kit pages and generate the sitemap. The proposals focus on contracts maintained in multiple places and repeated feature logic that can move into existing shared code.

## Proposed improvements

### IMP-TECH-01 — Share detail route definitions across browser and build

- **Status:** COMPLETED — implemented and verified.
- **Result:** Centralized detail route segments and pathname builders for browser links, SEO, and prerender output while preserving existing URLs and slug handling.
- **Verification:** `npm run test:build` passed all 36 tests, covering 35 product routes, 3 travel-kit routes, and 7 homepage links. esbuild bundled the production JavaScript entry point in memory. Full production output and browser runtime verification remain pending.
- **Impact:** Medium
- **Effort:** Medium

### IMP-TECH-02 — Use one catalog state for rendering and URL updates

- **Status:** COMPLETED — implemented and verified.
- **Result:** Catalog filtering, sorting, pagination, and URL serialization share one state. Restoring the state during history navigation invalidates queued search updates.
- **Verification:** Eight focused Playwright tests passed in Chrome against the production preview. Syntax, ESLint, Prettier, and diff checks passed. A baseline comparison reproduced the existing Load More visibility issue caused by CSS overriding `hidden`.
- **Impact:** Medium
- **Effort:** Medium

### IMP-TECH-03 — Share client-side detail metadata updates

- **Status:** COMPLETED — implemented and verified.
- **Result:** Centralized browser-side metadata and JSON-LD writes for product and travel-kit detail pages while preserving page-specific values and fallback image settings.
- **Verification:** All 18 focused Playwright tests passed in Chrome against the production preview, covering both route forms, JSON-LD, DOM identity, element creation, repeated writes, failed and unmatched loads, and prerendering without JavaScript. All 36 build tests and focused syntax, ESLint, Prettier, and diff checks passed.
- **Impact:** Medium
- **Effort:** Small

### IMP-TECH-04 — Share Tab wrapping between the drawer and modal

- **Status:** COMPLETED — implemented and verified.
- **Result:** Centralized Tab wrapping and fallback focus in a shared DOM helper. The drawer passes its container from a document listener, and the legal modal passes its panel from a modal listener.
- **Verification:** Five focused Playwright tests passed in Chromium, covering native Tab navigation, wrapping, fallback focus, Escape, focus restoration, scroll unlocking, and acceptance storage. Syntax, ESLint, Prettier, and diff checks passed. The preview server required manual shutdown on Windows.
- **Impact:** Medium
- **Effort:** Small

### IMP-TECH-05 — Centralize client-side form setup

- **Affected area:** Shared setup for the contact, checkout, and newsletter forms.
- **Evidence:** `js/modules/form-ux.js:69-80`, `js/modules/form-ux.js:99-115`, `js/modules/contact.js:11-22`, `js/modules/checkout.js:10-24`, `js/modules/newsletter.js:12-23`.
- **Current implementation:** Each form initializer sets `noValidate`, initializes field feedback, and registers a `pageshow` handler that resets the submit button when the page is restored from the back-forward cache.
- **Proposed improvement:** Put the common initialization sequence in `form-ux.js` and have each form call it after locating its form element.
- **Expected engineering value:** Client validation setup and cached-page submit reset have one owner across all three forms.
- **Implementation scope:** Move the setup code and retain each form's submission handler, messages, and success target in its feature module.
- **Acceptance criteria:** All three forms initialize the existing field feedback and restore the default button label and enabled state on a persisted `pageshow` event. Contact submission still uses its Netlify POST flow, checkout clears the local cart before redirecting, and newsletter submission keeps its demo confirmation flow.
- **Impact:** Low
- **Effort:** Small

## Selection summary

The route and catalog proposals address contracts exercised by several entry points. The remaining proposals consolidate behavior already used by multiple features. Each can be implemented independently. The routing and metadata proposals share detail-page verification paths and can be checked together if scheduled in the same cycle. The set is sized for focused development work, with cross-environment route and catalog history checks accounting for the two medium-effort items.

## Analysis limitations

The analysis used repository source, configuration, and existing test definitions. Browser behavior, generated-page parity, and live deployment behavior were not verified during this review.
