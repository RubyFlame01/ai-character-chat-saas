// Single source of truth for UI copy. Every locale file must implement this
// type completely — adding a key here intentionally breaks compilation for
// every locale until its translation is added.
export type Dictionary = {
  nav: {
    characters: string;
    pricing: string;
    dashboard: string;
    messages: string;
    admin: string;
    login: string;
    startChat: string;
    credits: string;
    generate: string;
    builder: string;
  };
  messages: {
    title: string;
    subtitle: string;
    empty: string;
    deleteBtn: string;
    clearAll: string;
    confirmClear: string;
    resume: string;
  };
  generate: {
    metaDescription: string;
    eyebrow: string;
    title: string;
    description: string;
    promptLabel: string;
    promptPlaceholder: string;
    style: string;
    realistic: string;
    anime: string;
    shape: string;
    portrait: string;
    square: string;
    cta: string;
    generating: string;
    costNote: string;
    emptyState: string;
    error: string;
    outOfCredits: string;
    loginRequired: string;
  };
  footer: {
    description: string;
    privacy: string;
    terms: string;
    refunds: string;
    contentPolicy: string;
    adultNotice: string;
  };
  ageGate: {
    title: string;
    description: string;
    confirm: string;
    exit: string;
  };
  home: {
    eyebrow: string;
    title: string;
    description: string;
    browse: string;
    pricing: string;
    stats: string[];
    featuredEyebrow: string;
    featuredTitle: string;
    allCharacters: string;
    personasCount: string;
    personasModes: string;
  };
  characters: {
    metaDescription: string;
    eyebrow: string;
    title: string;
    description: string;
    searchHint: string;
    all: string;
    realistic: string;
    anime: string;
    comfyNote: string;
    matchSummary: string;
    statPersonas: string;
    statModel: string;
    statMemory: string;
    groups: {
      female: string;
      male: string;
      animeFemale: string;
      animeMale: string;
    };
  };
  characterDetail: {
    relationship: string;
    occupation: string;
    age: string;
    lifeStory: string;
    startingPoint: string;
    personality: string;
    startPrivateChat: string;
    backToLibrary: string;
    relatedCharacters: string;
  };
  chat: {
    privateChat: string;
    providerNote: string;
    credits: string;
    creditsPerMessage: string;
    model: string;
    regenerate: string;
    continue: string;
    edit: string;
    typing: string;
    placeholder: string;
    fallbackError: string;
    outOfCreditsTitle: string;
    outOfCreditsDescription: string;
    lockedModelTitle: string;
    lockedModelDescription: string;
    upgradeCta: string;
    freshStart: string;
    historyNotice: string;
  };
  categories: Record<string, string>;
  pricing: {
    eyebrow: string;
    title: string;
    description: string;
    buyCredits: string;
    oneTime: string;
  };
  dashboard: {
    recentChats: string;
    noChats: string;
    resumeChat: string;
    myCharacters: string;
    noCharacters: string;
    pendingPortrait: string;
    startChat: string;
    upgradePlan: string;
  };
  legal: {
    privacyTitle: string;
    termsTitle: string;
    refundTitle: string;
    contentPolicyTitle: string;
  };
  builder: {
    navLabel: string;
    eyebrow: string;
    title: string;
    description: string;
    nameLabel: string;
    namePlaceholder: string;
    descLabel: string;
    descPlaceholder: string;
    genderLabel: string;
    styleLabel: string;
    ageLabel: string;
    bodyLabel: string;
    personalityLabel: string;
    relationshipLabel: string;
    cta: string;
    creating: string;
    costNote: string;
    error: string;
    outOfCredits: string;
    loginRequired: string;
    successTitle: string;
    successBody: string;
    goChat: string;
    gender: { female: string; male: string };
    style: { realistic: string; anime: string };
    body: { slim: string; curvy: string; athletic: string; voluptuous: string; petite: string };
    personality: {
      playful: string;
      dominant: string;
      shy: string;
      romantic: string;
      mysterious: string;
      bratty: string;
      caring: string;
      confident: string;
    };
    relationship: {
      girlfriend: string;
      stepsister: string;
      "best-friend": string;
      coworker: string;
      neighbor: string;
      stranger: string;
      ex: string;
    };
  };
};
