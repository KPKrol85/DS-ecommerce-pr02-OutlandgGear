import { CONFIG } from "./config.js?v=20260405-3";
import { qs, on } from "./modules/dom.js?v=20260405-3";
import { initNav } from "./modules/nav.js?v=20260405-3";
import {
  initPartials,
  PARTIALS_READY_EVENT,
} from "./modules/partials.js?v=20260405-3";
import { initCatalog } from "./modules/catalog.js?v=20260405-3";
import { initProduct } from "./modules/product.js?v=20260405-3";
import { initCart, updateCartCount } from "./modules/cart.js?v=20260405-3";
import { initCheckout } from "./modules/checkout.js?v=20260405-3";
import { initContactForm } from "./modules/contact.js?v=20260405-3";
import { initLegalModal } from "./modules/legal-modal.js?v=20260405-3";
import { initFaq } from "./modules/faq.js?v=20260405-3";
import { initNewsletterForm } from "./modules/newsletter.js?v=20260405-3";
import { initTheme } from "./modules/theme.js?v=20260409-darkmode";
import { initTravelKits } from "./modules/travel-kits.js?v=20260406-3";

const initSearch = () => {
  const form = qs(CONFIG.selectors.searchForm);
  const input = qs(CONFIG.selectors.searchInput);
  if (!form || !input) return;

  on(form, "submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    const target = query
      ? `kategoria.html?q=${encodeURIComponent(query)}`
      : "kategoria.html";
    window.location.href = target;
  });
};

let appInitialized = false;

const initApp = () => {
  if (appInitialized) return;
  appInitialized = true;

  initTheme();
  initNav();
  initSearch();
  updateCartCount();
  initCatalog();
  initProduct();
  initTravelKits();
  initCart();
  initCheckout();
  initContactForm();
  initFaq();
  initNewsletterForm();
  initLegalModal();
};

const bootstrapApp = async () => {
  document.addEventListener(
    PARTIALS_READY_EVENT,
    () => {
      initApp();
    },
    { once: true },
  );

  await initPartials();
};

document.addEventListener("DOMContentLoaded", () => {
  void bootstrapApp();
});
