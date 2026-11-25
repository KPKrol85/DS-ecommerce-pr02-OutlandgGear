# Outland Gear — Technical Improvements

**Analysis date:** 2026-11-25  
**Project type:** Static multi-page e-commerce demo frontend (HTML, layered CSS, vanilla JavaScript ES modules, local JSON, Node.js build)  
**Analysis mode:** Evidence-based technical improvement review  
**Focus:** Project-wide technical implementation

## Improvement overview

Root HTML pages and shared partials define the storefront. Browser modules handle interactions and read catalog data from local JSON. The Node.js build uses the same data to prerender product and travel-kit pages and generate the sitemap. The proposals focus on contracts maintained in multiple places and repeated feature logic that can move into existing shared code.

## Proposed improvements

### IMP-TECH-01 — Share detail route definitions across browser and build

- **Affected area:** Product and travel-kit detail routing.
- **Evidence:** `js/modules/routes.js:1-35`, `scripts/seo-config.mjs:25-51`, `scripts/build-dist.mjs:711-725`, `index.html:394`, `index.html:590`.
- **Current implementation:** Browser link builders and slug resolvers use route segments defined in `routes.js`. SEO config repeats those segments in its pathname builders, and the prerender writer repeats them when choosing output directories.
- **Proposed improvement:** Define the two route segments and public pathname builders in one ES module that both the browser and Node.js can import. Use those segment definitions for prerender output placement.
- **Expected engineering value:** A route change has one programmatic source for client links, canonical pathnames, sitemap entries, and the directories that serve those paths.
- **Implementation scope:** Limit the change to the two dynamic route families. Keep location parsing in the browser, origin and indexing policy in the SEO layer, and filesystem path construction in the build.
- **Acceptance criteria:** For every current product and kit slug, the client-generated pathname matches the sitemap and prerender canonical pathname and resolves to the corresponding generated directory. Direct detail paths, `?slug=` template URLs, and existing homepage links still resolve as before.
- **Impact:** Medium
- **Effort:** Medium

### IMP-TECH-02 — Use one catalog state for rendering and URL updates

- **Affected area:** Catalog filters, search, and pagination state.
- **Evidence:** `js/modules/catalog.js:40-115`, `js/modules/catalog.js:191-234`, `js/modules/catalog.js:305-383`, `catalog.html:155-239`.
- **Current implementation:** The catalog decodes URL values, copies filter values to the controls, and reads them back for filtering and URL serialization. Each listing update also decodes the full URL state again to read the category.
- **Proposed improvement:** Keep one catalog state snapshot per listing update. Initialize or restore the snapshot from the URL, update it from control and pagination events, and pass it to both filtering and URL serialization.
- **Expected engineering value:** Each listing refresh uses the same values for the visible results and the shareable URL. Changes to a filter have an identifiable path from the control to the listing and URL.
- **Implementation scope:** Keep the change inside `catalog.js`. Use the existing form options for URL validation and derive numeric rating and price bounds where filtering needs them.
- **Acceptance criteria:** A bookmarked URL restores the selected controls, category, sort order, and result limit. Filter or search changes reset the limit, Load More increases it, and Back or Forward restores the URL-selected state. Existing parameter names, default omission, invalid-option handling, and result-count announcements are preserved.
- **Impact:** Medium
- **Effort:** Medium

### IMP-TECH-03 — Share client-side detail metadata updates

- **Affected area:** Browser updates to the document head on product and travel-kit pages.
- **Evidence:** `js/modules/product.js:11-19`, `js/modules/product.js:27-137`, `js/modules/product.js:405-413`, `js/modules/travel-kits.js:14-23`, `js/modules/travel-kits.js:28-63`, `js/modules/travel-kits.js:97-164`, `js/modules/travel-kits.js:462-466`.
- **Current implementation:** Both modules independently update the title, description, canonical link, social tags, and WebPage JSON-LD. They duplicate the tag lookup and creation routines and the social-image defaults. The product module also writes a Product schema.
- **Proposed improvement:** Introduce one browser-side writer for the shared head fields and fallback social-image metadata. Let each page supply its own title, description, and canonical URL.
- **Expected engineering value:** Shared selectors, tag creation, and social-image defaults have one owner. Product-specific schema values remain close to the product data that supplies them.
- **Implementation scope:** Update the two client modules and their shared writer. Keep page-specific URL and schema calculation local and retain the current calls on successful detail loads.
- **Acceptance criteria:** Both detail types produce their current title, canonical link, social tags, and WebPage JSON-LD after data loads. Existing elements are updated in place and repeated writes create no duplicate tags. The product page keeps its Product JSON-LD, and the build continues to supply metadata for pages served without client rendering.
- **Impact:** Medium
- **Effort:** Small

### IMP-TECH-04 — Share Tab wrapping between the drawer and modal

- **Affected area:** Keyboard focus handling in the mobile navigation drawer and legal-information modal.
- **Evidence:** `js/modules/nav.js:42-46`, `js/modules/nav.js:155-187`, `js/modules/legal-modal.js:5-14`, `js/modules/legal-modal.js:88-122`, `js/modules/dom.js:1-15`.
- **Current implementation:** Both overlays implement the same first and last focus checks, reverse wrapping from outside the scope, and fallback when no focusable element is available. The drawer listens on the document, while the modal listens on its own container.
- **Proposed improvement:** Move the Tab boundary handling into a shared DOM helper that receives the component's focus scope, candidate elements, and fallback target.
- **Expected engineering value:** The wrapping rules have one implementation, and each overlay still owns its focus candidates and open and close behavior.
- **Implementation scope:** Reuse `dom.js` and update the two Tab handlers. Keep listener placement, focus-candidate selection, dismissal, and focus restoration in the respective overlay modules.
- **Acceptance criteria:** In both overlays, Tab from the last candidate focuses the first, Shift+Tab from the first focuses the last, and the current fallback target receives focus when the candidate list is empty. The drawer still closes on Escape, and the modal still restores focus on acceptance.
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
