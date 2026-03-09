import { expect, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const fixtureData = JSON.parse(
  readFileSync(join(process.cwd(), 'tests/fixtures/expected-data.json'), 'utf-8')
);

export async function clearStorage(page: Page) {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
}

export async function fillCompanyRun1(page: Page) {
  const run1 = fixtureData.companyRun1;
  await page.goto('/fragebogen.html');
  await page.locator('#u_name').fill(run1.companyName);
  await page.locator('#u_members').fill(run1.members);
  await page.locator('#r1_operationalPlan').fill(run1.operationalPlan);
  await page.locator('#r1_risks').fill(run1.risks);
  await page.locator('#r1_strengths').fill(run1.strengths);
  await page.locator('#r1_keyDecision').fill(run1.keyDecision);

  await page.click('#questionnaireTabs .run-tab[data-run="2"]');
  await page.selectOption('#r2_seller_profile', run1.sellerProfile);
  await expect(page.locator('#ov_startCapital')).toHaveValue(String(run1.startCapital));
  await expect(page.locator('#ov_fixedCosts')).toHaveValue(String(run1.fixedCosts));
  await expectNumericValue(page, '#ov_variableCosts', run1.variableCosts);
  await expect(page.locator('#ov_capacity')).toHaveValue(String(run1.capacity));

  await page.getByRole('button', { name: 'Fragebogen speichern' }).click();
  await expect(page.locator('#saveStatus')).toContainText('Gespeichert');
}

async function expectNumericValue(page: Page, selector: string, expected: number, precision = 6) {
  const actual = Number(await page.locator(selector).inputValue());
  expect(actual).toBeCloseTo(expected, precision);
}

export async function prepareBuyerRound1(page: Page) {
  await page.goto('/rolle-kaeufer.html');
  await page.click('#buyerTabs .run-tab[data-run="2"]');
  await page.selectOption('#buyerProfileSelect', fixtureData.buyerFlow.buyerProfile);
  await page.click('#updateRoundFieldsBtn');
}
