/**
 * GitLab image diff bookmarklet
 *
 * Highlights pixel-level differences in GitLab MR image diffs.
 *
 * What it does:
 *   1. Processes any image diffs already visible in the viewport.
 *   2. Installs a MutationObserver that fires whenever GitLab's virtual scrolling
 *      renders a new diff file. For each image diff it finds, it:
 *        - Expands collapsed files
 *        - Ensures 2-up view mode is active
 *        - Injects a pixel diff panel: new image in greyscale as context, with
 *          |new − old| colour-dodged over it — grey = unchanged, colour = changed
 *
 * How to install:
 *   See README.md — copy the bookmarklet URL into a new bookmark, or regenerate
 *   it from source using the script in that file.
 *
 * How the diff rendering works:
 *   Both images are stacked in a position:relative container.
 *   The new image sits on top with mix-blend-mode:difference, which computes
 *   |new − old| per pixel. filter:brightness(25) saturate(5) on the container
 *   amplifies even tiny differences to be clearly visible.
 *   The filter creates an isolated compositing group so blending happens
 *   before amplification — no canvas or CORS needed.
 */

(function () {
  const PANEL_ATTR = "data-gl-diff-panel";

  function processViewers() {
    // Expand files hidden behind title-bar chevron
    document
      .querySelectorAll('button[aria-label="Show file contents"]')
      .forEach((b) => b.click());

    // Expand files hidden by "large file" warning
    document
      .querySelectorAll('[data-testid="expand-button"]')
      .forEach((b) => b.click());

    // Switch any viewer not in 2-up mode
    document.querySelectorAll(".view-modes-menu li").forEach((li) => {
      if (li.textContent.trim() === "2-up" && !li.classList.contains("active"))
        li.click();
    });

    // Inject diff panels into newly visible viewers
    document.querySelectorAll(".diff-viewer .image").forEach((viewer) => {
      if (viewer.querySelector("[" + PANEL_ATTR + "]")) return; // already has panel
      const oldImg = viewer.querySelector(".frame.deleted img");
      const newImg = viewer.querySelector(".frame.added img");
      if (!oldImg || !newImg) return;
      injectDiffPanel(viewer, oldImg.src, newImg.src);
    });
  }

  // Debounced MutationObserver re-processes whenever the DOM changes
  // (handles virtual-scroll re-renders when scrolling back to a file)
  let debTimer;
  const obs = new MutationObserver(() => {
    clearTimeout(debTimer);
    debTimer = setTimeout(processViewers, 200);
  });
  obs.observe(document.body, {childList: true, subtree: true});

  // Process whatever is already visible, then let the MutationObserver
  // handle the rest as the user scrolls through GitLab's virtual list.
  processViewers();

  function injectDiffPanel(viewer, oldSrc, newSrc) {
    const panel = document.createElement("div");
    panel.setAttribute(PANEL_ATTR, "1");
    panel.style.cssText =
      "margin:0;padding:10px 12px 14px;background:#0d0d0d;border-top:3px solid #fc6d26;";

    const label = document.createElement("div");
    label.textContent = "▶ Pixel diff — grey = unchanged · colour = changed";
    label.style.cssText =
      "color:#fc6d26;font:700 11px/2.2 monospace;letter-spacing:.05em;margin-bottom:4px;";

    // Layer 1: new image in greyscale + low contrast — visual context for the diff.
    // Layer 2: amplified |new − old| diff, colour-dodged over layer 1.
    //   filter on diffGroup creates an isolated compositing group so that:
    //     (a) difference blend computes |new − old| per pixel inside the group,
    //     (b) brightness(25) + saturate(5) is applied to the whole group result,
    //   then mix-blend-mode:color-dodge composites it onto the grey base:
    //     diff = 0 (unchanged) → color-dodge(grey, 0) = grey shows through
    //     diff > 0 (changed)   → non-linear boost pushes grey toward bright colour
    const outerWrap = document.createElement("div");
    outerWrap.style.cssText =
      "position:relative;display:inline-block;line-height:0;max-width:100%;";

    const baseImg = new Image();
    baseImg.src = newSrc;
    baseImg.style.cssText =
      "display:block;max-width:100%;filter:grayscale(1) contrast(0.3) brightness(1.0);";

    const diffGroup = document.createElement("div");
    diffGroup.style.cssText =
      "position:absolute;inset:0;" +
      "filter:brightness(25) saturate(5);" +
      "mix-blend-mode:color-dodge;";

    const img1 = new Image();
    img1.src = oldSrc;
    img1.style.cssText = "display:block;width:100%;height:100%;";

    const img2 = new Image();
    img2.src = newSrc;
    img2.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:difference;";

    diffGroup.append(img1, img2);
    outerWrap.append(baseImg, diffGroup);
    panel.append(label, outerWrap);
    viewer.appendChild(panel);
  }
})();
