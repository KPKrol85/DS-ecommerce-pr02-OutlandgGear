import { CONFIG } from "../config.js";
import { qs, qsa, on, delegate } from "./dom.js";
import { debounce, formatCurrency } from "../utils.js";
import { addToCart, updateCartCount } from "./cart.js";
import { showToast } from "./toast.js";
import { createFallbackNotice } from "./fallback.js";
import { findProductById, loadNormalizedProducts } from "./product-data.js";
import { buildProductUrl } from "./routes.js";
import { clearUiState, setUiState } from "./ui-state.js";

const parseRange = (value) => {
  if (!value) return null;
  const [min, max] = value.split("-").map(Number);
  return { min, max };
};

const DEFAULT_SORT = "popularity";

const sorters = {
  popularity: (a, b) => b.rating * b.reviewsCount - a.rating * a.reviewsCount,
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  newest: (a, b) => b.id - a.id,
};

let addToCartHandlersBound = false;

const getOptionValue = (select, value, fallback = "") =>
  select && value && qsa("option", select).some((option) => option.value === value)
    ? value
    : fallback;

const syncUrlState = (state) => {
  const params = new URLSearchParams();

  if (state.searchTerm) params.set("q", state.searchTerm);
  if (state.price) params.set("price", state.price);
  if (state.rating) params.set("rating", state.rating);
  if (state.category) params.set("category", state.category);
  if (state.subcategory) params.set("subcategory", state.subcategory);
  if (state.badges.length) params.set("badges", state.badges.join(","));
  if (state.sort !== DEFAULT_SORT) params.set("sort", state.sort);
  if (state.limit > CONFIG.perPage) params.set("limit", String(state.limit));

  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
  history.replaceState(null, "", nextUrl);
};

const createCard = (product) => {
  const article = document.createElement("article");
  article.className = "card product-card";

  const media = document.createElement("div");
  media.className = "product-card__media";
  const img = document.createElement("img");
  img.src = product.images?.[0] || "";
  img.alt = product.name || "";
  img.loading = "lazy";
  img.decoding = "async";
  img.width = 320;
  img.height = 220;
  media.appendChild(img);

  if (Array.isArray(product.badges) && product.badges.length) {
    const badge = document.createElement("span");
    const badgeKey = product.badges[0].toLowerCase();
    badge.className = `badge product-card__badge badge--${badgeKey}`;
    badge.textContent = product.badges[0];
    media.appendChild(badge);
  }

  const body = document.createElement("div");
  body.className = "product-card__content";
  const title = document.createElement("h3");
  title.className = "product-card__title";
  title.textContent = product.name || "";

  const meta = document.createElement("div");
  meta.className = "product-card__meta";
  meta.textContent = `Ocena ${product.rating} • ${product.reviewsCount} opinii`;

  const price = document.createElement("div");
  price.className = "product-card__price";
  price.textContent = formatCurrency(product.price, product.currency);

  if (product.oldPrice) {
    const oldPrice = document.createElement("span");
    oldPrice.className = "product-card__price--old";
    oldPrice.textContent = formatCurrency(product.oldPrice, product.currency);
    price.appendChild(oldPrice);
  }

  const actions = document.createElement("div");
  actions.className = "product-card__actions";

  const viewLink = document.createElement("a");
  viewLink.href = buildProductUrl(product.slug);
  viewLink.className = "btn btn--outline btn--small";
  viewLink.textContent = "Zobacz";

  const addBtn = document.createElement("button");
  addBtn.className = "btn btn--small";
  addBtn.type = "button";
  addBtn.textContent = "Dodaj do koszyka";
  addBtn.setAttribute("data-add-to-cart", product.id);

  actions.append(viewLink, addBtn);
  body.append(title, price, meta, actions);

  article.append(media, body);
  return article;
};

const renderListing = (products, grid, countEl, limit) => {
  grid.innerHTML = "";
  const items = products.slice(0, limit);
  items.forEach((product) => grid.appendChild(createCard(product)));
  if (countEl) {
    countEl.textContent = `${products.length} produktów`;
  }
};

