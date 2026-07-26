# OutlandGear — Development Plan

**Last reviewed:** 2026-07-26
**Project type:** Static multi-page e-commerce demo frontend (semantic HTML, layered CSS, Vanilla JavaScript ES modules, local JSON data, Node.js build pipeline, Netlify deployment)
**Plan status:** Active

## Planning principles

- The plan reflects the current verified project state.
- Main items are checked only when all required subtasks are complete.
- Generated output (`dist/`) is not treated as canonical source.
- Completed significant changes are recorded separately in `CHANGELOG.md`.
- Findings originate from `doc/daily-AUDIT.md`; only currently open findings appear as active work.

## Current priorities

1. `PH2-01` — Extend accessibility test coverage to interaction-only component states.
2. `PH2-02` — Collapse the duplicate `data.js` module instance.

## Phase 1 — Verified foundation (completed)

**Goal:** Establish canonical product-data loading, resolve known dark-theme contrast defects, and add baseline repository tooling.

- [x] **PH1-01 — Consolidate product-data loading through one validated loader**
  - `cart.js`, `catalog.js`, `product.js`, and `travel-kits.js` now share `loadNormalizedProducts` from `product-data.js` instead of four duplicated fetch paths.

- [x] **PH1-02 — Enforce the product-page quantity limit before adding to cart**
  - The add-to-cart handler clamps the requested quantity to the field's own `max` attribute and surfaces the clamp via a toast.

- [x] **PH1-03 — Fix dark-theme toast contrast and cart-save failure severity**
  - Added dedicated `--color-toast-bg` and `--color-toast-info-border` tokens; the cart-save failure now renders as an error toast instead of the implicit info fallback.

- [x] **PH1-04 — Add `.gitattributes` line-ending enforcement**
  - Normalizes line endings to LF at the Git level (`* text=auto eol=lf`).

- [x] **PH1-05 — Declare supported Node.js versions**
  - Added an `engines.node` range (`>=20 <23`) in `package.json`, covering the CI-pinned version and the local development version.

## Phase 2 — Open maintenance work

**Goal:** Close the two remaining open audit findings.

- [ ] **PH2-01 — Extend accessibility test coverage to interaction-only component states**
  - [ ] add at least one interaction-triggered scan for the toast component, the variant already found to fail
  - [ ] evaluate whether the same coverage is warranted for the nav drawer, search panel, legal modal, and state banners
  - [ ] keep the existing resting-state route scans unchanged
  - **Priority:** Medium — this gap already let two contrast defects reach production undetected
  - **Completion condition:** at least the toast component's accessible states are exercised and scanned by the automated suite, not only its resting DOM state
  - **Source:** `doc/daily-AUDIT.md` — P2-05

- [ ] **PH2-02 — Collapse the duplicate `data.js` module instance**
  - [ ] align `js/modules/travel-kits.js`'s import specifier for `data.js` with `js/modules/product-data.js`'s
  - [ ] verify both modules resolve to the same module instance after the change
  - **Priority:** Low — explicitly not a defect; `product-data`'s caching is unaffected
  - **Completion condition:** `data.js` is imported through one identical specifier across the project
  - **Source:** `doc/daily-AUDIT.md` — P2-04
