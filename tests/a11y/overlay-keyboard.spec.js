const { test, expect } = require("@playwright/test");

const LOCAL_ACCEPTANCE_KEY = "outlandGearLegalAcceptedAt";
const SESSION_ACCEPTANCE_KEY = "outlandGearLegalAcceptedSession";
const ACCEPTANCE_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const dispatchKey = (locator, key, shiftKey = false) =>
  locator.evaluate(
    (element, options) => element.dispatchEvent(new KeyboardEvent("keydown", options)),
    { key, shiftKey, bubbles: true, cancelable: true },
  );

const readAcceptance = (page) =>
  page.evaluate(
    ({ localKey, sessionKey }) => ({
      local: window.localStorage.getItem(localKey),
      session: window.sessionStorage.getItem(sessionKey),
    }),
    { localKey: LOCAL_ACCEPTANCE_KEY, sessionKey: SESSION_ACCEPTANCE_KEY },
  );

test.describe("navigation drawer keyboard behavior", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, new Date().toISOString());
    }, LOCAL_ACCEPTANCE_KEY);
    await page.goto("/");
    await page.locator("[data-nav-toggle]").press("Enter");
    await expect(page.locator("[data-nav-drawer]")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
  });

  test("wraps at the drawer boundaries and restores focus on Escape", async ({
    page,
  }) => {
    const toggle = page.locator("[data-nav-toggle]");
    const drawer = page.locator("[data-nav-drawer]");
    const close = drawer.locator("[data-nav-close]");
    const links = drawer.locator("a[href]");
    const last = drawer.locator("[data-theme-toggle]");

    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(last).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links.first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links.nth(1)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(links.first()).toBeFocused();

    await drawer.evaluate((element) => {
      element.tabIndex = -1;
      element.focus();
    });
    await expect(drawer).toBeFocused();
    expect(await dispatchKey(drawer, "Tab", true)).toBe(true);

    await toggle.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(last).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveAttribute("aria-hidden", "true");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });

  test("uses the drawer panel fallback and cancels Tab with an absent panel", async ({
    page,
  }) => {
    const toggle = page.locator("[data-nav-toggle]");
    const panel = page.locator("[data-nav-panel]");

    await panel.evaluate((element) => element.replaceChildren());
    await toggle.focus();
    expect(await dispatchKey(toggle, "ArrowLeft")).toBe(true);
    await expect(toggle).toBeFocused();
    expect(await dispatchKey(toggle, "Tab")).toBe(false);
    await expect(panel).toBeFocused();

    await panel.evaluate((element) => element.remove());
    await toggle.focus();
    expect(await dispatchKey(toggle, "Tab", true)).toBe(false);
    await expect(toggle).toBeFocused();
  });
});

test.describe("legal modal keyboard behavior", () => {
  test("wraps within the panel and restores focus after acceptance", async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener(
        "DOMContentLoaded",
        () => document.querySelector(".skip-link").focus(),
        { once: true },
      );
    });
    await page.goto("/");

    const modal = page.locator("#outland-legal-modal");
    const links = modal.locator("[data-legal-modal-panel] a[href]");
    const accept = modal.locator("[data-legal-accept]");
    const previous = page.locator(".skip-link");
    const body = page.locator("body");

    await expect(modal).toHaveAttribute("aria-hidden", "false");
    await expect(body).toHaveCSS("overflow", "hidden");
    await expect(links.first()).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(accept).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links.first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links.nth(1)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links.nth(2)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(links.nth(1)).toBeFocused();

    await modal.evaluate((element) => {
      element.tabIndex = -1;
      element.focus();
    });
    await page.keyboard.press("Shift+Tab");
    await expect(accept).toBeFocused();

    await previous.focus();
    expect(await dispatchKey(previous, "Tab", true)).toBe(true);
    await expect(previous).toBeFocused();

    await accept.focus();
    await page.keyboard.press("Escape");
    await expect(modal).toBeVisible();
    await expect(body).toHaveCSS("overflow", "hidden");
    await expect(accept).toBeFocused();
    expect(await readAcceptance(page)).toEqual({ local: null, session: null });

    await page.keyboard.press("Enter");
    await expect(modal).toBeHidden();
    await expect(modal).toHaveAttribute("aria-hidden", "true");
    expect(await body.evaluate((element) => element.style.overflow)).toBe("");
    await expect(previous).toBeFocused();
    expect(await readAcceptance(page)).toEqual({
      local: expect.stringMatching(ACCEPTANCE_TIMESTAMP),
      session: null,
    });
  });

  test("focuses the modal panel when no candidates remain", async ({ page }) => {
    await page.goto("/");
    const modal = page.locator("#outland-legal-modal");
    const panel = modal.locator("[data-legal-modal-panel]");

    await expect(modal).toBeVisible();
    await panel.evaluate((element) => element.replaceChildren());
    await modal.evaluate((element) => {
      element.tabIndex = -1;
      element.focus();
    });

    expect(await dispatchKey(modal, "ArrowLeft")).toBe(true);
    await expect(modal).toBeFocused();
    expect(await dispatchKey(modal, "Tab")).toBe(false);
    await expect(panel).toBeFocused();
  });

  test("preserves acceptance through session storage when the local write fails", async ({
    page,
  }) => {
    await page.addInitScript((localKey) => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(key, value) {
        if (this === window.localStorage && key === localKey) {
          throw new DOMException(
            "Simulated local storage write failure",
            "QuotaExceededError",
          );
        }
        return originalSetItem.call(this, key, value);
      };
    }, LOCAL_ACCEPTANCE_KEY);
    await page.clock.install();
    await page.goto("/");

    const modal = page.locator("#outland-legal-modal");
    await modal.locator("[data-legal-accept]").click();
    await expect(modal).toBeHidden();
    expect(await readAcceptance(page)).toEqual({
      local: null,
      session: expect.stringMatching(ACCEPTANCE_TIMESTAMP),
    });

    await page.reload();
    await page.clock.fastForward(1_000);
    await expect(modal).toBeHidden();
  });
});