const applyFilters = (products, state) => {
  const term = state.searchTerm.toLowerCase();
  const range = parseRange(state.price);
  const minRating = Number(state.rating);

  return products
    .filter((product) => {
      const badges = Array.isArray(product.badges) ? product.badges : [];
      const name = product.name || "";
      const shortDescription = product.shortDescription || "";

      if (term) {
        const haystack = `${name} ${shortDescription} ${badges.join(" ")}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (state.category && product.category !== state.category) return false;
      if (state.subcategory && product.subcategory !== state.subcategory) return false;
      if (minRating && product.rating < minRating) return false;
      if (range && (product.price < range.min || product.price > range.max)) return false;
      if (state.badges.length) {
        const hasBadge = state.badges.some((badge) => badges.includes(badge));
        if (!hasBadge) return false;
      }
      return true;
    })
    .sort(sorters[state.sort] || sorters.popularity);
};

const renderCatalogLoadError = (grid, countEl, loadMoreBtn) => {
  if (!grid) return;
  grid.innerHTML = "";
  const fallback = createFallbackNotice({
    message: "Nie udało się załadować listy produktów. Spróbuj ponownie.",
    actionLabel: "Spróbuj ponownie",
    onAction: () => initCatalog(),
  });
  grid.appendChild(fallback);

  if (countEl) {
    countEl.textContent = "0 produktów";
  }

  if (loadMoreBtn) {
    loadMoreBtn.hidden = true;
    loadMoreBtn.setAttribute("aria-hidden", "true");
  }

  const emptyState = qs("[data-empty-state]");
  if (emptyState) {
    emptyState.hidden = true;
  }
};

const bindAddToCartTriggers = (products) => {
  if (addToCartHandlersBound) return;

  delegate(document, "[data-add-to-cart]", "click", (_, target) => {
    const productId = Number(target.getAttribute("data-add-to-cart"));
    const product = findProductById(products, productId);
    if (!product) return;

    const saved = addToCart(product, 1);
    if (!saved) return;

    updateCartCount();
    showToast(`Dodano „${product.name}” do koszyka.`, { type: "success" });
  });

  addToCartHandlersBound = true;
};

export const initCatalog = async () => {
  const grid = qs(CONFIG.selectors.listingGrid);
  const staticAddToCartButtons = qsa("[data-add-to-cart]");
  if (!grid && !staticAddToCartButtons.length) return;

  const form = qs(CONFIG.selectors.filtersForm);
  const countEl = qs(CONFIG.selectors.listingCount);
  const loadMoreBtn = qs(CONFIG.selectors.listingLoad);
  const searchInput = qs(CONFIG.selectors.searchInput);
  const stateRegion = qs("[data-listing-state]");

  let products = [];
  try {
    products = await loadNormalizedProducts();
  } catch (error) {
    console.error("Catalog data error", error);
    if (grid) {
      renderCatalogLoadError(grid, countEl, loadMoreBtn);
    }
    return;
  }

  bindAddToCartTriggers(products);

  if (!grid) return;

  const filterSelects = {
    price: form && qs("[name=price]", form),
    rating: form && qs("[name=rating]", form),
    subcategory: form && qs("[name=subcategory]", form),
    sort: form && qs("[name=sort]", form),
  };
  const badgeInputs = form ? qsa("[name=badge]", form) : [];

  const restoreStateFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const selectedBadges = new Set(
      (params.get("badges") || "").split(",").map((badge) => badge.trim()),
    );
    const limit = Number.parseInt(params.get("limit") || "", 10);
    const restoredState = {
      searchTerm: params.get("q")?.trim() || "",
      price: getOptionValue(filterSelects.price, params.get("price")),
      rating: getOptionValue(filterSelects.rating, params.get("rating")),
      category: params.get("category") || "",
      subcategory: getOptionValue(filterSelects.subcategory, params.get("subcategory")),
      badges: badgeInputs
        .filter((input) => selectedBadges.has(input.value))
        .map((input) => input.value),
      sort: getOptionValue(filterSelects.sort, params.get("sort"), DEFAULT_SORT),
      limit: Number.isInteger(limit) && limit >= CONFIG.perPage ? limit : CONFIG.perPage,
    };

    if (searchInput) searchInput.value = restoredState.searchTerm;
    for (const [name, select] of Object.entries(filterSelects)) {
      if (select) select.value = restoredState[name];
    }
    badgeInputs.forEach((input) => {
      input.checked = restoredState.badges.includes(input.value);
    });

    return restoredState;
  };

  let state = restoreStateFromUrl();

  const updateListing = () => {
    const filtered = applyFilters(products, state);
    renderListing(filtered, grid, countEl, state.limit);

    if (loadMoreBtn) {
      const hideLoadMore = filtered.length <= state.limit;
      loadMoreBtn.hidden = hideLoadMore;
      loadMoreBtn.setAttribute("aria-hidden", String(hideLoadMore));
    }

    if (filtered.length === 0) {
      // The result count above already announces via its own live region
      // (data-listing-count); silence this one so the empty state doesn't
      // fire a second, competing announcement for the same filter change.
      setUiState(stateRegion, {
        type: "empty",
        title: "Brak wyników",
        message: "Zmień filtry lub wpisz inną frazę wyszukiwania.",
        announce: false,
      });
    } else {
      clearUiState(stateRegion);
    }

    syncUrlState(state);
  };

  on(form, "change", ({ target }) => {
    const { name, value } = target;
    if (badgeInputs.includes(target)) {
      state.badges = badgeInputs
        .filter((input) => input.checked)
        .map((input) => input.value);
    } else if (filterSelects[name] === target) {
      state[name] = value || (name === "sort" ? DEFAULT_SORT : "");
    } else {
      return;
    }
    state.limit = CONFIG.perPage;
    updateListing();
  });

  if (searchInput) {
    const updateSearch = debounce((scheduledState) => {
      // Navigation replaces the state, making a queued search obsolete.
      if (scheduledState !== state) return;
      state.searchTerm = searchInput.value.trim();
      state.limit = CONFIG.perPage;
      updateListing();
    }, CONFIG.debounceMs);
    on(searchInput, "input", () => updateSearch(state));
  }

  if (loadMoreBtn) {
    on(loadMoreBtn, "click", () => {
      state.limit += CONFIG.perPage;
      updateListing();
    });
  }

  on(window, "popstate", () => {
    state = restoreStateFromUrl();
    updateListing();
  });

  updateListing();
};
