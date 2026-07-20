# Outland Gear

## PL

### Przegląd projektu
Outland Gear to statyczny, wielostronicowy front-end sklepu e-commerce zbudowany w oparciu o HTML, CSS i JavaScript (ES modules). Projekt obejmuje katalog produktów, strony szczegółowe produktów, stronę kompletów podróżnych, koszyk, checkout, kontakt, FAQ oraz strony regulaminowe.

Aplikacja działa jako MPA i korzysta z części wspólnych (header/footer) ładowanych do stron przez partiale. W buildzie generowane są także prerenderowane adresy dla produktów i kompletów podróżnych (np. `/produkt/<slug>/` i `/komplety/<slug>/`).

### Kluczowe funkcje
- Dynamiczny katalog produktów oparty o `data/products.json`:
  - filtrowanie (cena, ocena, podkategoria, badge),
  - sortowanie,
  - wyszukiwanie,
  - paginacja typu „load more”,
  - synchronizacja stanu filtrów z URL.
- Dynamiczne strony produktów oraz zestawów podróżnych na podstawie slugów i danych JSON.
- Koszyk oparty o `localStorage` (dodawanie produktów, zmiana ilości, usuwanie, podsumowanie zamówienia).
- Formularz checkout z walidacją klienta i czyszczeniem koszyka po poprawnym submit.
- Formularz kontaktowy (POST `application/x-www-form-urlencoded`) oraz formularz newslettera z walidacją.
- Obsługa motywu jasny/ciemny (preferencje systemowe + zapis wyboru w `localStorage`).
- Widoki stanu UI i fallbacki błędów dla scenariuszy ładowania danych / problemów storage.

### Stack technologiczny
**Runtime / front-end**
- HTML5 (wielostronicowa aplikacja)
- CSS3 (podział na `tokens`, `base`, `layout`, `components`, `pages`)
- Vanilla JavaScript (ES modules)
- JSON jako lokalne źródło danych (`data/*.json`)

**Build / tooling**
- Node.js + npm scripts
- PostCSS (`postcss-import`, `cssnano`)
- esbuild (bundling i minifikacja JS)
- sharp (optymalizacja obrazów)
- własne skrypty Node (`scripts/build-dist.mjs`, `scripts/optimize-images.mjs`, `scripts/preview-dist.mjs`)

**QA / CI**
- Playwright
- axe-core (testy a11y)
- GitHub Actions (`.github/workflows/accessibility-ci.yml`)

### Struktura projektu
```text
pr-02-outlandgear/
├── assets/                 # obrazy, fonty, favicony, logo, svg
├── css/
│   ├── components/         # style komponentów UI
│   ├── pages/              # style stron
│   ├── tokens.css          # tokeny projektowe
│   ├── base.css            # style bazowe
│   ├── layout.css          # layout
│   └── main.css            # główny punkt wejścia CSS
├── data/                   # dane produktów, kategorii i kompletów
├── js/
│   ├── modules/            # moduły funkcjonalne (catalog, cart, checkout, itp.)
│   ├── app.js              # bootstrap aplikacji
│   └── config.js           # konfiguracja selektorów i ustawień
├── partials/               # współdzielony header/footer
├── scripts/                # build, preview, SEO, optymalizacja obrazów
├── tests/a11y/             # testy dostępności (Playwright + axe)
├── .github/workflows/      # CI accessibility
├── *.html                  # strony MPA
├── robots.txt
├── sitemap.xml
├── netlify.toml
└── package.json
```

### Instalacja i konfiguracja
```bash
npm ci
```

### Development lokalny
Projekt nie używa dedykowanego dev servera. Dostępne są zadania watch dla assetów:

```bash
npm run watch:css
npm run watch:js
```

Do lokalnego podglądu aplikacji używany jest build `dist`:

```bash
npm run build:preview
```

### Build produkcyjny
Pełny build:

```bash
npm run build
```

Wybrane zadania:

```bash
npm run clean:dist
npm run build:prepare
npm run build:css
npm run build:js
npm run build:images
npm run build:html
npm run build:assets
npm run build:seo
```

### Deployment
Repozytorium zawiera konfigurację Netlify (`netlify.toml`):
- build command: `npm run build`
- katalog publikacji: `dist`
- nagłówki bezpieczeństwa i polityki cache dla HTML/CSS/JS/assets

### Dostępność
W projekcie zaimplementowano i zautomatyzowano elementy dostępności:
- link „skip to content” (`.skip-link`) na stronach,
- semantyczne landmarki (`header`, `main`, `footer`),
- etykiety i komunikaty walidacji w formularzach,
- testy a11y oparte o Playwright + axe-core dla głównych tras,
- pipeline CI uruchamiający testy dostępności przy push/PR.

### SEO
Wdrożone elementy SEO obejmują:
- `meta description`, `canonical`, `robots`, Open Graph, Twitter Card,
- dane strukturalne JSON-LD (`Organization`, `WebPage`, `Product`),
- `robots.txt` i `sitemap.xml`,
- generowanie sitemap/robots i metadanych stron produktowych/kompletów podczas builda.

### Wydajność
W repozytorium widać następujące techniki związane z wydajnością:
- minifikacja CSS (PostCSS + cssnano) i JS (esbuild) do `dist`,
- bundling modułów JS do jednego pliku produkcyjnego,
- zoptymalizowane obrazy (AVIF/WebP/JPG) i pipeline oparty o sharp,
- `loading="lazy"` i `decoding="async"` dla obrazów renderowanych dynamicznie,
- prerender ścieżek szczegółowych (produkty, komplety) w procesie build.

