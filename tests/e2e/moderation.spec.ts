import { expect, test } from '@playwright/test';
import { clearStorage, fixtureData } from '../helpers/eisauktion-helpers';

test('Testfall D: Moderationsseite Szenario-Collapse und Rundeneffekt', async ({ page }) => {
  await clearStorage(page);
  await page.goto('/rolle-moderation.html');

  await expect(page.locator('#scenario-list')).toBeVisible();
  await page
    .locator('.scenario-card', { hasText: fixtureData.moderation.scenarioTitle })
    .first()
    .getByRole('button', { name: 'Szenario verwenden' })
    .click();

  await expect(page.locator('#scenario-list')).toBeHidden();
  await expect(page.locator('#scenario-current-info')).toContainText(fixtureData.moderation.roundFocusText);
  await expect(page.locator('#scenario-current-info')).not.toContainText(fixtureData.moderation.hiddenTextInCollapsedView);

  await page.getByRole('button', { name: /Szenario wechseln|Szenarien anzeigen/ }).click();
  await expect(page.locator('#scenario-list')).toBeVisible();

  await page.selectOption('#season-effect', 'high-demand');
  await page.selectOption('#demand-shock', 'event-boom');
  await page.getByRole('button', { name: 'Rundeneinstellungen speichern' }).click();
  await expect(page.locator('#storage-status')).toContainText('Rundeneinstellungen gespeichert');
});
