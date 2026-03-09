import { expect, test } from '@playwright/test';

const pages = [
  ['/index.html', 'Übersicht'],
  ['/fragebogen.html', 'Fragebogen zur Unternehmensgründung'],
  ['/rolle-unternehmen.html', 'Rolle: Unternehmen'],
  ['/rolle-kaeufer.html', 'Rolle: Käufer'],
  ['/rolle-moderation.html', 'Moderation / Lehrkraft'],
  ['/auswertung.html', 'Daten versenden']
] as const;

test('Smoke: Zentrale Seiten laden mit Kernüberschrift', async ({ page }) => {
  for (const [url, headline] of pages) {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: new RegExp(headline) })).toBeVisible();
  }
});
