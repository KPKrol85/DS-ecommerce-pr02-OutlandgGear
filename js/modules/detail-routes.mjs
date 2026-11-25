export const PRODUCT_ROUTE_SEGMENT = "produkt";
export const TRAVEL_KIT_ROUTE_SEGMENT = "komplety";

export const normalizeSlug = (value) => (typeof value === "string" ? value.trim() : "");

const buildDetailPath = (segment, slug) => `/${segment}/${encodeURIComponent(slug)}/`;

export const buildProductPath = (slug) => buildDetailPath(PRODUCT_ROUTE_SEGMENT, slug);

export const buildTravelKitPath = (slug) =>
  buildDetailPath(TRAVEL_KIT_ROUTE_SEGMENT, slug);
