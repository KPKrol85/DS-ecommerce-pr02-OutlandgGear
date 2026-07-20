const PRODUCT_ROUTE_SEGMENT = "produkt";
const TRAVEL_KIT_ROUTE_SEGMENT = "komplety";

const normalizeSlug = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const normalizePathname = (pathname = "/") =>
  pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

const readSlugFromPath = (segmentName) => {
  const pathname = normalizePathname(window.location.pathname);
  const segments = pathname.split("/").filter(Boolean);
  const segmentIndex = segments.indexOf(segmentName);

  if (segmentIndex === -1) return "";
  return decodeURIComponent(segments[segmentIndex + 1] || "");
};

export const buildProductUrl = (slug) =>
  `/${PRODUCT_ROUTE_SEGMENT}/${encodeURIComponent(normalizeSlug(slug))}/`;

export const buildTravelKitUrl = (slug) =>
  `/${TRAVEL_KIT_ROUTE_SEGMENT}/${encodeURIComponent(normalizeSlug(slug))}/`;

export const resolveProductSlug = () =>
  normalizeSlug(
    new URLSearchParams(window.location.search).get("slug") ||
      readSlugFromPath(PRODUCT_ROUTE_SEGMENT),
  );

export const resolveTravelKitSlug = () =>
  normalizeSlug(
    new URLSearchParams(window.location.search).get("slug") ||
      readSlugFromPath(TRAVEL_KIT_ROUTE_SEGMENT),
  );
