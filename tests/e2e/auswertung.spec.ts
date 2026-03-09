import { expect, test } from '@playwright/test';
import { clearStorage, fillCompanyRun1, fixtureData, prepareBuyerRound1 } from '../helpers/eisauktion-helpers';

test('Testfall E: Auswertung erzeugt vollständige Formspree-Payload', async ({ page }) => {
  await clearStorage(page);
  await fillCompanyRun1(page);

  await prepareBuyerRound1(page);
  await page.locator('#savings').fill('2');
  const firstPurchase = page.locator('#purchaseList .purchase-row').first();
  await firstPurchase.locator('[data-field="seller"]').fill('Anbieter A');
  await firstPurchase.locator('[data-field="qty"]').fill('1');
  await firstPurchase.locator('[data-field="price"]').fill('2');
  await page.getByRole('button', { name: 'Ausgaben berechnen & speichern' }).click();

  await page.goto('/auswertung.html');
  await page.locator('#who').fill(fixtureData.auswertung.who);
  await page.selectOption('#role', fixtureData.auswertung.role);
  await page.locator('#note').fill(fixtureData.auswertung.note);

  await page.evaluate(() => {
    const form = document.getElementById('formspreeSubmit') as HTMLFormElement;
    (window as any).__submitted = false;
    form.submit = () => {
      (window as any).__submitted = true;
    };
  });

  await page.getByRole('button', { name: 'Direkt senden' }).click();

  const formData = await page.evaluate(() => {
    const form = document.getElementById('formspreeSubmit') as HTMLFormElement;
    const inputs = Array.from(form.querySelectorAll('input')).reduce<Record<string, string>>((acc, el) => {
      const input = el as HTMLInputElement;
      acc[input.name] = input.value;
      return acc;
    }, {});
    return {
      action: form.action,
      submitted: (window as any).__submitted,
      inputs
    };
  });

  expect(formData.action).toContain('https://formspree.io/f/xvzbjzge');
  expect(formData.submitted).toBeTruthy();
  expect(formData.inputs).toMatchObject({
    rolle: fixtureData.auswertung.role,
    name: fixtureData.auswertung.who,
    fixkosten: String(fixtureData.companyRun1.fixedCosts),
    variable_kosten: String(fixtureData.companyRun1.variableCosts),
    kapazitaet: String(fixtureData.companyRun1.capacity)
  });
  expect(formData.inputs.unternehmensdaten).toContain('Eisstern');
  expect(formData.inputs.auswertung).toContain('eisauktion_state_v2');
});
