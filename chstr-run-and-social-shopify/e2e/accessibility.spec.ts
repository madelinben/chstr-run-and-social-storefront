import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// WCAG 2.1 A and AA plus axe best practices, on every public page, at desktop and phone width.
const pages = ['/', '/events/', '/events/past/', '/events/big-run-fyp-gym-saltney/', '/gallery/', '/members/', '/faqs/', '/waiver/', '/contact/', '/merchandise/', '/merchandise/club-tee/'];

for (const [name, viewport] of [['desktop', { width: 1366, height: 800 }], ['phone', { width: 360, height: 740 }]] as const) {
  for (const path of pages) {
    test(`no accessibility violations on ${path} (${name})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await page.waitForLoadState('load');
      // Reveal-on-scroll content starts transparent; show it so contrast is measured on what people see.
      await page.addStyleTag({ content: '[data-reveal],[data-bar]{opacity:1!important;transform:none!important;transition:none!important}' });
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
      const summary = results.violations.map((violation) => `${violation.id} (${violation.impact}): ${violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(' | ')}`);
      expect(summary, summary.join('\n')).toEqual([]);
    });
  }
}

test('size guide dialog is accessible when open, and returns focus when closed', async ({ page }) => {
  await page.goto('/merchandise/');
  const open = page.getByRole('button', { name: 'Size guide' });
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'Size Guide' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('table')).toBeVisible();
  const results = await new AxeBuilder({ page }).include('[data-size-guide]').withTags(['wcag2a', 'wcag2aa', 'best-practice']).analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});
