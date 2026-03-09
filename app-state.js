(function(){
  const KEY = 'eisauktion_state_v2';
  const LEGACY_Q_KEY = 'eisauktion_questionnaire';

  const SELLER_PROFILES = {
    discounter: { label: 'Discounter / Massenanbieter', description: 'Ihr verkauft günstig und in großen Mengen. Vorteil: viele Käufer. Risiko: wenig Gewinn pro Eis.', baseValues: { startBudget: 80, variableCost: 1.0, fixedCost: 10, capacity: 25 }, hints: 'Stärke: niedrige Kosten. Risiko: Bei Preiskampf bleibt kaum Gewinn.' },
    innenstadt: { label: 'Innenstadt-Eisdiele', description: 'Ihr habt viele Laufkundinnen und Laufkunden, aber auch höhere Kosten durch den Standort.', baseValues: { startBudget: 70, variableCost: 1.2, fixedCost: 8, capacity: 20 }, hints: 'Stärke: gute Lage. Risiko: Hohe Kosten müssen über Verkäufe gedeckt werden.' },
    premium: { label: 'Premium-Eisdiele', description: 'Ihr setzt auf Qualität und Image. Dafür sind eure Kosten pro Portion höher.', baseValues: { startBudget: 60, variableCost: 1.4, fixedCost: 6, capacity: 15 }, hints: 'Stärke: höhere Zahlungsbereitschaft mancher Käufer. Risiko: Preis muss passen.' }
  };

  const BUYER_PROFILES = {
    preisorientiert: { label: 'Preisorientierter Käufer', description: 'Du achtest vor allem auf den günstigsten Preis und wechselst schnell den Anbieter.', preferences: { priceFocus: 3, qualityFocus: 1, brandFocus: 1 }, spendingHint: 'Du kaufst meist nur bei günstigen Preisen. Spare eher Geld für später.' },
    qualitaet: { label: 'Qualitätsorientierter Käufer', description: 'Du kaufst lieber gutes Eis, auch wenn es etwas teurer ist.', preferences: { priceFocus: 1, qualityFocus: 3, brandFocus: 1 }, spendingHint: 'Plane genug Budget für bessere Qualität ein und vergleiche trotzdem Preise.' },
    image: { label: 'Imageorientierter Käufer', description: 'Dir ist wichtig, bei welchem Anbieter du kaufst und wie er wirkt.', preferences: { priceFocus: 1, qualityFocus: 2, brandFocus: 3 }, spendingHint: 'Marke und Eindruck sind dir wichtig. Halte etwas Budget für passende Angebote frei.' },
    budgetknapp: { label: 'Budgetknapper Käufer', description: 'Du hast wenig Geld und musst sehr genau rechnen.', preferences: { priceFocus: 3, qualityFocus: 1, brandFocus: 1 }, spendingHint: 'Du musst besonders vorsichtig mit deinem Geld umgehen.' },
    sommer: { label: 'Spontaner Sommerkäufer', description: 'Bei Hitze kaufst du spontan, wenn Angebot und Preis gerade passen.', preferences: { priceFocus: 2, qualityFocus: 2, brandFocus: 1 }, spendingHint: 'Bei guten Marktbedingungen gibst du eher viel Geld aus.' },
    stammkunde: { label: 'Treuer Stammkunde', description: 'Du bleibst oft bei deinem Lieblingsanbieter, wenn die Qualität stimmt.', preferences: { priceFocus: 1, qualityFocus: 2, brandFocus: 3 }, spendingHint: 'Du bleibst oft loyal. Plane ein stabiles Budget für deinen Lieblingsanbieter.' }
  };

  const synonyms = {
    startCapital: ['startkapital', 'startBudget'],
    fixedCosts: ['fixkosten', 'fix', 'fixedCost'],
    variableCosts: ['variableKosten', 'variable_costs', 'var_sum', 'variableCost'],
    capacity: ['kapazitaet', 'max_prod', 'productionCapacity'],
    currentBalance: ['kontostand', 'budget', 'currentBudget'],
    savingsAmount: ['sparbetrag', 'savings']
  };

  function warn(msg){ console.warn('[EisauktionState]', msg); }
  function num(v, d = 0){ const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : d; }
  function first(obj, keys, fallback){ for(const k of keys){ if(obj && obj[k] != null && obj[k] !== '') return obj[k]; } return fallback; }

  function defaultRoundModifiers(){ return { seasonEffect:'neutral', demandShock:'none', variableCostDelta:0, fixedCostDelta:0, imageEffect:'neutral', locationCost:0 }; }
  function defaultGameState(){ return { currentRound:1, sellers:[], buyers:[], currentScenarioId:'', scenarioNotes:'', roundModifiers:defaultRoundModifiers(), roleRoundEffects:{ sellerDescription:'', buyerDescription:'', sellerEffects:[], buyerEffects:[] } }; }
  function defaultCompanyProfile(){ return { name:'', members:'', sellerProfile:'', sellerProfileLabel:'', profileDescription:'', startCapital:0, currentCapital:0, fixedCosts:0, variableCosts:0, capacity:0, notes:'' }; }
  function defaultBuyerProfile(){ return { name:'', buyerProfile:'', currentBalance:0, savingsAmount:0, spending:0, transferHistory:[] }; }

  function baseState(){ return { version:3, currentPhase:1, currentRound:1, selectedScenario:'', moderation:{ scenariosCollapsed:false }, appStateMeta:{}, lastUsed:{ questionnaireRun:1, sellerRoleRun:1, buyerRoleRun:1 }, questionnaire:{ run1:{}, run2:{ sellerProfileId:'' } }, roles:{ seller:{ run2:null }, buyer:{ run2:null } }, companyProfile:defaultCompanyProfile(), buyerProfile:defaultBuyerProfile(), results:{}, game:defaultGameState() }; }

  function migrateLegacyQuestionnaire(state){
    const raw = localStorage.getItem(LEGACY_Q_KEY);
    if(!raw || Object.keys(state.questionnaire.run1 || {}).length) return state;
    try{ state.questionnaire.run1 = Object.assign({}, JSON.parse(raw)); }catch(_e){}
    return state;
  }

  function normalizeCompanyProfile(input){
    const data = input || {};
    const profileId = first(data, ['sellerProfile', 'sellerProfileId', 'profileId'], '');
    const profile = SELLER_PROFILES[profileId] || null;
    const startCapital = num(first(data, ['startCapital', ...synonyms.startCapital], profile?.baseValues.startBudget || 0));
    const fixedCosts = num(first(data, ['fixedCosts', ...synonyms.fixedCosts], profile?.baseValues.fixedCost || 0));
    const variableCosts = num(first(data, ['variableCosts', ...synonyms.variableCosts], profile?.baseValues.variableCost || 0));
    const capacity = num(first(data, ['capacity', ...synonyms.capacity], profile?.baseValues.capacity || 0));
    const currentCapital = num(first(data, ['currentCapital', 'capital', 'remainingCapital'], startCapital));
    return {
      ...defaultCompanyProfile(),
      name: String(first(data, ['name', 'companyName', 'unternehmenName', 'u_name', 'teamName'], '')),
      members: String(first(data, ['members', 'u_members', 'teamMembers'], '')),
      sellerProfile: profileId,
      sellerProfileLabel: profile?.label || String(first(data, ['sellerProfileLabel', 'profileLabel'], '')),
      profileDescription: profile?.description || String(first(data, ['profileDescription'], '')),
      startCapital,
      currentCapital,
      fixedCosts,
      variableCosts,
      capacity,
      notes: String(first(data, ['notes', 'specialFeatures'], ''))
    };
  }

  function loadCompanyProfile(stateInput){
    const state = stateInput || readState();
    const company = normalizeCompanyProfile({
      ...(state.questionnaire?.run1 || {}),
      ...(state.questionnaire?.run2 || {}),
      ...(state.companyProfile || {})
    });
    if(!stateInput){
      state.companyProfile = company;
      writeState(state);
    }
    return company;
  }

  function saveCompanyProfile(profile, extras = {}){
    const state = readState();
    const normalized = normalizeCompanyProfile({
      ...(state.questionnaire?.run1 || {}),
      ...(state.questionnaire?.run2 || {}),
      ...(state.companyProfile || {}),
      ...(profile || {})
    });
    state.companyProfile = normalized;
    state.questionnaire.run2 = {
      ...(state.questionnaire.run2 || {}),
      u_name: normalized.name,
      u_members: normalized.members,
      sellerProfileId: normalized.sellerProfile,
      startCapital: normalized.startCapital,
      currentCapital: normalized.currentCapital,
      fixedCosts: normalized.fixedCosts,
      variableCosts: normalized.variableCosts,
      capacity: normalized.capacity,
      notes: normalized.notes,
      ...(extras || {})
    };
    state.roles.seller.run2 = makeSellerRun2Model(state.questionnaire.run2);
    writeState(state);
    return normalized;
  }

  function normalizeBuyerProfile(input){
    const data = input || {};
    return {
      ...defaultBuyerProfile(),
      name: String(first(data, ['name', 'buyerName'], '')),
      buyerProfile: String(first(data, ['buyerProfile', 'profileId'], '')),
      currentBalance: num(first(data, ['currentBalance', ...synonyms.currentBalance], 0)),
      savingsAmount: num(first(data, ['savingsAmount', ...synonyms.savingsAmount], 0)),
      spending: num(first(data, ['spending', 'spent'], 0)),
      transferHistory: Array.isArray(data.transferHistory) ? data.transferHistory : []
    };
  }

  function readState(){
    let state = baseState();
    const raw = localStorage.getItem(KEY);
    if(raw){
      try{
        const parsed = JSON.parse(raw) || {};
        state = Object.assign(baseState(), parsed);
        state.lastUsed = Object.assign(baseState().lastUsed, parsed.lastUsed || {});
        state.questionnaire = Object.assign(baseState().questionnaire, parsed.questionnaire || {});
        state.questionnaire.run1 = Object.assign({}, state.questionnaire.run1 || {});
        state.questionnaire.run2 = Object.assign({ sellerProfileId: '' }, state.questionnaire.run2 || {});
        state.roles = Object.assign(baseState().roles, parsed.roles || {});
        state.game = Object.assign(defaultGameState(), parsed.game || {});
        state.game.roundModifiers = Object.assign(defaultRoundModifiers(), state.game.roundModifiers || {});
        state.game.roleRoundEffects = Object.assign(defaultGameState().roleRoundEffects, state.game.roleRoundEffects || {});
        state.game.sellers = Array.isArray(state.game.sellers) ? state.game.sellers : [];
        state.game.buyers = Array.isArray(state.game.buyers) ? state.game.buyers : [];
      }catch(_e){ warn('State konnte nicht gelesen werden, setze Defaults.'); }
    }
    state = migrateLegacyQuestionnaire(state);
    state.companyProfile = normalizeCompanyProfile(state.companyProfile || state.questionnaire.run2 || state.questionnaire.run1);
    state.buyerProfile = normalizeBuyerProfile(state.buyerProfile || state.roles?.buyer?.run2);
    return state;
  }

  function writeState(state){
    if(!state) return readState();
    state.companyProfile = normalizeCompanyProfile(state.companyProfile || {});
    state.buyerProfile = normalizeBuyerProfile(state.buyerProfile || {});
    localStorage.setItem(KEY, JSON.stringify(state));
    return state;
  }

  function applySellerProfileDefaults(profileId, source){
    const profile = SELLER_PROFILES[profileId];
    if(!profile){ warn('Unbekanntes Verkäuferprofil: ' + profileId); return normalizeCompanyProfile(source || {}); }
    const base = normalizeCompanyProfile(source || {});
    return normalizeCompanyProfile({
      ...base,
      sellerProfile: profileId,
      sellerProfileLabel: profile.label,
      profileDescription: profile.description,
      startCapital: profile.baseValues.startBudget,
      currentCapital: base.currentCapital || profile.baseValues.startBudget,
      fixedCosts: profile.baseValues.fixedCost,
      variableCosts: profile.baseValues.variableCost,
      capacity: profile.baseValues.capacity
    });
  }

  function makeSellerRun2Model(questionnaireRun2){
    const company = normalizeCompanyProfile(questionnaireRun2 || {});
    if(!company.sellerProfile) return null;
    return {
      run: 2,
      role: 'seller',
      profileId: company.sellerProfile,
      profileLabel: company.sellerProfileLabel,
      profileDescription: company.profileDescription,
      hints: SELLER_PROFILES[company.sellerProfile]?.hints || '',
      meta: { teamName: company.name || questionnaireRun2?.u_name || '', members: questionnaireRun2?.u_members || '' },
      baseValues: { startBudget: company.startCapital, variableCost: company.variableCosts, fixedCost: company.fixedCosts, capacity: company.capacity },
      derivedValues: { currentBudget: company.currentCapital, currentVariableCost: company.variableCosts }
    };
  }

  window.EisauktionState = {
    KEY, LEGACY_Q_KEY, SELLER_PROFILES, BUYER_PROFILES, synonyms,
    defaultGameState, defaultRoundModifiers, defaultCompanyProfile, defaultBuyerProfile,
    normalizeCompanyProfile, normalizeBuyerProfile, applySellerProfileDefaults,
    loadCompanyProfile, saveCompanyProfile,
    readState, writeState, makeSellerRun2Model
  };
})();
