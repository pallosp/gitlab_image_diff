# GitLab Image Diff — Bookmarklet

Highlights pixel-level differences in GitLab MR image diffs. Works on any GitLab
instance.

## Installation

Create a new bookmark in your browser with the URL below (paste it into the URL
field directly, dragging doesn't work from Markdown):

```text
javascript:(function%20()%20%7B%20const%20PANEL_ATTR%20%3D%20%22data-gl-diff-panel%22%3B%20function%20processViewers()%20%7B%20document%20.querySelectorAll('button%5Baria-label%3D%22Show%20file%20contents%22%5D')%20.forEach((b)%20%3D%3E%20b.click())%3B%20document%20.querySelectorAll('%5Bdata-testid%3D%22expand-button%22%5D')%20.forEach((b)%20%3D%3E%20b.click())%3B%20document.querySelectorAll(%22.view-modes-menu%20li%22).forEach((li)%20%3D%3E%20%7B%20if%20(li.textContent.trim()%20%3D%3D%3D%20%222-up%22%20%26%26%20!li.classList.contains(%22active%22))%20li.click()%3B%20%7D)%3B%20document.querySelectorAll(%22.diff-viewer%20.image%22).forEach((viewer)%20%3D%3E%20%7B%20if%20(viewer.querySelector(%22%5B%22%20%2B%20PANEL_ATTR%20%2B%20%22%5D%22))%20return%3B%20const%20oldImg%20%3D%20viewer.querySelector(%22.frame.deleted%20img%22)%3B%20const%20newImg%20%3D%20viewer.querySelector(%22.frame.added%20img%22)%3B%20if%20(!oldImg%20%7C%7C%20!newImg)%20return%3B%20injectDiffPanel(viewer%2C%20oldImg.src%2C%20newImg.src)%3B%20%7D)%3B%20%7D%20let%20debTimer%3B%20const%20obs%20%3D%20new%20MutationObserver(()%20%3D%3E%20%7B%20clearTimeout(debTimer)%3B%20debTimer%20%3D%20setTimeout(processViewers%2C%20200)%3B%20%7D)%3B%20obs.observe(document.body%2C%20%7BchildList%3A%20true%2C%20subtree%3A%20true%7D)%3B%20processViewers()%3B%20function%20injectDiffPanel(viewer%2C%20oldSrc%2C%20newSrc)%20%7B%20const%20panel%20%3D%20document.createElement(%22div%22)%3B%20panel.setAttribute(PANEL_ATTR%2C%20%221%22)%3B%20panel.style.cssText%20%3D%20%22margin%3A0%3Bpadding%3A10px%2012px%2014px%3Bbackground%3A%230d0d0d%3Bborder-top%3A3px%20solid%20%23fc6d26%3B%22%3B%20const%20label%20%3D%20document.createElement(%22div%22)%3B%20label.textContent%20%3D%20%22%E2%96%B6%20Pixel%20diff%20%E2%80%94%20grey%20%3D%20unchanged%20%C2%B7%20colour%20%3D%20changed%22%3B%20label.style.cssText%20%3D%20%22color%3A%23fc6d26%3Bfont%3A700%2011px%2F2.2%20monospace%3Bletter-spacing%3A.05em%3Bmargin-bottom%3A4px%3B%22%3B%20const%20outerWrap%20%3D%20document.createElement(%22div%22)%3B%20outerWrap.style.cssText%20%3D%20%22position%3Arelative%3Bdisplay%3Ainline-block%3Bline-height%3A0%3Bmax-width%3A100%25%3B%22%3B%20const%20baseImg%20%3D%20new%20Image()%3B%20baseImg.src%20%3D%20newSrc%3B%20baseImg.style.cssText%20%3D%20%22display%3Ablock%3Bmax-width%3A100%25%3Bfilter%3Agrayscale(1)%20contrast(0.3)%20brightness(1.0)%3B%22%3B%20const%20diffGroup%20%3D%20document.createElement(%22div%22)%3B%20diffGroup.style.cssText%20%3D%20%22position%3Aabsolute%3Binset%3A0%3B%22%20%2B%20%22filter%3Abrightness(25)%20saturate(5)%3B%22%20%2B%20%22mix-blend-mode%3Acolor-dodge%3B%22%3B%20const%20img1%20%3D%20new%20Image()%3B%20img1.src%20%3D%20oldSrc%3B%20img1.style.cssText%20%3D%20%22display%3Ablock%3Bwidth%3A100%25%3Bheight%3A100%25%3B%22%3B%20const%20img2%20%3D%20new%20Image()%3B%20img2.src%20%3D%20newSrc%3B%20img2.style.cssText%20%3D%20%22position%3Aabsolute%3Binset%3A0%3Bwidth%3A100%25%3Bheight%3A100%25%3Bmix-blend-mode%3Adifference%3B%22%3B%20diffGroup.append(img1%2C%20img2)%3B%20outerWrap.append(baseImg%2C%20diffGroup)%3B%20panel.append(label%2C%20outerWrap)%3B%20viewer.appendChild(panel)%3B%20%7D%20%7D)()%3B
```

## Usage

1. Open a GitLab MR and go to the **Changes** tab.
2. Click **GL Image Diff** in your bookmarks bar.
3. A pixel diff panel appears beneath each image diff as you scroll. The
   bookmarklet observes the DOM and injects panels the moment each file is
   rendered by GitLab's virtual scrolling.

**Reading the diff:** The panel shows the new screenshot in greyscale as
context. Changed pixels glow in colour on top. Grey = unchanged, colour =
changed.

## Regenerating the URL from source

After editing `gitlab-image-diff.js`, run

```bash
node -e "
const src = require('fs').readFileSync('./gitlab-image-diff.js', 'utf8');
const min = src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')
  .replace(/\s+/g, ' ')
  .trim();
process.stdout.write('javascript:' + encodeURIComponent(min) + '\n');
"
```

Paste the output into the **Installation** section above.

## How the diff rendering works

Pure CSS compositing.

**Layer 1** — base: new image with
`filter: grayscale(1) contrast(0.3) brightness(1.0)`

**Layer 2** — diff group, composited onto layer 1 with
`mix-blend-mode: color-dodge`:

- Inside the group: old image (normal) + new image with
  `mix-blend-mode: difference` → `|new − old|` per pixel
- `filter: brightness(25) saturate(5)` amplifies the result
- `color-dodge(base, 0) = base` → unchanged pixels (diff = 0) leave the grey
  untouched
- `color-dodge(base, diff) = base / (1 − diff)` → non-linear: even a small diff
  value pushes the result sharply toward white, making changed pixels clearly
  visible as bright coloured spots
