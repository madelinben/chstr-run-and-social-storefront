import { expect, test } from '@playwright/test';

// The same two checks Astro's dev-toolbar audit makes, run against every page at desktop and phone size,
// so they cannot regress. Reduced motion freezes the drifting collage so element positions are deterministic.
const pages = ['/', '/events/', '/events/past/', '/events/big-run-fyp-gym-saltney/', '/events/long-run/', '/gallery/', '/members/', '/faqs/', '/waiver/', '/contact/', '/merchandise/', '/merchandise/club-tee/', '/merchandise/jumper/'];
const viewports = [['desktop', { width: 1366, height: 800 }], ['tablet', { width: 768, height: 900 }], ['phone', { width: 360, height: 740 }]] as const;

for (const [name, viewport] of viewports) {
  for (const path of pages) {
    test(`links and headings have an accessible name on ${path} (${name})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize(viewport);
      await page.goto(path);
      const unnamed = await page.evaluate(() =>
        [...document.querySelectorAll('a[href], h1, h2, h3, h4, h5, h6')]
          .filter((element) => {
            const hasText = (element.textContent ?? '').trim() !== '';
            const labelled = (element.getAttribute('aria-label') ?? '').trim() !== '' || element.hasAttribute('aria-labelledby');
            const namedImage = element.querySelector('img[alt]:not([alt=""])') !== null;
            const titledSvg = element.querySelector('svg title') !== null;
            return !(hasText || labelled || namedImage || titledSvg);
          })
          .map((element) => element.outerHTML.slice(0, 140)),
      );
      expect(unnamed, unnamed.join('\n')).toEqual([]);
    });

    test(`no lazy-loaded image sits in the opening viewport on ${path} (${name})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize(viewport);
      await page.goto(path);
      const lazyAboveTheFold = await page.evaluate(() =>
        [...document.images]
          .filter((image) => {
            if (image.loading !== 'lazy') return false;
            const box = image.getBoundingClientRect();
            const visible = box.width > 0 && box.height > 0 && getComputedStyle(image).visibility !== 'hidden';
            return visible && box.top < window.innerHeight && box.bottom > 0;
          })
          .map((image) => image.currentSrc.split('/').pop() ?? image.src),
      );
      expect(lazyAboveTheFold, lazyAboveTheFold.join('\n')).toEqual([]);
    });
  }
}
