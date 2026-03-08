(function(){
  const KEY = 'eisauktion_state_v2';
  const LEGACY_Q_KEY = 'eisauktion_questionnaire';

  const SELLER_PROFILES = {
    'discounter': {
      label: 'Discounter / Massenanbieter',
      description: 'Ihr verkauft günstig und in großen Mengen. Vorteil: viele Käufer. Risiko: wenig Gewinn pro Eis.',
      baseValues: { startBudget: 38, variableCost: 1.1 },
      hints: 'Stärke: niedrige Kosten. Risiko: Bei Preiskampf bleibt kaum Gewinn.'
    },
    'innenstadt': {
      label: 'Innenstadt-Eisdiele',
      description: 'Ihr habt viele Laufkundinnen und Laufkunden, aber auch höhere Kosten durch den Standort.',
      baseValues: { startBudget: 32, variableCost: 1.6 },
      hints: 'Stärke: gute Lage. Risiko: Hohe Kosten müssen über Verkäufe gedeckt werden.'
    },
    'premium': {
      label: 'Premium-Eisdiele',
      description: 'Ihr setzt auf Qualität und Image. Dafür sind eure Kosten pro Portion höher.',
      baseValues: { startBudget: 30, variableCost: 2.2 },
      hints: 'Stärke: höhere Zahlungsbereitschaft mancher Käufer. Risiko: Preis muss passen.'
    },
    'eiswagen': {
      label: 'Mobiler Eiswagen',
      description: 'Ihr seid flexibel und könnt dorthin gehen, wo viel los ist. Das kann stark schwanken.',
      baseValues: { startBudget: 28, variableCost: 1.4 },
      hints: 'Stärke: flexibel beim Standort. Risiko: Nachfrage kann schnell wechseln.'
    },
    'klein': {
      label: 'Kleiner Anbieter mit wenig Kapital',
      description: 'Ihr startet mit wenig Geld. Jede Entscheidung muss gut geplant sein.',
      baseValues: { startBudget: 20, variableCost: 1.8 },
      hints: 'Stärke: vorsichtiges Wirtschaften. Risiko: wenig Puffer bei Verlusten.'
    }
  };

  const BUYER_PROFILES = {
    'preisorientiert': {
      label: 'Preisorientierter Käufer',
      description: 'Du achtest vor allem auf den günstigsten Preis und wechselst schnell den Anbieter.',
      preferences: { priceFocus: 3, qualityFocus: 1, brandFocus: 1 },
      spendingHint: 'Du kaufst meist nur bei günstigen Preisen. Spare eher Geld für später.'
    },
    'qualitaet': {
      label: 'Qualitätsorientierter Käufer',
      description: 'Du kaufst lieber gutes Eis, auch wenn es etwas teurer ist.',
      preferences: { priceFocus: 1, qualityFocus: 3, brandFocus: 1 },
      spendingHint: 'Plane genug Budget für bessere Qualität ein und vergleiche trotzdem Preise.'
    },
    'image': {
      label: 'Imageorientierter Käufer',
      description: 'Dir ist wichtig, bei welchem Anbieter du kaufst und wie er wirkt.',
      preferences: { priceFocus: 1, qualityFocus: 2, brandFocus: 3 },
      spendingHint: 'Marke und Eindruck sind dir wichtig. Halte etwas Budget für passende Angebote frei.'
    },
    'budgetknapp': {
      label: 'Budgetknapper Käufer',
      description: 'Du hast wenig Geld und musst sehr genau rechnen.',
      preferences: { priceFocus: 3, qualityFocus: 1, brandFocus: 1 },
      spendingHint: 'Du musst besonders vorsichtig mit deinem Geld umgehen.'
    },
    'sommer': {
      label: 'Spontaner Sommerkäufer',
      description: 'Bei Hitze kaufst du spontan, wenn Angebot und Preis gerade passen.',
      preferences: { priceFocus: 2, qualityFocus: 2, brandFocus: 1 },
      spendingHint: 'Bei guten Marktbedingungen gibst du eher viel Geld aus.'
    },
    'stammkunde': {
      label: 'Treuer Stammkunde',
      description: 'Du bleibst oft bei deinem Lieblingsanbieter, wenn die Qualität stimmt.',
      preferences: { priceFocus: 1, qualityFocus: 2, brandFocus: 3 },
      spendingHint: 'Du bleibst oft loyal. Plane ein stabiles Budget für deinen Lieblingsanbieter.'
    }
  };

  function defaultRoundModifiers(){
    return {
      seasonEffect: 'neutral',
      demandShock: 'none',
      costChange: 'none',
      imageEffect: 'neutral',
      locationCost: 0
    };
  }

  function defaultGameState(){
    return {
      currentRound: 1,
      sellers: [],
      buyers: [],
      currentScenarioId: '',
      scenarioNotes: '',
      roundModifiers: defaultRoundModifiers()
    };
  }

  function baseState(){
    return {
      version: 2,
      lastUsed: { questionnaireRun: 1, sellerRoleRun: 1, buyerRoleRun: 1 },
      questionnaire: { run1: {}, run2: { sellerProfileId: '' } },
      roles: { seller: { run2: null }, buyer: { run2: null } },
      game: defaultGameState()
    };
  }

  function migrateLegacyQuestionnaire(state){
    const raw = localStorage.getItem(LEGACY_Q_KEY);
    if(!raw || Object.keys(state.questionnaire.run1 || {}).length) return state;
    try{
      const legacy = JSON.parse(raw);
      state.questionnaire.run1 = Object.assign({}, legacy);
    }catch(_e){ }
    return state;
  }

  function readState(){
    let state = baseState();
    const raw = localStorage.getItem(KEY);
    if(raw){
      try{
        const parsed = JSON.parse(raw);
        state = Object.assign(baseState(), parsed || {});
        state.lastUsed = Object.assign(baseState().lastUsed, parsed.lastUsed || {});
        state.questionnaire = Object.assign(baseState().questionnaire, parsed.questionnaire || {});
        state.questionnaire.run1 = Object.assign({}, state.questionnaire.run1 || {});
        state.questionnaire.run2 = Object.assign({ sellerProfileId: '' }, state.questionnaire.run2 || {});
        state.roles = Object.assign(baseState().roles, parsed.roles || {});
        state.game = Object.assign(defaultGameState(), parsed.game || {});
        state.game.roundModifiers = Object.assign(defaultRoundModifiers(), state.game.roundModifiers || {});
        state.game.sellers = Array.isArray(state.game.sellers) ? state.game.sellers : [];
        state.game.buyers = Array.isArray(state.game.buyers) ? state.game.buyers : [];
      }catch(_e){ }
    }
    return migrateLegacyQuestionnaire(state);
  }

  function writeState(state){
    localStorage.setItem(KEY, JSON.stringify(state));
    return state;
  }

  function makeSellerRun2Model(questionnaireRun2){
    const profile = SELLER_PROFILES[questionnaireRun2?.sellerProfileId];
    if(!profile) return null;
    const startBudget = Number(profile.baseValues.startBudget);
    const variableCost = Number(profile.baseValues.variableCost);
    return {
      run: 2,
      role: 'seller',
      profileId: questionnaireRun2.sellerProfileId,
      profileLabel: profile.label,
      profileDescription: profile.description,
      hints: profile.hints,
      meta: {
        teamName: questionnaireRun2.u_name || '',
        members: questionnaireRun2.u_members || ''
      },
      baseValues: { startBudget, variableCost },
      dynamicModifiers: { season: 0, locationCost: 0, energyShock: 0, qualityBonus: 0, imageBonus: 0 },
      derivedValues: { currentBudget: startBudget, currentVariableCost: variableCost }
    };
  }

  window.EisauktionState = {
    KEY,
    LEGACY_Q_KEY,
    SELLER_PROFILES,
    BUYER_PROFILES,
    defaultGameState,
    defaultRoundModifiers,
    readState,
    writeState,
    makeSellerRun2Model
  };
})();
