/**
 * Contract tests between the build's regex transforms and the real page
 * templates.
 *
 * The unit tests in html-transforms.test.mjs prove each transform works on
 * markup shaped the way the transform expects. They cannot catch the failure
 * that actually happened in this project: a regex that still worked in
 * isolation but stopped matching `produkt.html` / `komplety.html` after those
 * files were reformatted. The build kept exiting 0 and shipped corrupted
 * output.
 *
 * These tests run the real prerender transforms over the real templates and
 * assert on the result, so a pattern that stops matching fails the suite.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyProductPrerender,
  applyTravelKitPrerender,
} from "../../scripts/build-dist.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const readTemplate = (name) => fs.readFile(path.join(ROOT, name), "utf8");

const PRODUCT = {
  id: 4242,
  slug: "contract-test-product",
  name: "Contract Test Backpack",
  category: "Plecaki",
  subcategory: "Plecaki trekkingowe",
  shortDescription: "Plecak uzyty w tescie kontraktowym.",
  price: 599,
  oldPrice: 699,
  currency: "PLN",
  stockStatus: "Dostepny",
  rating: 4.7,
  reviewsCount: 88,
  imageAlt: "Alt tekst z testu kontraktowego",
  images: [
    "assets/img/products/contract-test-01.webp",
    "assets/img/products/contract-test-02.webp",
    "assets/img/products/contract-test-03.webp",
  ],
  highlights: ["Lekka konstrukcja", "Wodoodporny materiał"],
  specs: { Pojemnosc: "55 l", Waga: "1,4 kg" },
};

const TRAVEL_KIT = {
  slug: "contract-test-kit",
  title: "Contract Test Kit",
  label: "Test",
  eyebrow: "Outland Gear Travel Kits",
  description: "Komplet uzyty w tescie kontraktowym.",
  duration: "3 dni",
  heroImage: "assets/img/kits/contract-test.webp",
  heroAlt: "Zdjecie kompletu testowego",
  meta: ["3 dni", "2 osoby"],
  supportTitle: "Wsparcie",
  supportText: "Tekst wsparcia.",
  highlights: ["Kompaktowy", "Sprawdzony"],
  productIds: [PRODUCT.id],
  ctaQuery: "plecak",
  ctaLabel: "Przejdz do katalogu",
  secondaryCtaHref: "index.html#travel-kits",
  secondaryCtaLabel: "Wroc do zestawow",
};

describe("produkt.html prerender contract", () => {
  it("marks the page root as prerendered", async () => {
    const result = applyProductPrerender(await readTemplate("produkt.html"), PRODUCT);
    assert.match(result, /data-prerendered="true"/);
  });

  it("injects a base href so nested routes resolve their assets", async () => {
    const result = applyProductPrerender(await readTemplate("produkt.html"), PRODUCT);
    assert.match(result, /<base href="\/" \/>/);
  });

  it("writes the product name into the heading and breadcrumb", async () => {
    const result = applyProductPrerender(await readTemplate("produkt.html"), PRODUCT);

    assert.match(result, /<h1 data-product-title>Contract Test Backpack<\/h1>/);
    assert.match(result, /aria-current="page">Contract Test Backpack</);
  });

  it("writes price, stock, rating and description into the page", async () => {
    const result = applyProductPrerender(await readTemplate("produkt.html"), PRODUCT);

    assert.match(result, /599 PLN/);
    assert.match(result, /699 PLN/);
    assert.match(result, /Dostepny/);
    assert.match(result, /Ocena 4\.7/);
    assert.match(result, /Plecak uzyty w tescie kontraktowym\./);
  });

  it("renders highlights and spec rows from the product data", async () => {
    const result = applyProductPrerender(await readTemplate("produkt.html"), PRODUCT);

    assert.match(result, /<li>Lekka konstrukcja<\/li>/);
    assert.match(result, /<th scope="row">Pojemnosc<\/th><td>55 l<\/td>/);
  });

  it("rewrites title, canonical and JSON-LD from the product data", async () => {
    const result = applyProductPrerender(await readTemplate("produkt.html"), PRODUCT);

    assert.match(result, /<title>Contract Test Backpack \| Plecaki \| Outland Gear/);
    // The templates write link tags one attribute per line, so this assertion
    // must tolerate whitespace between rel and href.
    assert.match(
      result,
      /rel="canonical"\s+href="[^"]*\/produkt\/contract-test-product\//,
    );
    assert.match(result, /"@type": "Product"/);
  });

  // Both patterns previously assumed single-space attribute separation
  // (`<img data-product-main`, `<button type="button" data-product-thumb`) and
  // silently stopped matching once produkt.html was reformatted to one
  // attribute per line. They now tolerate arbitrary whitespace.
  it("replaces the main gallery image with the product's own image", async () => {
    const result = applyProductPrerender(await readTemplate("produkt.html"), PRODUCT);

    assert.match(result, /assets\/img\/products\/contract-test-01\.webp/);
    assert.doesNotMatch(result, /data-product-main[^>]*product-placeholder/);
  });

  it("personalises the gallery thumbnails", async () => {
    const result = applyProductPrerender(await readTemplate("produkt.html"), PRODUCT);

    assert.match(result, /assets\/img\/products\/contract-test-02\.webp/);
    assert.match(result, /aria-label="Pokaz zdjecie 1 produktu Contract Test Backpack"/);
  });
});

describe("komplety.html prerender contract", () => {
  it("marks the page root as prerendered", async () => {
    const result = applyTravelKitPrerender(
      await readTemplate("komplety.html"),
      TRAVEL_KIT,
      [PRODUCT],
    );
    assert.match(result, /data-prerendered="true"/);
  });

  // The regression that shipped every kit page with its content hidden.
  it("strips the hidden attribute from the kit detail block", async () => {
    const result = applyTravelKitPrerender(
      await readTemplate("komplety.html"),
      TRAVEL_KIT,
      [PRODUCT],
    );

    assert.match(
      result,
      /<div class="kit-detail product-layout" data-kit-content>/,
      "kit detail block must not ship with a hidden attribute",
    );
    assert.doesNotMatch(result, /data-kit-content hidden>/);
  });

  it("strips the hidden attribute from the kit label", async () => {
    const result = applyTravelKitPrerender(
      await readTemplate("komplety.html"),
      TRAVEL_KIT,
      [PRODUCT],
    );

    assert.doesNotMatch(result, /data-kit-label hidden>/);
    assert.match(result, /data-kit-label>Test</);
  });

  it("writes the kit's own copy into the page", async () => {
    const result = applyTravelKitPrerender(
      await readTemplate("komplety.html"),
      TRAVEL_KIT,
      [PRODUCT],
    );

    assert.match(result, /data-kit-title>Contract Test Kit</);
    assert.match(result, /Komplet uzyty w tescie kontraktowym\./);
    assert.match(result, /<li>Kompaktowy<\/li>/);
  });

  it("renders the kit's matched product cards", async () => {
    const result = applyTravelKitPrerender(
      await readTemplate("komplety.html"),
      TRAVEL_KIT,
      [PRODUCT],
    );

    assert.match(result, /kit-product-card/);
    assert.match(result, /\/produkt\/contract-test-product\//);
    assert.match(result, /Contract Test Backpack/);
  });

  // Both CTA patterns previously required `" data-kit-primary-cta>` with the
  // closing bracket immediately after the attribute. Prettier writes the
  // anchor as `... data-kit-primary-cta\n  >` and splits the closing tag as
  // `</a\n  >`, so neither matched. Both now tolerate that formatting.
  it("rewrites the primary CTA to the kit's catalog query", async () => {
    const result = applyTravelKitPrerender(
      await readTemplate("komplety.html"),
      TRAVEL_KIT,
      [PRODUCT],
    );

    assert.match(result, /kategoria\.html\?q=plecak/);
    assert.match(result, /Przejdz do katalogu/);
  });

  it("rewrites the secondary CTA to the kit's own target", async () => {
    const result = applyTravelKitPrerender(
      await readTemplate("komplety.html"),
      TRAVEL_KIT,
      [PRODUCT],
    );
    assert.match(result, /Wroc do zestawow/);
  });
});
