import { expect, test } from '@playwright/test';
import { clearStorage, fixtureData } from '../helpers/eisauktion-helpers';

test('Testfall D: Moderationsseite Szenario-Details und editierbare Rundenplanung', async ({ page }) => {
  await clearStorage(page);
  await page.goto('/rolle-moderation.html');

  await expect(page.locator('#scenario-list')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Szenarien anzeigen' })).toHaveCount(0);

  const targetCard = page.locator('.scenario-card', { hasText: fixtureData.moderation.scenarioTitle }).first();
  await expect(targetCard).toContainText('Ökonomischer Mechanismus');
  await expect(targetCard).not.toContainText('Empfohlene Startverteilung');

  await targetCard.getByRole('button', { name: 'Szenario verwenden' }).click();

  const planning = page.locator('#scenario-planning');
  await expect(planning).toContainText('Runde 2: Hitzewelle setzt ein');
  await expect(planning).toContainText('Auswirkungen auf Spielparameter');

  const roundTwoTextbox = planning.getByLabel('Rundenplanung für Runde 2');
  await expect(roundTwoTextbox).toContainText('Saison-Effekt: hohe Nachfrage');
  await roundTwoTextbox.fill('Eigener Input für Runde 2');
  await expect(roundTwoTextbox).toHaveValue('Eigener Input für Runde 2');

  const details = targetCard.getByText('Details anzeigen');
  await details.click();
  await expect(targetCard).toContainText('Empfohlene Startverteilung');

  await page.selectOption('#season-effect', 'very-warm');
  await page.selectOption('#demand-shock', 'city-festival');
  await page.fill('#variable-cost-delta', '0.4');
  await page.fill('#fixed-cost-delta', '2');
  await page.getByRole('button', { name: 'Rundeneinstellungen speichern' }).click();
  await expect(page.locator('#storage-status')).toContainText('Rundeneinstellungen gespeichert');
});