### Utrzymanie projektu
- Główna orkiestracja front-endu: `js/app.js`.
- Logika domenowa jest rozdzielona na moduły (`catalog.js`, `product.js`, `cart.js`, `checkout.js`, `travel-kits.js`, `faq.js`, `newsletter.js`, `contact.js`).
- Dane wejściowe aplikacji utrzymywane są w `data/*.json`.
- Konfiguracja selektorów i stałych aplikacji znajduje się w `js/config.js`.
- Build i generowanie artefaktów SEO/HTML są kontrolowane przez `scripts/build-dist.mjs` oraz `scripts/seo-config.mjs`.

### Licencja
Projekt jest udostępniony na licencji MIT. Szczegóły: `LICENSE`.

## EN

### Project Overview
Outland Gear is a static multi-page e-commerce front-end built with HTML, CSS, and JavaScript (ES modules). The project includes a product catalog, product detail pages, a travel kits page, cart, checkout, contact, FAQ, and legal pages.

The application is implemented as an MPA and uses shared header/footer partials injected into pages at runtime. The build process also generates prerendered routes for products and travel kits (for example `/produkt/<slug>/` and `/komplety/<slug>/`).

### Key Features
- Dynamic product catalog powered by `data/products.json` with:
  - filtering (price, rating, subcategory, badges),
  - sorting,
  - search,
  - load-more pagination,
  - URL-synced filter state.
- Dynamic product and travel kit detail pages resolved from slugs and JSON data.
- `localStorage`-based cart (add items, update quantity, remove items, order summary).
- Checkout form with client-side validation and cart reset after successful submit.
- Contact form (POST `application/x-www-form-urlencoded`) and newsletter form with validation.
- Light/dark theme support (system preference + persisted selection in `localStorage`).
- UI state handling and error fallback views for data loading / storage failure scenarios.

### Tech Stack
**Runtime / front-end**
- HTML5 (multi-page application)
- CSS3 (`tokens`, `base`, `layout`, `components`, `pages` layers)
- Vanilla JavaScript (ES modules)
- JSON as local data source (`data/*.json`)

**Build / tooling**
- Node.js + npm scripts
- PostCSS (`postcss-import`, `cssnano`)
- esbuild (JS bundling and minification)
- sharp (image optimization)
- custom Node scripts (`scripts/build-dist.mjs`, `scripts/optimize-images.mjs`, `scripts/preview-dist.mjs`)

**QA / CI**
- Playwright
- axe-core (a11y tests)
- GitHub Actions (`.github/workflows/accessibility-ci.yml`)

### Project Structure
```text
pr-02-outlandgear/
├── assets/                 # images, fonts, favicons, logo, svg
├── css/
│   ├── components/         # UI component styles
│   ├── pages/              # page-level styles
│   ├── tokens.css          # design tokens
│   ├── base.css            # base styles
│   ├── layout.css          # layout styles
│   └── main.css            # CSS entry point
├── data/                   # product, category, and travel kit data
├── js/
│   ├── modules/            # feature modules (catalog, cart, checkout, etc.)
│   ├── app.js              # app bootstrap
│   └── config.js           # selectors and runtime config
├── partials/               # shared header/footer partials
├── scripts/                # build, preview, SEO, image optimization
├── tests/a11y/             # accessibility tests (Playwright + axe)
├── .github/workflows/      # accessibility CI
├── *.html                  # MPA pages
├── robots.txt
├── sitemap.xml
├── netlify.toml
└── package.json
```

### Setup and Installation
```bash
npm ci
```

### Local Development
The repository does not define a dedicated dev server. Watch tasks are available for assets:

```bash
npm run watch:css
npm run watch:js
```

For local preview, the project uses a production build served from `dist`:

```bash
npm run build:preview
```

### Production Build
Full build:

```bash
npm run build
```

Selected tasks:

```bash
npm run clean:dist
npm run build:prepare
npm run build:css
npm run build:js
npm run build:images
npm run build:html
npm run build:assets
npm run build:seo
```

### Deployment
The repository includes Netlify configuration (`netlify.toml`):
- build command: `npm run build`
- publish directory: `dist`
- security headers and cache policies for HTML/CSS/JS/assets

### Accessibility
The project includes implemented and automated accessibility-related elements:
- skip-to-content link (`.skip-link`) on pages,
- semantic landmarks (`header`, `main`, `footer`),
- form labels and validation status messaging,
- Playwright + axe-core accessibility tests across primary routes,
- CI pipeline running accessibility checks on push/pull request.

### SEO
Implemented SEO surface includes:
- `meta description`, `canonical`, `robots`, Open Graph, Twitter Card,
- JSON-LD structured data (`Organization`, `WebPage`, `Product`),
- `robots.txt` and `sitemap.xml`,
- build-time generation of sitemap/robots and detail-page metadata for products/travel kits.

### Performance
Repository-evidenced performance-related practices include:
- CSS minification (PostCSS + cssnano) and JS minification (esbuild) into `dist`,
- JS module bundling into a production artifact,
- optimized image variants (AVIF/WebP/JPG) with a sharp-based pipeline,
- `loading="lazy"` and `decoding="async"` on dynamically rendered images,
- prerendered detail routes (products, travel kits) during build.

### Project Maintenance
- Front-end orchestration entry point: `js/app.js`.
- Domain logic is split into focused modules (`catalog.js`, `product.js`, `cart.js`, `checkout.js`, `travel-kits.js`, `faq.js`, `newsletter.js`, `contact.js`).
- Application source data is maintained in `data/*.json`.
- Shared selectors and runtime constants are defined in `js/config.js`.
- Build and SEO/HTML artifact generation are controlled via `scripts/build-dist.mjs` and `scripts/seo-config.mjs`.

### License
This project is released under the MIT License. See `LICENSE`.
