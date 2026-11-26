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

- **Status:** COMPLETED — implemented and verified.
- **Result:** Centralized custom validation setup, field feedback, and BFCache submit-state restoration across the contact, checkout, and newsletter forms.
- **Verification:** Six focused Playwright tests passed in Chrome for validation, ARIA, focus, intercepted contact POST outcomes, checkout cart clearing, and the newsletter redirect. BFCache coverage used simulated `pageshow` events with both `persisted` values. Syntax, ESLint, Prettier, and diff checks passed.
- **Impact:** Low
- **Effort:** Small

## Selection summary

The route and catalog proposals address contracts exercised by several entry points. The remaining proposals consolidate behavior already used by multiple features. Each can be implemented independently. The routing and metadata proposals share detail-page verification paths and can be checked together if scheduled in the same cycle. The set is sized for focused development work, with cross-environment route and catalog history checks accounting for the two medium-effort items.

## Analysis limitations

The analysis used repository source, configuration, and existing test definitions. Browser behavior, generated-page parity, and live deployment behavior were not verified during this review.
