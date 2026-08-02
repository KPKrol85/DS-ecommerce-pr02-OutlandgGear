# Changelog

All significant changes to this project are documented in this file.

## [Unreleased]

### Added

- Added the initial Outland Gear front-end implementation as a standalone repository, including build, testing, and accessibility CI workflows.

### Changed

- Consolidated cart, catalog, product-detail, and travel-kit product data loading through one validated, memoized loader (`loadNormalizedProducts`) in `product-data.js`, replacing four duplicated fetch paths and adding `imageAlt` as a pass-through field.
- Changed project licensing from an MIT reference to proprietary KP_Code terms, establishing `LICENSE` as the single source of truth for project licensing.

### Fixed

- Fixed a cart-save failure message rendering as an informational toast instead of an error, and raised the info-toast border's dark-theme contrast from 1.05:1 to 6.33:1 with a dedicated `--color-toast-info-border` token.
- Fixed near-unreadable dark-theme toast text caused by reusing the text-role `--color-ink` token as the toast panel background; introduced a dedicated `--color-toast-bg` token.
- Fixed the product-page add-to-cart quantity input not enforcing its own `max` attribute before adding to the cart, which allowed quantities up to the cart's separate 99-unit ceiling.
- Fixed dark-theme contrast failures on solid buttons, the header search button, and the skip link by introducing theme-invariant `--color-brand-solid`/`--color-brand-solid-strong` tokens for solid CTA fills.
- Fixed illegible dark-theme text on legal-page content cards caused by a hardcoded white card background; switched to the theme-aware `--color-surface-base` token.
- Fixed `removeHiddenAttributeFromElement` in `scripts/build-dist.mjs` matching a literal space (`/\s hidden\b/`) rather than any whitespace (`/\s+hidden\b/`), which meant the `hidden` attribute was never actually stripped during the build; every generated `/komplety/<slug>/` page had been shipping its entire detail block hidden to clients that do not execute JavaScript, while the build reported success.
- Fixed client-side rendering treating prerendered detail-page content as a placeholder rather than the baseline. Build-generated `/produkt/<slug>/` and `/komplety/<slug>/` pages now carry `data-prerendered="true"` on their page root, read through a shared `isPrerenderedRoot` helper in `routes.js`; `travel-kits.js` no longer hides and rebuilds content that was already served, and both detail modules now report a data-fetch failure through a non-blocking `ui-state` banner instead of clearing the page root.
- Fixed the product page silently substituting a different product when a slug no longer resolves in the catalog data; on prerendered pages the `matchedProduct || products[0]` fallback is now blocked, so the page no longer renders one product under a URL, canonical link, and `Product` schema naming another.
- Fixed two products (`outland-summit-2p`, `outland-trek-pro-55l`) in `data/products.json` declaring a seventh `images` entry that pointed to a file never generated in `assets/img/products/`; the dangling entries reached production as dead URLs in the `Product.image` structured-data array on both indexable product pages. Removed from the product data; both products now declare 6 images, all resolving on disk.

### Security

- Upgraded `sharp` to the 0.35.x line to resolve a high-severity `libvips` advisory.

### Documentation

- Added a maintained front-end audit report (`doc/daily-AUDIT.md`) recording prioritized findings and their resolution status.

### Build and Tooling

- Declared supported Node.js versions (`>=20 <23`) in `package.json`'s `engines` field, covering the version pinned in CI and the version used locally.
- Added `.gitattributes` to enforce LF line endings at the Git level.
- Rewrote `.gitignore` with root-anchored patterns and added entries for Playwright caches and Windows-specific artifacts.
- Added ESLint and Stylelint linting, Prettier formatting configuration, and a `code-quality-ci` GitHub Actions workflow.

### Testing

- Added dark-theme coverage to the Playwright/`@axe-core` accessibility test suite, scanning routes in both light and dark themes.
- Retargeted the travel-kit loading-state accessibility scan from the prerendered `/komplety/<slug>/` route to the `komplety.html` template, the only route where that state still legitimately occurs now that prerendered pages skip the loading step.
