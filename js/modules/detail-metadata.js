import { qs } from "./dom.js";

export const SITE_NAME = "Outland Gear";
const SITE_URL = "https://e-commerce-pr02-outlandgear.netlify.app/";
const FALLBACK_SOCIAL_IMAGE = {
  path: "assets/og-img/og-img.png",
  alt: "Grafika Outland Gear przedstawiająca leśny krajobraz, góry, jezioro i centralne logo marki w zielono-beżowej kolorystyce.",
  type: "image/png",
  width: "1536",
  height: "1024",
};

const setMetaContent = (attribute, name, content) => {
  let tag = qs(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

export const setJsonLd = (schema, payload) => {
  let script = qs(`script[data-schema="${schema}"]`);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema", schema);
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(payload);
};

export const setDetailMetadata = ({ pageTitle, description, canonicalHref }) => {
  const imageUrl = new URL(FALLBACK_SOCIAL_IMAGE.path, window.location.origin).href;

  document.title = pageTitle;
  setMetaContent("name", "description", description);
  qs('link[rel="canonical"]')?.setAttribute("href", canonicalHref);

  setMetaContent("property", "og:title", pageTitle);
  setMetaContent("property", "og:description", description);
  setMetaContent("property", "og:url", canonicalHref);
  setMetaContent("property", "og:image", imageUrl);
  setMetaContent("property", "og:image:alt", FALLBACK_SOCIAL_IMAGE.alt);
  setMetaContent("property", "og:image:type", FALLBACK_SOCIAL_IMAGE.type);
  setMetaContent("property", "og:image:width", FALLBACK_SOCIAL_IMAGE.width);
  setMetaContent("property", "og:image:height", FALLBACK_SOCIAL_IMAGE.height);

  setMetaContent("name", "twitter:title", pageTitle);
  setMetaContent("name", "twitter:description", description);
  setMetaContent("name", "twitter:image", imageUrl);

  setJsonLd("webpage", {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description,
    url: canonicalHref,
    inLanguage: "pl-PL",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  });

  // The Product schema uses the same image URL as the social tags.
  return imageUrl;
};
