const SEO_ORIGIN = "https://e-commerce-pr02-outlandgear.netlify.app";

const INDEXABLE_PAGE_PATHS = [
  "/",
  "/catalog.html",
  "/about.html",
  "/contact.html",
  "/cookies.html",
  "/terms.html",
  "/privacy-policy.html",
  "/faq.html",
];

const NON_INDEXABLE_PAGE_PATHS = [
  "/product.html",
  "/travel-kits.html",
  "/checkout.html",
  "/checkout-confirmation.html",
  "/contact-confirmation.html",
  "/cart.html",
];

const resolveSeoUrl = (pathname) => new URL(pathname, `${SEO_ORIGIN}/`).toString();

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const normalizeSlug = (value) => (isNonEmptyString(value) ? value.trim() : "");

const buildProductPath = (slug) => `/produkt/${encodeURIComponent(slug)}/`;

const buildTravelKitPath = (slug) => `/komplety/${encodeURIComponent(slug)}/`;

const collectSlugPaths = (items, buildPath) => {
  const safeItems = Array.isArray(items) ? items : [];
  return safeItems
    .map((item) => normalizeSlug(item?.slug))
    .filter(Boolean)
    .map((slug) => buildPath(slug));
};

const buildRobotsTxt = () =>
  ["User-agent: *", "Allow: /", `Sitemap: ${resolveSeoUrl("/sitemap.xml")}`].join("\n") +
  "\n";

const buildSitemapXml = ({ products = [], travelKits = [] } = {}) => {
  const uniquePaths = Array.from(
    new Set([
      ...INDEXABLE_PAGE_PATHS,
      ...collectSlugPaths(products, buildProductPath),
      ...collectSlugPaths(travelKits, buildTravelKitPath),
    ]),
  );

  const urls = uniquePaths
    .map((pathname) => `  <url>\n    <loc>${resolveSeoUrl(pathname)}</loc>\n  </url>`)
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
};

export {
  INDEXABLE_PAGE_PATHS,
  NON_INDEXABLE_PAGE_PATHS,
  SEO_ORIGIN,
  buildProductPath,
  buildRobotsTxt,
  buildSitemapXml,
  buildTravelKitPath,
  resolveSeoUrl,
};
