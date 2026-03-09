import { expect, test } from '@playwright/test';
import { clearStorage, fillCompanyRun1, fixtureData } from '../helpers/eisauktion-helpers';

test.describe('Unternehmensgründung', () => {
  test('Testfall A: Durchgang 1 erzeugt vollständige Daten und bleibt nach Reload erhalten', async ({ page }) => {
    await clearStorage(page);
    await fillCompanyRun1(page);

    await page.reload();
    await expect(page.locator('#u_name')).toHaveValue(fixtureData.companyRun1.companyName);
    await expect(page.locator('#u_members')).toHaveValue(fixtureData.companyRun1.members);

    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('eisauktion_state_v2') || '{}'));
    expect(state.questionnaire.run1).toMatchObject({
      u_name: fixtureData.companyRun1.companyName,
      u_members: fixtureData.companyRun1.members,
      operationalPlan: fixtureData.companyRun1.operationalPlan,
      risks: fixtureData.companyRun1.risks,
      strengths: fixtureData.companyRun1.strengths,
      keyDecision: fixtureData.companyRun1.keyDecision
    });
    expect(state.companyProfile).toMatchObject({
      name: fixtureData.companyRun1.companyName,
      sellerProfile: fixtureData.companyRun1.sellerProfile,
      startCapital: fixtureData.companyRun1.startCapital,
      fixedCosts: fixtureData.companyRun1.fixedCosts,
      variableCosts: fixtureData.companyRun1.variableCosts,
      capacity: fixtureData.companyRun1.capacity
    });
  });

  test('Testfall B: Durchgang 2 übernimmt Runde-1-Daten und speichert Erweiterungen', async ({ page }) => {
    await clearStorage(page);
    await fillCompanyRun1(page);

    await page.goto('/fragebogen.html');
    await page.click('#questionnaireTabs .run-tab[data-run="2"]');
    await page.getByRole('button', { name: 'Daten für Runde 2 übernehmen' }).click();

    await expect(page.locator('#ov_name')).toHaveValue(fixtureData.companyRun1.companyName);
    await expect(page.locator('#ov_members')).toHaveValue(fixtureData.companyRun1.members);
    await expect(page.locator('#r2_seller_profile')).toHaveValue(fixtureData.companyRun1.sellerProfile);

    await page.locator('#ov_currentCapital').fill(String(fixtureData.companyRun2.changedCurrentCapital));
    await page.locator('#r2_reflection_success').fill(fixtureData.companyRun2.reflectionSuccess);
    await page.locator('#r2_reflection_goodDecisions').fill(fixtureData.companyRun2.reflectionGoodDecisions);
    await page.locator('#r2_reflection_challenges').fill(fixtureData.companyRun2.reflectionChallenges);
    await page.locator('#r2_reflection_improvements').fill(fixtureData.companyRun2.reflectionImprovements);
    await page.locator('#r2_businessIdea').fill(fixtureData.companyRun2.businessIdea);
    await page.locator('#r2_marketProblem').fill(fixtureData.companyRun2.marketProblem);
    await page.locator('#r2_differentiation').fill(fixtureData.companyRun2.differentiation);
    await page.locator('#r2_strategy_price').fill(fixtureData.companyRun2.strategyPrice);
    await page.locator('#r2_strategy_production').fill(fixtureData.companyRun2.strategyProduction);
    await page.locator('#r2_strategy_marketResponse').fill(fixtureData.companyRun2.strategyMarketResponse);
    await page.getByRole('button', { name: 'Fragebogen speichern' }).click();

    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('eisauktion_state_v2') || '{}'));
    expect(state.questionnaire.run2).toMatchObject({
      u_name: fixtureData.companyRun1.companyName,
      u_members: fixtureData.companyRun1.members,
      sellerProfileId: fixtureData.companyRun1.sellerProfile,
      currentCapital: fixtureData.companyRun2.changedCurrentCapital,
      reflectionSuccess: fixtureData.companyRun2.reflectionSuccess,
      businessIdea: fixtureData.companyRun2.businessIdea,
      strategyMarketResponse: fixtureData.companyRun2.strategyMarketResponse
    });
  });
});
