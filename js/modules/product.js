import { CONFIG } from "../config.js";
import { qs, qsa, on } from "./dom.js";
import { formatCurrency } from "../utils.js";
import { addToCart, updateCartCount } from "./cart.js";
import { showToast } from "./toast.js";
import { createFallbackNotice } from "./fallback.js";
import { findProductBySlug, loadNormalizedProducts } from "./product-data.js";
import { buildProductUrl, isPrerenderedRoot, resolveProductSlug } from "./routes.js";
import { SITE_NAME, setDetailMetadata, setJsonLd } from "./detail-metadata.js";
import { setUiState, clearUiState } from "./ui-state.js";

const getMainImageAlt = (productName, index = 0) =>
  `Zdjęcie ${index + 1} produktu ${productName}`;
const getThumbLabel = (productName, index = 0) =>
  `Pokaż zdjęcie ${index + 1} produktu ${productName}`;
const THUMB_EMPTY_LABEL = "Miniatura produktu niedostępna";

const setProductMetadata = (product, slug) => {
  if (!product || !slug) return;

  const titleParts = [product.name, product.category, SITE_NAME];
  const pageTitle = titleParts.filter(Boolean).join(" | ");
  const description = [product.shortDescription, product.subcategory]
    .filter(Boolean)
    .join(" ");
  const canonicalHref = new URL(buildProductUrl(slug), window.location.origin).href;
  const formattedPrice = Number.isFinite(product.price) ? product.price.toFixed(2) : "";

  const imageUrl = setDetailMetadata({ pageTitle, description, canonicalHref });
  setJsonLd("product", {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || description,
    category: product.category || undefined,
    sku: String(product.id || slug),
    image: [imageUrl],
    url: canonicalHref,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency || "PLN",
      price: formattedPrice,
      availability:
        product.stockStatus === "Dostępny"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: canonicalHref,
    },
    aggregateRating: Number.isFinite(product.rating)
      ? {
          "@type": "AggregateRating",
          ratingValue: String(product.rating),
          reviewCount: String(product.reviewsCount || 0),
        }
      : undefined,
  });
};

const renderProduct = (product) => {
  const root = qs(CONFIG.selectors.productRoot);
  if (!root) return;

  const title = qs("[data-product-title]", root);
  const price = qs("[data-product-price]", root);
  const oldPrice = qs("[data-product-old-price]", root);
  const rating = qs("[data-product-rating]", root);
  const stock = qs("[data-product-stock]", root);
  const description = qs("[data-product-description]", root);
  const highlights = qs("[data-product-highlights]", root);
  const specs = qs("[data-product-specs]", root);

  if (title) title.textContent = product.name || "";
  if (price) price.textContent = formatCurrency(product.price, product.currency);
  if (oldPrice) {
    if (product.oldPrice) {
      oldPrice.textContent = formatCurrency(product.oldPrice, product.currency);
    } else {
      oldPrice.textContent = "";
    }
  }
  if (rating)
    rating.textContent = `Ocena ${product.rating} • ${product.reviewsCount} opinii`;
  if (stock) stock.textContent = product.stockStatus;
  if (description) description.textContent = product.shortDescription || "";

  if (highlights) {
    highlights.innerHTML = "";
    const items = Array.isArray(product.highlights) ? product.highlights : [];
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      highlights.appendChild(li);
    });
  }

  if (specs) {
    specs.innerHTML = "";
    Object.entries(product.specs || {}).forEach(([label, value]) => {
      const row = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = label;
      const td = document.createElement("td");
      td.textContent = value;
      row.append(th, td);
      specs.appendChild(row);
    });
  }

  const mainImage = qs("[data-product-main]", root);
  const thumbs = qsa("[data-product-thumb]", root);
  const images =
    Array.isArray(product?.images) && product.images.length ? product.images : [""];
  const setActiveThumb = (activeIndex) => {
    thumbs.forEach((thumb, index) => {
      thumb.setAttribute("aria-pressed", index === activeIndex ? "true" : "false");
      thumb.tabIndex = index === activeIndex ? 0 : -1;
    });
  };

  if (mainImage) {
    mainImage.src = images[0] || "";
    mainImage.alt = product.imageAlt || product.name || "";
  }

  setActiveThumb(0);

  thumbs.forEach((thumb, index) => {
    const img = qs("img", thumb);
    const imageSrc = images[index];
    const hasImage = Boolean(imageSrc);

    thumb.dataset.thumbEmpty = hasImage ? "false" : "true";
    thumb.hidden = !hasImage;
    thumb.disabled = !hasImage;

    if (img) {
      img.src = imageSrc || "";
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
    }

    thumb.setAttribute(
      "aria-label",
      hasImage ? getThumbLabel(product.name, index) : THUMB_EMPTY_LABEL,
    );

    on(thumb, "click", () => {
      if (mainImage && imageSrc) {
        mainImage.src = imageSrc;
        mainImage.alt = getMainImageAlt(product.name, index);
      }
      setActiveThumb(index);
    });
  });

  const addBtn = qs("[data-add-product]", root);
  const qtyInput = qs("[data-qty-input]", root);
  on(addBtn, "click", () => {
    const requestedQty = qtyInput ? Number(qtyInput.value) : 1;
    const maxQty = qtyInput ? Number(qtyInput.max) : NaN;
    const hasMaxLimit = Number.isFinite(maxQty) && maxQty > 0;
    const qty = hasMaxLimit ? Math.min(requestedQty, maxQty) : requestedQty;

    const saved = addToCart(product, qty);
    if (!saved) return;

    updateCartCount();

    if (hasMaxLimit && requestedQty > maxQty) {
      showToast(
        `Maksymalnie ${maxQty} szt. naraz. Dodano ${maxQty} szt. produktu „${product.name}”.`,
        { type: "warning" },
      );
      return;
    }

    showToast(`Dodano „${product.name}” do koszyka.`, { type: "success" });
  });
};

