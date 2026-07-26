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
