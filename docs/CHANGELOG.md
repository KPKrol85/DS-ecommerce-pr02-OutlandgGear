# Changelog

All significant changes to Outland Gear are documented in this file.

## Entry policy

A change is significant when a future maintainer or the project owner would reasonably need to know that one of the following changed:

- user-visible behavior, including meaningful UI, UX, or public content changes;
- accessibility behavior or accessibility contracts;
- build behavior, build guards, or npm scripts;
- test infrastructure or verification tooling;
- the dependency set;
- deployment or hosting workflow;
- PWA, service-worker, cache, or offline behavior;
- architecture, sources of truth, or important project maintenance contracts.

Judge by impact, not by file count. A small visual change is recorded when it affects behavior, accessibility, or a shared component contract. Editing a file alone does not justify an entry.

Not recorded: improvement-report status updates and archiving, commit-only or tracking-document changes, temporary verification probes, minor internal documentation corrections, and isolated cosmetic adjustments without broader impact.

For each implementation task, determine `Changelog: yes` or `Changelog: no`. Add entries only when authorized within the approved task scope.

## [Unreleased]

### Added

- Added the initial Outland Gear frontend with production build tooling, automated tests, and accessibility CI workflows.
- Added a themed `404.html` page with `noindex`, root-relative asset resolution, and HTTP 404 handling in the production preview.

### Changed

- Renamed 11 public HTML pages to English filenames and preserved legacy URLs through HTTP 301 redirects.
- Consolidated product-data loading across cart, catalog, product, and travel-kit modules using the validated, memoized `loadNormalizedProducts` loader.
- Replaced the MIT license reference with proprietary KP_Code terms, establishing `LICENSE` as the licensing source of truth.
- Made `scripts/build-dist.mjs` importable for isolated transform testing and deferred toolchain imports without changing generated output.
- Centralized product and travel-kit route definitions for browser links, SEO, and prerendered pages.

### Fixed

- Fixed cart-save error notifications and improved dark-theme info-toast border contrast from 1.05:1 to 6.33:1.
- Fixed dark-theme toast readability by introducing the dedicated `--color-toast-bg` token.
- Fixed product quantity validation to enforce the input's `max` attribute before adding items to the cart.
- Fixed dark-theme contrast on solid buttons, header search controls, and skip links using dedicated brand-color tokens.
- Fixed legal-page card readability in dark mode by replacing the hardcoded white background with `--color-surface-base`.
- Fixed prerendered travel-kit content remaining hidden without JavaScript by correcting whitespace handling in `removeHiddenAttributeFromElement`.
- Fixed prerendered detail pages being unnecessarily rebuilt by introducing the `data-prerendered` contract and non-blocking data-fetch error handling.
- Fixed incorrect product fallback behavior when a requested slug does not match the catalog data.
- Removed invalid product image references from `outland-summit-2p` and `outland-trek-pro-55l`, correcting their structured-data image URLs.
- Removed unused `--ui-state-bg` properties and introduced theme-aware error and success border tokens.
- Reformatted 58 tracked files to satisfy the repository's Prettier configuration.
- Changed checkout and newsletter forms to POST to prevent personal data exposure in URLs during no-JavaScript submission.
- Corrected README descriptions of Escape-key behavior for the mobile drawer and legal modal.
- Added live-region announcements for catalog result counts while preventing duplicate empty-state announcements.
- Fixed `[aria-disabled="true"]` pointer handling without changing native disabled-control behavior.
- Removed obsolete cache-busting query parameters from travel-kit data loading and its HTML template.
- Fixed four HTML build transforms to support formatted attributes and restore product images, gallery thumbnails, and travel-kit CTA content.
- Fixed legal modal readability in light mode by introducing theme-aware backgrounds, borders, text, and link colors.
- Fixed Playwright compatibility in Accessibility CI by pinning the runner to Ubuntu 24.04.

### Security

- Upgraded `sharp` to 0.35.x to address a high-severity `libvips` vulnerability.

### Documentation

- Added verified third-party attribution and distributed upstream license notices with production assets.
- Added `doc/daily-AUDIT.md` to track prioritized audit findings and resolution status.

### Build and Tooling

- Declared supported Node.js versions (`>=20 <23`) in `package.json`.
- Added `.gitattributes` to enforce LF line endings.
- Updated `.gitignore` with root-anchored rules and additional tool-cache exclusions.
- Added ESLint, Stylelint, Prettier, and the `code-quality-ci` GitHub Actions workflow.
- Added `npm run format:check` to CI to enforce formatting consistency.
- Added `npm run test:build` to CI to detect HTML transform regressions before production builds.

### Testing

- Extended Playwright and axe accessibility tests to cover both light and dark themes.
- Moved the travel-kit loading-state accessibility test to the non-prerendered HTML template.
- Added `tests/build/` coverage for HTML transformations and real-template prerender contracts, including regression detection for failed markup matching.