const renderRelated = (products, current) => {
  const grid = qs(CONFIG.selectors.relatedGrid);
  if (!grid) return;
  grid.innerHTML = "";
  const related = products
    .filter((item) => item.category === current.category && item.id !== current.id)
    .slice(0, 3);
  related.forEach((product) => {
    const article = document.createElement("article");
    article.className = "card product-card";
    const media = document.createElement("div");
    media.className = "product-card__media";
    const img = document.createElement("img");
    img.src = product.images[0];
    img.alt = product.name;
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 320;
    img.height = 220;
    media.appendChild(img);

    const body = document.createElement("div");
    body.className = "product-card__content";
    const title = document.createElement("h3");
    title.className = "product-card__title";
    title.textContent = product.name;

    const price = document.createElement("div");
    price.className = "product-card__price";
    price.textContent = formatCurrency(product.price, product.currency);

    const meta = document.createElement("p");
    meta.className = "product-card__meta";
    meta.textContent = `Ocena ${product.rating} • ${product.reviewsCount} opinii`;

    const actions = document.createElement("div");
    actions.className = "product-card__actions";

    const link = document.createElement("a");
    link.href = buildProductUrl(product.slug);
    link.className = "btn btn--outline btn--small";
    link.textContent = "Zobacz";

    actions.append(link);
    body.append(title, price, meta, actions);
    article.append(media, body);
    grid.appendChild(article);
  });
};

const renderProductLoadError = (root) => {
  if (!root) return;

  root.innerHTML = "";
  const section = document.createElement("section");
  section.className = "section";
  const container = document.createElement("div");
  container.className = "container";

  const fallback = createFallbackNotice({
    message: "Nie udało się załadować produktu. Odśwież stronę i spróbuj ponownie.",
    actionLabel: "Odśwież stronę",
    onAction: () => window.location.reload(),
  });

  container.appendChild(fallback);
  section.appendChild(container);
  root.appendChild(section);
};

const PRODUCT_REFRESH_ERROR_STATE = {
  type: "error",
  title: "Nie udało się odświeżyć danych",
  message:
    "Pokazujemy zapisaną wersję tej karty produktu. Odśwież stronę, aby spróbować ponownie.",
};

// On a prerendered page the served HTML is already complete, so a failed
// refresh is reported next to the content instead of replacing it.
const reportProductLoadFailure = (root, stateRegion) => {
  if (isPrerenderedRoot(root)) {
    setUiState(stateRegion, PRODUCT_REFRESH_ERROR_STATE);
    return;
  }

  renderProductLoadError(root);
};

export const initProduct = async () => {
  const root = qs(CONFIG.selectors.productRoot);
  if (!root) return;
  const stateRegion = qs("[data-product-state]", root);
  let products;
  try {
    products = await loadNormalizedProducts();
  } catch (error) {
    console.error("Product data error", error);
    reportProductLoadFailure(root, stateRegion);
    return;
  }

  const normalizedSlug = resolveProductSlug();
  const matchedProduct = findProductBySlug(products, normalizedSlug);

  // A prerendered page's URL, canonical link and product schema all commit to
  // one specific product, so a slug that no longer resolves must not fall back
  // to a different record. The built page stays as served, with the banner.
  if (!matchedProduct && isPrerenderedRoot(root)) {
    reportProductLoadFailure(root, stateRegion);
    return;
  }

  const product = matchedProduct || products[0];
  if (!product) {
    reportProductLoadFailure(root, stateRegion);
    return;
  }

  if (matchedProduct) {
    setProductMetadata(matchedProduct, normalizedSlug);
  }

  renderProduct(product);
  renderRelated(products, product);

  if (!matchedProduct && normalizedSlug) {
    setUiState(stateRegion, {
      type: "info",
      title: "Nie znaleźliśmy tego produktu",
      message: "Wyświetlamy najbliższą dostępną propozycję.",
    });
    return;
  }

  clearUiState(stateRegion);
};
