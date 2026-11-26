# OutlandGear — Quality Improvements

**Analysis date:** 2026-11-26  
**Project type:** Static multi-page e-commerce demo with vanilla JavaScript, local JSON data, and a Node.js build  
**Analysis mode:** Evidence-based quality improvement review  
**Focus:** Project-wide quality

## Improvement overview

OutlandGear uses versioned browser storage for the cart and local JSON for catalog and travel-kit content. Existing checks cover HTML transforms, detail routing, rendered accessibility, and keyboard interaction with overlays. The proposed checks cover how the storefront preserves user state across failures and navigation, and verify the product references used to render travel kits.

## Proposed improvements

### IMP-QUALITY-01 — Protect cart state when removal cannot be saved

- **Affected area:** Cart persistence and recovery on the cart page.
- **Evidence:** `js/modules/storage.js:20-34`, `js/modules/storage.js:48-52`, `js/modules/cart.js:17-42`, `js/modules/cart.js:73-77`, `js/modules/cart.js:248-261`, `tests/a11y/a11y.spec.js:36-61`, `tests/a11y/a11y-interactive.spec.js:51-81`
- **Current implementation:** The removal handler saves before refreshing the rows and header count. If the write fails, it shows a storage warning and leaves the rendered cart in place. Existing accessibility tests seed a cart for a page scan and exercise a failed add from a product page.
- **Proposed improvement:** Add a Playwright regression test for a failed removal followed by a successful retry.
- **Expected quality value:** Detect a regression that makes an item appear removed while it is still stored in the cart.
- **Implementation scope:** Seed one valid item and simulate a transient write failure for the existing cart key. Exercise the cart page's remove control and storage warning.
- **Acceptance criteria:** The failed removal preserves the stored cart, item row, and header count, and shows the storage warning. After writes recover, a second removal clears the row and warning, updates the count, and remains effective after reload.
- **Impact:** High
- **Effort:** Small

### IMP-QUALITY-02 — Validate travel-kit product references

- **Affected area:** Product membership in travel kits rendered during the build and in the browser.
- **Evidence:** `data/travel-kits.json:3-47`, `data/products.json`, `scripts/build-dist.mjs:510-514`, `js/modules/travel-kits.js:27-49`, `tests/build/template-contract.test.mjs:199-209`, `tests/build/template-contract.test.mjs:245-263`, `tests/build/template-contract.test.mjs:284-317`
- **Current implementation:** The build matches `productIds` by value and type. The browser converts the references to numbers and collects unresolved IDs. All 12 checked-in references resolve to catalog records. The card-rendering test uses a matched fixture, and the full-catalog test checks paths and canonical URLs.
- **Proposed improvement:** Extend the existing Node build-contract tests to validate kit membership against the checked-in product catalog.
- **Expected quality value:** Catch stale or ambiguous references and ID type mismatches before they can result in missing or inconsistent product cards.
- **Implementation scope:** Reuse the two JSON inputs already read by the contract suite and check the `productIds` relationship there.
- **Acceptance criteria:** Each kit has a nonempty list of distinct integer IDs, and every reference resolves to exactly one catalog record with the same numeric ID. A missing, repeated, or wrong-type reference fails the check with the kit slug and offending value.
- **Impact:** Medium
- **Effort:** Small

### IMP-QUALITY-03 — Protect filters in shared catalog URLs

- **Affected area:** Catalog filter and sort state restored from a URL.
- **Evidence:** `catalog.html:181-205`, `catalog.html:225-236`, `js/modules/catalog.js:33-48`, `js/modules/catalog.js:124-150`, `js/modules/catalog.js:229-264`, `js/modules/catalog.js:285-301`, `tests/a11y/a11y.spec.js:12-25`
- **Current implementation:** The catalog restores filter and sort controls from query parameters, renders from that state, and updates the URL when a control changes. The catalog accessibility test waits for a grid or state message before scanning.
- **Proposed improvement:** Add a Playwright regression test that opens a filtered link, changes the sort order, and reloads the resulting URL.
- **Expected quality value:** Catch divergence between the link, the visible controls, and the products shown to someone opening or reloading that link.
- **Implementation scope:** Use the existing subcategory and sort selects with a small catalog fixture containing matching products at different prices and a nonmatching product.
- **Acceptance criteria:** The initial URL sets both controls and shows only matching products in the requested order. Changing the sort updates the URL and visible order. Reloading restores the filter and the new order.
- **Impact:** Medium
- **Effort:** Small

### IMP-QUALITY-04 — Protect contact form recovery after a failed submission

- **Affected area:** Contact form input retention and retry.
- **Evidence:** `contact.html:197-212`, `js/modules/contact.js:28-54`, `js/modules/form-ux.js:62-80`, `tests/a11y/a11y.spec.js:70-76`
- **Current implementation:** The handler posts URL-encoded form data. An unsuccessful response re-enables submission and sets an error message, and a successful response navigates to confirmation. The contact accessibility test scans the rendered form.
- **Proposed improvement:** Add a Playwright regression test that rejects one submission and accepts the next.
- **Expected quality value:** Catch regressions that discard an entered message or leave the form unusable after a failed attempt.
- **Implementation scope:** Use synthetic input and intercept the form's existing POST with one unsuccessful response followed by a successful response.
- **Acceptance criteria:** After failure, the status reports the error, the button is enabled, and the input values are preserved. Retrying sends the same field values and reaches `/contact-confirmation.html` after success.
- **Impact:** Medium
- **Effort:** Small

### IMP-QUALITY-05 — Protect theme preference precedence

- **Affected area:** System color preference, persisted theme choice, and toggle state.
- **Evidence:** `index.html:60-75`, `partials/header.html:117-145`, `partials/header.html:179-207`, `js/modules/theme.js:45-67`, `js/modules/theme.js:70-106`, `tests/a11y/a11y.spec.js:133-142`, `tests/a11y/a11y.spec.js:158-162`
- **Current implementation:** Theme initialization uses a saved light or dark choice if present. The runtime follows system changes while storage has no explicit choice and keeps both theme toggles synchronized. The accessibility scans seed a fixed theme and check that it is applied.
- **Proposed improvement:** Add a Playwright regression test for switching from the system preference to a persisted manual choice.
- **Expected quality value:** Catch preference resets and stale `aria-pressed` states on the shared header controls.
- **Implementation scope:** Use the homepage, browser color-scheme emulation, and the existing theme toggle and storage key.
- **Acceptance criteria:** With no saved choice, a system change updates `html[data-theme]` and both toggle states. A manual selection is stored, takes precedence over a conflicting system preference, and is reflected in both toggles after reload.
- **Impact:** Medium
- **Effort:** Small

## Selection summary

The proposals extend existing rendering and routing checks to cover persisted state, failure recovery, data integrity, and accessible control state. Each can be implemented independently using the existing Node or Playwright setup. One focused check per proposal keeps the set suitable for a short development cycle.

## Analysis limitations

Verification covered repository source, configuration, and test assertions, plus four passing Node detail-route tests with in-memory prerendering. Evidence for the proposed browser workflows and Netlify form handling comes from repository source and test definitions.
