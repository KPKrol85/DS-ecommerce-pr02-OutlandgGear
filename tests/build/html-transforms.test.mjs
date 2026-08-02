import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  inlinePartial,
  injectBaseHref,
  markPrerenderedRoot,
  removeHiddenAttributeFromElement,
  replaceJsonLdScript,
  replaceLinkHref,
  replaceMetaContent,
  replaceTitleTag,
} from "../../scripts/build-dist.mjs";

describe("inlinePartial", () => {
  it("replaces the host element's contents with the partial", () => {
    const html = `<header class="site-header" data-partial-src="partials/header.html"></header>`;
    const result = inlinePartial(html, {
      tag: "header",
      partialPath: "partials/header.html",
      partialContent: "<nav>menu</nav>",
    });

    assert.match(result, /<nav>menu<\/nav>/);
    assert.match(result, /class="site-header"/);
  });

  it("throws when the host element is missing", () => {
    assert.throws(
      () =>
        inlinePartial("<main></main>", {
          tag: "header",
          partialPath: "partials/header.html",
          partialContent: "<nav>menu</nav>",
        }),
      /Missing header partial host/,
    );
  });
});

describe("replaceTitleTag", () => {
  it("replaces the title and escapes the value", () => {
    const result = replaceTitleTag("<title>old</title>", `A & B "C"`);
    assert.equal(result, `<title>A &amp; B &quot;C&quot;</title>`);
  });
});

describe("replaceMetaContent", () => {
  it("rewrites the content attribute of the addressed meta tag", () => {
    const html = `<meta name="robots" content="noindex" />`;
    assert.equal(
      replaceMetaContent(html, "name", "robots", "index, follow"),
      `<meta name="robots" content="index, follow" />`,
    );
  });

  it("leaves other meta tags untouched", () => {
    const html = `<meta name="robots" content="noindex" /><meta name="author" content="X" />`;
    const result = replaceMetaContent(html, "name", "robots", "index");
    assert.match(result, /name="author" content="X"/);
  });
});

describe("replaceLinkHref", () => {
  it("rewrites the href of the addressed link tag", () => {
    const html = `<link rel="canonical" href="https://example.test/old" />`;
    assert.equal(
      replaceLinkHref(html, "canonical", "https://example.test/new"),
      `<link rel="canonical" href="https://example.test/new" />`,
    );
  });
});

describe("replaceJsonLdScript", () => {
  it("replaces the organization block, which carries no data-schema attribute", () => {
    const html = `<script type="application/ld+json">{"old":true}</script>`;
    const result = replaceJsonLdScript(html, "organization", { name: "Outland" });

    assert.match(result, /"name": "Outland"/);
    assert.doesNotMatch(result, /"old"/);
  });

  it("targets a specific data-schema block and leaves the others alone", () => {
    const html =
      `<script type="application/ld+json" data-schema="webpage">{"a":1}</script>` +
      `<script type="application/ld+json" data-schema="product">{"b":2}</script>`;
    const result = replaceJsonLdScript(html, "product", { replaced: true });

    assert.match(result, /"a":1/);
    assert.match(result, /"replaced": true/);
  });

  it("escapes < so a payload cannot terminate the script element", () => {
    const html = `<script type="application/ld+json">{}</script>`;
    const result = replaceJsonLdScript(html, "organization", {
      name: "</script><img>",
    });

    assert.doesNotMatch(result, /<\/script><img>/);
    assert.match(result, /\\u003c/);
  });
});

describe("injectBaseHref", () => {
  it("injects a base tag into the head", () => {
    assert.match(injectBaseHref("<head>\n<title>x</title>"), /<base href="\/" \/>/);
  });

  it("is idempotent when a base tag already exists", () => {
    const html = `<head>\n    <base href="/" />\n<title>x</title>`;
    assert.equal(injectBaseHref(html), html);
    assert.equal((injectBaseHref(html).match(/<base /g) || []).length, 1);
  });
});

describe("markPrerenderedRoot", () => {
  it("marks the addressed page root", () => {
    const result = markPrerenderedRoot(`<main data-product-root>`, "data-product-root");
    assert.match(result, /data-prerendered="true"/);
  });

  it("preserves attributes that follow the root attribute", () => {
    const html = `<main id="main" data-product-root class="product-page">`;
    const result = markPrerenderedRoot(html, "data-product-root");

    assert.match(result, /id="main"/);
    assert.match(result, /class="product-page"/);
    assert.match(result, /data-prerendered="true"/);
  });

  it("throws when the expected root is absent", () => {
    assert.throws(
      () => markPrerenderedRoot("<main id='main'>", "data-product-root"),
      /Missing prerender root/,
    );
  });
});

describe("removeHiddenAttributeFromElement", () => {
  // This is the transform whose regex once read /\s hidden\b/ — a literal space
  // after \s, so it only matched when two whitespace characters preceded the
  // attribute. Single-space markup silently kept `hidden`, and every generated
  // travel-kit page shipped its detail block hidden while the build exited 0.
  const pattern = /<div class="kit-detail" data-kit-content hidden>/i;

  it("strips a hidden attribute separated by a single space", () => {
    const html = `<div class="kit-detail" data-kit-content hidden>content</div>`;
    const result = removeHiddenAttributeFromElement(html, pattern);

    assert.doesNotMatch(result, /\shidden>/);
    assert.match(result, /data-kit-content>/);
  });

  it("keeps the element's other attributes", () => {
    const html = `<div class="kit-detail" data-kit-content hidden>content</div>`;
    const result = removeHiddenAttributeFromElement(html, pattern);

    assert.match(result, /class="kit-detail"/);
    assert.match(result, /data-kit-content/);
    assert.match(result, /content<\/div>/);
  });

  it("leaves markup alone when the pattern does not address it", () => {
    const html = `<div class="other" hidden>content</div>`;
    assert.equal(removeHiddenAttributeFromElement(html, pattern), html);
  });
});
