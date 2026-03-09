import { expect, test } from '@playwright/test';
import { clearStorage, fixtureData, prepareBuyerRound1 } from '../helpers/eisauktion-helpers';

test('Testfall C: Käuferkarte berechnet Sparbetrag und Rundentransfer korrekt', async ({ page }) => {
  await clearStorage(page);
  await prepareBuyerRound1(page);

  const round1 = fixtureData.buyerFlow.round1;
  await page.locator('#savings').fill(String(round1.savings));

  const firstPurchase = page.locator('#purchaseList .purchase-row').first();
  await firstPurchase.locator('[data-field="seller"]').fill(round1.purchases[0].seller);
  await firstPurchase.locator('[data-field="qty"]').fill(String(round1.purchases[0].qty));
  await firstPurchase.locator('[data-field="price"]').fill(String(round1.purchases[0].price));

  await page.getByRole('button', { name: 'Kauf hinzufügen' }).click();
  const secondPurchase = page.locator('#purchaseList .purchase-row').nth(1);
  await secondPurchase.locator('[data-field="seller"]').fill(round1.purchases[1].seller);
  await secondPurchase.locator('[data-field="qty"]').fill(String(round1.purchases[1].qty));
  await secondPurchase.locator('[data-field="price"]').fill(String(round1.purchases[1].price));

  const oldBalance = Number(await page.locator('#budget').inputValue());
  const round1Spent = round1.purchases.reduce((sum: number, p: any) => sum + p.qty * p.price, 0);
  const expectedRound1Balance = Number((oldBalance - round1Spent + round1.savings).toFixed(2));

  await page.getByRole('button', { name: 'Ausgaben berechnen & speichern' }).click();
  await expect(page.locator('#rest_out')).toContainText(expectedRound1Balance.toFixed(2).replace('.', ','));

  await page.getByRole('button', { name: 'Nächste Runde' }).click();
  const round2Budget = Number(await page.locator('#budget').inputValue());
  expect(round2Budget).toBeCloseTo(expectedRound1Balance, 2);

  const round2 = fixtureData.buyerFlow.round2;
  await page.locator('#savings').fill(String(round2.savings));
  const round2FirstPurchase = page.locator('#purchaseList .purchase-row').first();
  await round2FirstPurchase.locator('[data-field="seller"]').fill(round2.purchases[0].seller);
  await round2FirstPurchase.locator('[data-field="qty"]').fill(String(round2.purchases[0].qty));
  await round2FirstPurchase.locator('[data-field="price"]').fill(String(round2.purchases[0].price));
  await page.getByRole('button', { name: 'Ausgaben berechnen & speichern' }).click();

  const rounds = await page.evaluate(() => JSON.parse(localStorage.getItem('eisauktion_kaeufer_rounds') || '[]'));
  expect(rounds).toHaveLength(2);
  expect(rounds[0].newBalance).toBeCloseTo(expectedRound1Balance, 2);
  expect(rounds[1].oldBalance).toBeCloseTo(expectedRound1Balance, 2);
});
