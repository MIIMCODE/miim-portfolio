/* Public content selection/drag deterrents, not DRM.
   Keep form editing, browser keyboard shortcuts and admin tools usable. */
(() => {
  'use strict';
  const protectedMedia = 'img, picture, .stage-card, .work-tile, .portrait-arch, .case-modal__media';
  const editable = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
  function isProtected(target, type) {
    const element = target instanceof Element ? target : target?.parentElement;
    if (!element || element.closest(editable)) return false;
    // Only image context menus are blocked; text and links also cannot be dragged/selected.
    return type !== 'contextmenu' || Boolean(element.closest(protectedMedia));
  }
  for (const name of ['contextmenu', 'dragstart', 'selectstart']) {
    document.addEventListener(name, event => {
      if (isProtected(event.target, event.type)) event.preventDefault();
    }, { capture: true });
  }
  function markImages(root) {
    if (root instanceof HTMLImageElement) root.draggable = false;
    root.querySelectorAll?.('img').forEach(image => { image.draggable = false; });
  }
  markImages(document);
  // The portfolio, social buttons and modal images can be rendered after cloud load.
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) markImages(node);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
