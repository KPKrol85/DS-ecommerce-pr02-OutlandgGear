export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) =>
  Array.from(scope.querySelectorAll(selector));

export const on = (element, event, handler, options) => {
  if (!element) return;
  element.addEventListener(event, handler, options);
};

export const delegate = (element, selector, event, handler) => {
  if (!element) return;
  element.addEventListener(event, (eventObject) => {
    const target = eventObject.target.closest(selector);
    if (target && element.contains(target)) {
      handler(eventObject, target);
    }
  });
};

export const wrapTabFocus = (event, scope, focusable, fallback) => {
  if (!focusable.length) {
    event.preventDefault();
    fallback?.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && (active === first || !scope.contains(active))) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};
