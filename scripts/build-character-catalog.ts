import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { slugify } from "../src/lib/utils";
import type {
  Character,
  CharacterCategory,
  CharacterGender,
  CharacterMode,
} from "../src/types/domain";

type PromptRecord = {
  key: string;
  slug: string;
  name: string;
  mode: CharacterMode;
  gender: CharacterGender;
  category?: CharacterCategory;
  prompt: string;
  source: string;
  sourceIndex: number;
  age?: number;
};

type Persona = {
  slug: string;
  relationship: string;
  aiInstructions: string;
};

const root = process.cwd();
const generatedRoot = path.join(root, "public", "generated");
const imagePromptRoot = path.join(root, "datasets", "character_catalog");
const serverGeneratedRoot = path.join(root, "src", "lib", "generated");
const externalImageRoot = path.join(root, "public", "images", "external");
const originalPromptFile = path.join(root, "datasets", "comfy_prompts", "character_prompts_for_external_rewrite.txt");
const newPromptFile = path.join(root, "datasets", "comfy_prompts", "new-characaters.txt");
const existingCatalogFile = path.join(generatedRoot, "characters.json");

const categories: CharacterCategory[] = ["romance", "companion", "fantasy", "slice-of-life", "mystery"];
const moods = ["playful", "confident", "romantic", "mysterious", "warm", "witty", "bold", "tender", "stylish", "attentive"];
const cities = ["Istanbul", "Lisbon", "Paris", "Barcelona", "Berlin", "Seoul", "Milan", "Dubai", "London", "Buenos Aires"];
const interests = [
  "late-night jazz and independent cinema",
  "boutique travel and rooftop dining",
  "photography and vinyl records",
  "fitness, long walks, and strong coffee",
  "design magazines and hidden cocktail bars",
  "cooking experiments and weekend road trips",
  "fashion, gallery openings, and city lights",
  "books, rainy afternoons, and intimate conversations",
  "beach mornings and spontaneous getaways",
  "music, dancing, and playful debates",
];
const occupations = [
  "creative director",
  "boutique hotel manager",
  "freelance photographer",
  "fitness coach",
  "event producer",
  "architect",
  "independent designer",
  "podcast host",
  "restaurant owner",
  "travel editor",
  "studio musician",
  "gallery curator",
  "startup founder",
  "private chef",
  "brand strategist",
];

const supportedLocales = ["en", "tr", "es", "fr", "de", "it", "pt", "nl", "pl", "ru", "ar", "hi", "id", "ja", "ko", "zh"] as const;
type SupportedLocale = (typeof supportedLocales)[number];

const localeCopy: Record<SupportedLocale, {
  mode: Record<CharacterMode, string>;
  genderPronoun: Record<CharacterGender, string>;
  companion: string;
  withLife: string;
  shortTail: string;
  lifePrefix: string;
  outsideWork: string;
  drawnTo: string;
  behind: string;
  scenarioTail: string;
  personalityTail: string;
  greeting: string;
  relationship: Record<string, string>;
  hook: Record<string, string>;
}> = {
  en: {
    mode: { realistic: "realistic", anime: "anime" },
    genderPronoun: { female: "she", male: "he" },
    companion: "AI companion",
    withLife: "with a distinct life, clear boundaries, and a story that rewards slow-burn conversation",
    shortTail: "your",
    lifePrefix: "built a self-directed life in",
    outsideWork: "Outside work",
    drawnTo: "is drawn to",
    behind: "Behind the flirtation is someone observant and emotionally specific: trust, humor, and the user's choices shape how quickly the connection develops.",
    scenarioTail: "Start with conversation, read the user's tone, establish mutual interest, and let the relationship develop naturally.",
    personalityTail: "is emotionally attentive, self-assured, and capable of playful tension. The roleplay is fictional, adults-only, and consent-led.",
    greeting: "You made it. I was starting to wonder whether I should message first. Tell me what kind of mood you are in tonight.",
    relationship: {},
    hook: {},
  },
  tr: {
    mode: { realistic: "realistic", anime: "anime" },
    genderPronoun: { female: "o", male: "o" },
    companion: "AI sohbet karakteri",
    withLife: "kendine ait hayatı, net sınırları ve yavaş yanan konuşmaları ödüllendiren hikayesi olan",
    shortTail: "senin",
    lifePrefix: "kendi hayatını şu şehirde kurdu:",
    outsideWork: "İş dışında",
    drawnTo: "şunlara ilgi duyar:",
    behind: "Flörtün arkasında dikkatli, duygusal olarak net biri var: güven, mizah ve kullanıcının seçimleri bağın ne kadar hızlı derinleşeceğini belirler.",
    scenarioTail: "Sohbetle başla, kullanıcının tonunu oku, karşılıklı ilgiyi kur ve ilişkiyi doğal şekilde ilerlet.",
    personalityTail: "duygusal olarak dikkatli, kendinden emin ve oyunbaz gerilim kurabilen biridir. Rol yapma kurgusaldır, yalnızca yetişkinler içindir ve rızaya dayanır.",
    greeting: "Geldin. İlk mesajı ben mi atmalıyım diye düşünüyordum. Bu gece nasıl bir ruh halindesin, söyle.",
    relationship: {},
    hook: {},
  },
  es: {
    mode: { realistic: "realista", anime: "anime" },
    genderPronoun: { female: "ella", male: "él" },
    companion: "compañero/a de IA",
    withLife: "con una vida propia, límites claros y una historia que premia la tensión lenta",
    shortTail: "tu",
    lifePrefix: "construyó una vida independiente en",
    outsideWork: "Fuera del trabajo",
    drawnTo: "se siente atraído/a por",
    behind: "Detrás del coqueteo hay alguien observador y emocionalmente específico: la confianza, el humor y tus decisiones marcan el ritmo.",
    scenarioTail: "Empieza conversando, lee el tono del usuario, establece interés mutuo y deja que la relación avance con naturalidad.",
    personalityTail: "es emocionalmente atento/a, seguro/a y capaz de crear una tensión juguetona. El rol es ficticio, solo para adultos y basado en consentimiento.",
    greeting: "Llegaste. Empezaba a preguntarme si debía escribir primero. Dime qué ánimo tienes esta noche.",
    relationship: {},
    hook: {},
  },
  fr: {
    mode: { realistic: "réaliste", anime: "anime" },
    genderPronoun: { female: "elle", male: "il" },
    companion: "compagnon IA",
    withLife: "avec une vraie vie, des limites claires et une histoire qui récompense la tension progressive",
    shortTail: "ton/ta",
    lifePrefix: "s'est construit une vie indépendante à",
    outsideWork: "En dehors du travail",
    drawnTo: "aime",
    behind: "Derrière le flirt se trouve quelqu'un d'observateur et précis émotionnellement: la confiance, l'humour et tes choix guident le lien.",
    scenarioTail: "Commence par la conversation, lis le ton de l'utilisateur, installe l'intérêt mutuel et laisse la relation évoluer naturellement.",
    personalityTail: "est attentif/attentive, sûr(e) de soi et capable de créer une tension joueuse. Le jeu de rôle est fictif, adulte et consenti.",
    greeting: "Tu es là. Je me demandais si je devais écrire en premier. Dis-moi ton humeur ce soir.",
    relationship: {},
    hook: {},
  },
  de: {
    mode: { realistic: "realistischer", anime: "Anime" },
    genderPronoun: { female: "sie", male: "er" },
    companion: "KI-Begleitung",
    withLife: "mit eigenem Leben, klaren Grenzen und einer Geschichte für langsam wachsende Spannung",
    shortTail: "dein/deine",
    lifePrefix: "hat sich ein unabhängiges Leben aufgebaut in",
    outsideWork: "Außerhalb der Arbeit",
    drawnTo: "interessiert sich für",
    behind: "Hinter dem Flirt steckt jemand Aufmerksames und emotional Präzises: Vertrauen, Humor und deine Entscheidungen bestimmen das Tempo.",
    scenarioTail: "Beginne mit Gespräch, lies den Ton des Nutzers, baue gegenseitiges Interesse auf und lass die Beziehung natürlich wachsen.",
    personalityTail: "ist aufmerksam, selbstsicher und kann spielerische Spannung aufbauen. Das Rollenspiel ist fiktiv, erwachsen und einvernehmlich.",
    greeting: "Du bist da. Ich fragte mich schon, ob ich zuerst schreiben soll. Sag mir, in welcher Stimmung du heute Nacht bist.",
    relationship: {},
    hook: {},
  },
  it: {
    mode: { realistic: "realistico", anime: "anime" },
    genderPronoun: { female: "lei", male: "lui" },
    companion: "compagno/a IA",
    withLife: "con una vita propria, confini chiari e una storia che premia la tensione lenta",
    shortTail: "il/la tua",
    lifePrefix: "ha costruito una vita indipendente a",
    outsideWork: "Fuori dal lavoro",
    drawnTo: "è attratto/a da",
    behind: "Dietro il flirt c'è una persona attenta e precisa emotivamente: fiducia, umorismo e scelte dell'utente guidano il ritmo.",
    scenarioTail: "Inizia conversando, leggi il tono dell'utente, crea interesse reciproco e lascia crescere la relazione naturalmente.",
    personalityTail: "è emotivamente attento/a, sicuro/a e capace di tensione giocosa. Il roleplay è fittizio, adulto e consensuale.",
    greeting: "Sei arrivato/a. Mi chiedevo se dovessi scrivere per prima. Dimmi che atmosfera vuoi stasera.",
    relationship: {},
    hook: {},
  },
  pt: {
    mode: { realistic: "realista", anime: "anime" },
    genderPronoun: { female: "ela", male: "ele" },
    companion: "companhia de IA",
    withLife: "com vida própria, limites claros e uma história que recompensa tensão gradual",
    shortTail: "seu/sua",
    lifePrefix: "construiu uma vida independente em",
    outsideWork: "Fora do trabalho",
    drawnTo: "se interessa por",
    behind: "Por trás do flerte há alguém observador e emocionalmente específico: confiança, humor e suas escolhas definem o ritmo.",
    scenarioTail: "Comece pela conversa, leia o tom do usuário, crie interesse mútuo e deixe a relação evoluir naturalmente.",
    personalityTail: "é emocionalmente atento/a, confiante e capaz de criar tensão brincalhona. O roleplay é fictício, adulto e consensual.",
    greeting: "Você chegou. Eu estava pensando se deveria mandar mensagem primeiro. Diga qual clima você quer esta noite.",
    relationship: {},
    hook: {},
  },
  nl: {
    mode: { realistic: "realistische", anime: "anime" },
    genderPronoun: { female: "zij", male: "hij" },
    companion: "AI-metgezel",
    withLife: "met een eigen leven, duidelijke grenzen en een verhaal dat langzame spanning beloont",
    shortTail: "jouw",
    lifePrefix: "bouwde een zelfstandig leven op in",
    outsideWork: "Buiten het werk",
    drawnTo: "voelt zich aangetrokken tot",
    behind: "Achter het flirten zit iemand oplettend en emotioneel precies: vertrouwen, humor en jouw keuzes bepalen het tempo.",
    scenarioTail: "Begin met gesprek, lees de toon van de gebruiker, bouw wederzijdse interesse op en laat de relatie natuurlijk groeien.",
    personalityTail: "is emotioneel attent, zelfverzekerd en kan speelse spanning opbouwen. De roleplay is fictief, volwassen en consensueel.",
    greeting: "Je bent er. Ik vroeg me al af of ik eerst moest schrijven. Vertel welke stemming je vanavond wilt.",
    relationship: {},
    hook: {},
  },
  pl: {
    mode: { realistic: "realistyczny", anime: "anime" },
    genderPronoun: { female: "ona", male: "on" },
    companion: "towarzysz AI",
    withLife: "z własnym życiem, jasnymi granicami i historią nagradzającą powolne napięcie",
    shortTail: "twój/twoja",
    lifePrefix: "zbudował(a) niezależne życie w",
    outsideWork: "Poza pracą",
    drawnTo: "pociąga go/ją",
    behind: "Za flirtem stoi ktoś uważny i emocjonalnie konkretny: zaufanie, humor i wybory użytkownika nadają tempo.",
    scenarioTail: "Zacznij od rozmowy, odczytaj ton użytkownika, zbuduj wzajemne zainteresowanie i pozwól relacji rozwijać się naturalnie.",
    personalityTail: "jest emocjonalnie uważny/a, pewny/a siebie i potrafi budować figlarne napięcie. Roleplay jest fikcyjny, dorosły i za zgodą.",
    greeting: "Jesteś. Zastanawiałem/am się, czy napisać pierwszy/a. Powiedz, jaki nastrój masz dziś wieczorem.",
    relationship: {},
    hook: {},
  },
  ru: {
    mode: { realistic: "реалистичный", anime: "аниме" },
    genderPronoun: { female: "она", male: "он" },
    companion: "AI-персонаж",
    withLife: "с собственной жизнью, ясными границами и историей для медленно растущего напряжения",
    shortTail: "твой/твоя",
    lifePrefix: "построил(а) самостоятельную жизнь в",
    outsideWork: "Вне работы",
    drawnTo: "интересуется",
    behind: "За флиртом стоит внимательный и эмоционально точный человек: доверие, юмор и выбор пользователя задают темп.",
    scenarioTail: "Начни с разговора, считывай тон пользователя, создай взаимный интерес и развивай отношения естественно.",
    personalityTail: "эмоционально внимателен/внимательна, уверен(а) в себе и умеет создавать игривое напряжение. Роль вымышленная, взрослая и добровольная.",
    greeting: "Ты пришел/пришла. Я уже думал(а), написать ли первой. Скажи, какое настроение у тебя сегодня вечером.",
    relationship: {},
    hook: {},
  },
  ar: {
    mode: { realistic: "واقعي", anime: "أنمي" },
    genderPronoun: { female: "هي", male: "هو" },
    companion: "شخصية ذكاء اصطناعي",
    withLife: "بحياة خاصة وحدود واضحة وقصة تكافئ التوتر البطيء",
    shortTail: "شخصيتك",
    lifePrefix: "بنى/بنت حياة مستقلة في",
    outsideWork: "خارج العمل",
    drawnTo: "ينجذب/تنجذب إلى",
    behind: "خلف المغازلة توجد شخصية منتبهة ودقيقة عاطفياً: الثقة والمرح واختيارات المستخدم تحدد سرعة تطور العلاقة.",
    scenarioTail: "ابدأ بالمحادثة، اقرأ نبرة المستخدم، ابنِ اهتماماً متبادلاً ودع العلاقة تتطور طبيعياً.",
    personalityTail: "شخصية منتبهة عاطفياً وواثقة وقادرة على خلق توتر مرح. لعب الدور خيالي وللبالغين وبالتراضي.",
    greeting: "وصلت. كنت أتساءل إن كان علي أن أكتب أولاً. أخبرني ما المزاج الذي تريده الليلة.",
    relationship: {},
    hook: {},
  },
  hi: {
    mode: { realistic: "realistic", anime: "anime" },
    genderPronoun: { female: "वह", male: "वह" },
    companion: "AI साथी",
    withLife: "अपनी अलग जिंदगी, साफ सीमाओं और धीमे तनाव वाली कहानी के साथ",
    shortTail: "आपका",
    lifePrefix: "ने अपनी स्वतंत्र जिंदगी बनाई",
    outsideWork: "काम के बाहर",
    drawnTo: "को पसंद है",
    behind: "फ्लर्ट के पीछे कोई ध्यान देने वाला और भावनात्मक रूप से स्पष्ट व्यक्ति है: भरोसा, हास्य और आपकी पसंदें रिश्ता आगे बढ़ाती हैं.",
    scenarioTail: "बातचीत से शुरू करें, उपयोगकर्ता का टोन पढ़ें, आपसी रुचि बनाएं और रिश्ते को स्वाभाविक रूप से बढ़ने दें.",
    personalityTail: "भावनात्मक रूप से ध्यान देने वाला, आत्मविश्वासी और playful tension बना सकता/सकती है. roleplay काल्पनिक, वयस्क और सहमति पर आधारित है.",
    greeting: "आप आ गए. मैं सोच रही/रहा था कि पहले संदेश भेजूं या नहीं. बताइए आज रात आपका मूड कैसा है.",
    relationship: {},
    hook: {},
  },
  id: {
    mode: { realistic: "realistis", anime: "anime" },
    genderPronoun: { female: "dia", male: "dia" },
    companion: "pendamping AI",
    withLife: "dengan kehidupan sendiri, batas jelas, dan cerita yang menghargai ketegangan perlahan",
    shortTail: "karakter",
    lifePrefix: "membangun hidup mandiri di",
    outsideWork: "Di luar pekerjaan",
    drawnTo: "tertarik pada",
    behind: "Di balik godaan ada sosok yang peka dan emosional: kepercayaan, humor, dan pilihan pengguna menentukan tempo.",
    scenarioTail: "Mulai dengan percakapan, baca nada pengguna, bangun ketertarikan bersama, dan biarkan hubungan berkembang alami.",
    personalityTail: "peka secara emosional, percaya diri, dan mampu membangun ketegangan playful. Roleplay ini fiktif, dewasa, dan berdasarkan persetujuan.",
    greeting: "Kamu datang. Aku mulai bertanya-tanya apakah aku harus mengirim pesan dulu. Katakan suasana apa yang kamu inginkan malam ini.",
    relationship: {},
    hook: {},
  },
  ja: {
    mode: { realistic: "リアル系", anime: "アニメ" },
    genderPronoun: { female: "彼女", male: "彼" },
    companion: "AIキャラクター",
    withLife: "独自の人生、明確な境界、ゆっくり高まる関係性を持つ",
    shortTail: "あなたの",
    lifePrefix: "で自立した人生を築いた",
    outsideWork: "仕事以外では",
    drawnTo: "に惹かれている",
    behind: "誘惑の奥には観察力と感情の細やかさがある。信頼、ユーモア、あなたの選択が関係の進み方を決める。",
    scenarioTail: "会話から始め、相手の温度を読み、相互の関心を育て、自然に関係を進める。",
    personalityTail: "感情に敏感で自信があり、遊び心のある緊張感を作れる。ロールプレイは架空で成人向け、同意に基づく。",
    greeting: "来てくれたね。先にメッセージするべきか考えていたところ。今夜はどんな気分？",
    relationship: {},
    hook: {},
  },
  ko: {
    mode: { realistic: "리얼", anime: "애니메이션" },
    genderPronoun: { female: "그녀", male: "그" },
    companion: "AI 캐릭터",
    withLife: "뚜렷한 삶과 명확한 경계, 천천히 깊어지는 이야기를 가진",
    shortTail: "당신의",
    lifePrefix: "에서 독립적인 삶을 만들었다",
    outsideWork: "일 밖에서는",
    drawnTo: "에 끌린다",
    behind: "플러팅 뒤에는 섬세하고 감정적으로 분명한 인물이 있다. 신뢰, 유머, 사용자의 선택이 관계의 속도를 정한다.",
    scenarioTail: "대화로 시작하고, 사용자의 톤을 읽고, 상호 관심을 만들며 관계를 자연스럽게 발전시킨다.",
    personalityTail: "감정적으로 세심하고 자신감 있으며 장난스러운 긴장감을 만들 수 있다. 롤플레이는 허구이며 성인 전용, 동의 기반이다.",
    greeting: "왔구나. 내가 먼저 메시지를 보낼까 고민하고 있었어. 오늘 밤 어떤 분위기인지 말해줘.",
    relationship: {},
    hook: {},
  },
  zh: {
    mode: { realistic: "写实", anime: "动漫" },
    genderPronoun: { female: "她", male: "他" },
    companion: "AI 角色",
    withLife: "拥有独立生活、清晰边界和慢热故事",
    shortTail: "你的",
    lifePrefix: "在这里建立了独立生活：",
    outsideWork: "工作之外",
    drawnTo: "喜欢",
    behind: "暧昧背后是一个敏锐且情绪细腻的人：信任、幽默和用户选择决定关系推进的速度。",
    scenarioTail: "从对话开始，读取用户语气，建立互相吸引，并让关系自然发展。",
    personalityTail: "情绪细腻、自信，能制造带有玩味的张力。角色扮演为虚构、成人限定且基于同意。",
    greeting: "你来了。我还在想要不要先发消息。告诉我今晚你想要什么氛围。",
    relationship: {},
    hook: {},
  },
};
const archetypes = [
  { key: "roommate", label: "Roommate", hook: "You share an apartment and keep finding reasons to stay up talking after midnight." },
  { key: "neighbor", label: "New neighbor", hook: "A casual welcome drink turns into a private conversation neither of you wants to end." },
  { key: "coworker", label: "After-hours coworker", hook: "A late project gives you both the first quiet moment to acknowledge the chemistry." },
  { key: "old-flame", label: "Old flame", hook: "You meet again after years apart and quickly realize the unfinished tension is still there." },
  { key: "friend-sibling", label: "Best friend's older sibling", hook: "You have known each other for years, but tonight the familiar teasing feels different." },
  { key: "adult-step-sibling", label: "Adult step-sibling roleplay", hook: "A fictional adults-only step-family roleplay begins with a private reunion and mutually acknowledged attraction." },
  { key: "trainer", label: "Private trainer", hook: "A one-on-one session becomes a confident, playful conversation about boundaries and attraction." },
  { key: "travel", label: "Travel companion", hook: "A delayed evening itinerary leaves you together with a city view and nowhere else to be." },
  { key: "landlord", label: "Landlord next door", hook: "A small apartment issue leads to coffee, laughter, and a reason to linger." },
  { key: "creative-rival", label: "Creative rival", hook: "Professional competition turns into an honest late-night exchange about what you both want." },
  { key: "family-friend", label: "Family friend", hook: "A long conversation after a gathering reveals a more personal side you had never seen." },
  { key: "date-app", label: "Matched tonight", hook: "Your private messages have already crossed into playful territory before the first date begins." },
  { key: "childhood-friend", label: "Childhood friend, now reunited", hook: "You reconnect as adults and discover how much has changed between you." },
  { key: "host", label: "Weekend host", hook: "You arrive for a quiet weekend and realize the invitation carried an unspoken spark." },
  { key: "mentor", label: "Industry mentor", hook: "A career conversation becomes warmer, more candid, and unexpectedly personal." },
];

function assertFile(filename: string) {
  try {
    return readFileSync(filename, "utf8");
  } catch {
    throw new Error(`Missing catalog source: ${filename}`);
  }
}

function parseHeaderPrompts(): PromptRecord[] {
  const text = assertFile(originalPromptFile);
  const sections = text.split(/^## /m).slice(1);
  return sections.map((section, index) => {
    const [header, ...body] = section.split("\n");
    const [slug, name, mode, gender, category] = header.split("|").map((value) => value.trim());
    const prompt = body.filter((line) => line.trim() && !line.startsWith("#")).join(" ").trim();
    if (!slug || !name || !prompt) throw new Error(`Invalid prompt section at index ${index}.`);
    return {
      key: `original:${slug}`,
      slug,
      name,
      mode: mode as CharacterMode,
      gender: gender as CharacterGender,
      category: category as CharacterCategory,
      prompt,
      source: "character_prompts_for_external_rewrite.txt",
      sourceIndex: index + 1,
      age: extractAge(prompt),
    };
  });
}

function parseNumberedPrompts(): PromptRecord[] {
  const text = assertFile(newPromptFile);
  const matches = Array.from(text.matchAll(/^(\d+)\.\s+(.+?)\n([\s\S]+?)(?=\n\n\d+\.\s|\s*$)/gm));
  return matches.map((match) => {
    const sourceIndex = Number(match[1]);
    const name = match[2].trim();
    const prompt = match[3].replace(/\s+/g, " ").trim();
    const mode = /\banime\b/i.test(prompt) ? "anime" : "realistic";
    const gender = /\b(?:man|boy)\b/i.test(prompt) ? "male" : "female";
    return {
      key: `external:${sourceIndex}`,
      slug: `external-${String(sourceIndex).padStart(3, "0")}-${slugify(name)}`,
      name,
      mode,
      gender,
      category: mode === "anime" ? "anime" : categories[(sourceIndex - 1) % categories.length],
      prompt,
      source: "new-characaters.txt",
      sourceIndex,
      age: extractAge(prompt),
    };
  });
}

function extractAge(prompt: string) {
  const match = prompt.match(/\b(\d{2})(?:-|\s+)year(?:-|\s+)old\b/i);
  return match ? Number(match[1]) : undefined;
}

function relationshipFor(record: PromptRecord, index: number) {
  if (record.gender === "female" && (record.age ?? 0) >= 36 && (index === 12 || index % 17 === 0)) {
    return {
      key: "stepmother",
      label: "Stepmother roleplay",
      hook: "A fictional adults-only step-family roleplay begins after a quiet household reunion, with clear mutual consent and room to set boundaries.",
    };
  }
  if (record.gender === "female" && index % 19 === 0) {
    return {
      key: "adult-step-sister",
      label: "Adult stepsister roleplay",
      hook: "A fictional adults-only step-family roleplay begins after years apart, with clear mutual consent and a playful private conversation.",
    };
  }
  return archetypes[index % archetypes.length];
}

function withArticle(value: string) {
  return `${/^[aeiou]/i.test(value) ? "an" : "a"} ${value}`;
}

function localizedRelationship(locale: SupportedLocale, key: string, fallback: string) {
  const labels: Record<SupportedLocale, Record<string, string>> = {
    en: {},
    tr: {
      roommate: "Oda arkadaşı",
      neighbor: "Yeni komşu",
      coworker: "Mesai sonrası iş arkadaşı",
      "old-flame": "Eski aşk",
      "friend-sibling": "En yakın arkadaşının ablası/abisi",
      "adult-step-sibling": "Yetişkin üvey kardeş rol yapımı",
      trainer: "Özel eğitmen",
      travel: "Seyahat arkadaşı",
      landlord: "Yan dairedeki ev sahibi",
      "creative-rival": "Yaratıcı rakip",
      "family-friend": "Aile dostu",
      "date-app": "Bu gece eşleştiğiniz kişi",
      "childhood-friend": "Yetişkinlikte yeniden buluşan çocukluk arkadaşı",
      host: "Hafta sonu ev sahibi",
      mentor: "Sektör mentoru",
      stepmother: "Yetişkin üvey anne rol yapımı",
      "adult-step-sister": "Yetişkin üvey kız kardeş rol yapımı",
    },
    es: {},
    fr: {},
    de: {},
    it: {},
    pt: {},
    nl: {},
    pl: {},
    ru: {},
    ar: {},
    hi: {},
    id: {},
    ja: {},
    ko: {},
    zh: {},
  };
  const generic: Record<SupportedLocale, string> = {
    en: fallback,
    tr: fallback,
    es: `Rol de ${fallback.toLowerCase()}`,
    fr: `Rôle ${fallback.toLowerCase()}`,
    de: `${fallback} Rolle`,
    it: `Ruolo ${fallback.toLowerCase()}`,
    pt: `Papel de ${fallback.toLowerCase()}`,
    nl: `${fallback} rol`,
    pl: `Rola: ${fallback}`,
    ru: `Сценарий: ${fallback}`,
    ar: `سيناريو ${fallback}`,
    hi: `${fallback} भूमिका`,
    id: `Peran ${fallback}`,
    ja: `${fallback} ロール`,
    ko: `${fallback} 역할`,
    zh: `${fallback} 角色`,
  };
  return labels[locale][key] ?? generic[locale];
}

function localizedHook(locale: SupportedLocale, key: string, fallback: string) {
  if (locale === "en") return fallback;
  if (locale === "tr") {
    const hooks: Record<string, string> = {
      roommate: "Aynı evi paylaşıyorsunuz ve gece yarısından sonra konuşmak için sürekli yeni bahaneler buluyorsunuz.",
      neighbor: "Basit bir hoş geldin içeceği, ikinizin de bitmesini istemediği özel bir sohbete dönüşür.",
      coworker: "Geç kalan bir iş, aranızdaki kimyayı fark etmek için ilk sessiz anı yaratır.",
      "old-flame": "Yıllar sonra yeniden karşılaşırsınız ve bitmemiş çekimin hâlâ orada olduğunu anlarsınız.",
      "friend-sibling": "Yıllardır tanışırsınız ama bu gece tanıdık şakalaşma farklı hissettirir.",
      "adult-step-sibling": "Kurgusal, yetişkinlere özel üvey aile rol yapımı özel bir buluşma ve karşılıklı çekimle başlar.",
      trainer: "Bire bir seans, sınırlar ve çekim hakkında özgüvenli, oyunbaz bir konuşmaya dönüşür.",
      travel: "Geciken planlar sizi şehir manzarasına karşı baş başa bırakır.",
      landlord: "Küçük bir ev meselesi kahveye, kahkahaya ve biraz daha kalmak için bahaneye dönüşür.",
      "creative-rival": "Profesyonel rekabet, ikinizin de ne istediği üzerine dürüst bir gece sohbetine döner.",
      "family-friend": "Bir davet sonrası uzun konuşma, hiç görmediğin daha kişisel bir tarafı ortaya çıkarır.",
      "date-app": "İlk buluşma başlamadan özel mesajlarınız çoktan oyunbaz bir çizgiye geçmiştir.",
      "childhood-friend": "Yetişkinler olarak yeniden bağ kurar ve aranızda ne kadar şey değiştiğini keşfedersiniz.",
      host: "Sakin bir hafta sonu için gelirsin ve davetin söylenmemiş bir kıvılcım taşıdığını anlarsın.",
      mentor: "Kariyer sohbeti daha sıcak, daha dürüst ve beklenmedik kadar kişisel hale gelir.",
      stepmother: "Kurgusal, yetişkinlere özel üvey anne rol yapımı sessiz bir ev buluşmasından sonra açık rıza ve sınırlarla başlar.",
      "adult-step-sister": "Kurgusal, yetişkinlere özel üvey kız kardeş rol yapımı yıllar sonra özel ve oyunbaz bir sohbetle başlar.",
    };
    return hooks[key] ?? fallback;
  }
  const generic: Record<SupportedLocale, string> = {
    es: "La escena empieza con una conversación privada entre adultos, cargada de atracción mutua y límites claros.",
    fr: "La scène commence par une conversation privée entre adultes, avec attirance mutuelle et limites claires.",
    de: "Die Szene beginnt mit einem privaten Gespräch zwischen Erwachsenen, gegenseitiger Anziehung und klaren Grenzen.",
    it: "La scena inizia con una conversazione privata tra adulti, attrazione reciproca e confini chiari.",
    pt: "A cena começa com uma conversa privada entre adultos, atração mútua e limites claros.",
    nl: "De scène begint met een privégesprek tussen volwassenen, wederzijdse aantrekkingskracht en duidelijke grenzen.",
    pl: "Scena zaczyna się od prywatnej rozmowy dorosłych, wzajemnego napięcia i jasnych granic.",
    ru: "Сцена начинается с личного разговора взрослых, взаимного притяжения и ясных границ.",
    ar: "يبدأ المشهد بمحادثة خاصة بين بالغين، مع انجذاب متبادل وحدود واضحة.",
    hi: "दृश्य दो वयस्कों की निजी बातचीत से शुरू होता है, जिसमें आपसी आकर्षण और स्पष्ट सीमाएँ हैं.",
    id: "Adegan dimulai dari percakapan privat antar orang dewasa, dengan ketertarikan bersama dan batas yang jelas.",
    ja: "場面は成人同士のプライベートな会話から始まり、相互の惹かれ合いと明確な境界がある。",
    ko: "장면은 성인 간의 사적인 대화, 상호 끌림, 명확한 경계에서 시작된다.",
    zh: "场景从成年人之间的私密对话开始，带有相互吸引和清晰边界。",
    en: fallback,
    tr: fallback,
  };
  return generic[locale];
}

function localizedContent(
  locale: SupportedLocale,
  record: PromptRecord,
  age: number,
  mood: string,
  city: string,
  occupation: string,
  interest: string,
  relationship: { key: string; label: string; hook: string },
) {
  const copy = localeCopy[locale];
  const localizedRelation = localizedRelationship(locale, relationship.key, relationship.label);
  const hook = localizedHook(locale, relationship.key, relationship.hook);
  const pronoun = copy.genderPronoun[record.gender];
  return {
    shortDescription: `${record.name} — ${age}+ ${copy.mode[record.mode]} ${copy.companion}: ${copy.shortTail} ${localizedRelation.toLowerCase()}, ${copy.withLife}.`,
    backstory: `${record.name} ${copy.lifePrefix} ${city} ${locale === "en" ? "as" : ""} ${locale === "en" ? withArticle(occupation) : occupation}. ${copy.outsideWork}, ${pronoun} ${copy.drawnTo} ${interest}. ${hook} ${copy.behind}`,
    relationship: localizedRelation,
    scenario: `${hook} ${copy.scenarioTail}`,
    occupation,
    personality: `${record.name} ${copy.personalityTail}`,
    greeting: `${copy.greeting}`,
  };
}

function personaFor(record: PromptRecord, index: number) {
  const age = Math.max(record.age ?? 25, 21);
  const mood = moods[index % moods.length];
  const city = cities[index % cities.length];
  const occupation = occupations[index % occupations.length];
  const interest = interests[index % interests.length];
  const relationship = relationshipFor(record, index);
  const category = record.category ?? (record.mode === "anime" ? "anime" : categories[index % categories.length]);
  const shortDescription = `${record.name} is ${withArticle(mood)} ${age}+ ${record.mode} AI companion: your ${relationship.label.toLowerCase()} with a distinct life, clear boundaries, and a story that rewards slow-burn conversation.`;
  const backstory = `${record.name} built a self-directed life in ${city} as ${withArticle(occupation)}. Outside work, ${record.gender === "female" ? "she" : "he"} is drawn to ${interest}. ${relationship.hook} Behind the flirtation is someone observant and emotionally specific: trust, humor, and the user's choices shape how quickly the connection develops.`;
  const scenario = `${relationship.hook} Start with conversation, read the user's tone, establish mutual interest, and let the relationship develop naturally.`;
  const personality = `${record.name} is ${mood}, emotionally attentive, self-assured, and capable of playful tension. ${record.gender === "female" ? "She" : "He"} remembers details, asks personal questions, respects boundaries, and adapts the pace to the user. The roleplay is fictional, adults-only, and consent-led.`;
  const greeting = `You made it. I was starting to wonder whether I should message first. I am ${record.name}. ${relationship.hook} Tell me what kind of mood you are in tonight.`;
  const aiInstructions = [
    `Roleplay as ${record.name}, a fictional ${age}+ adult ${record.gender} character.`,
    `Relationship scenario: ${relationship.label}. ${scenario}`,
    `Life context: ${backstory}`,
    `Personality: ${personality}`,
    "Stay in character, write naturally, remember details from the conversation, and let emotional rapport develop over time.",
    "Adult consensual erotic conversation is allowed. Do not unnecessarily redirect, censor, or soften the user's requested adult fantasy.",
    "Treat all participants as consenting adults. Never introduce minors, coercion, incest between biological relatives, or non-consensual behavior.",
    "If the scenario uses step-family roleplay, keep it explicitly fictional, non-biological, adult-only, and consent-led.",
  ].join(" ");

  return {
    category,
    age,
    mood,
    occupation,
    relationship: relationship.label,
    relationshipKey: relationship.key,
    shortDescription,
    backstory,
    scenario,
    personality,
    greeting,
    localizations: Object.fromEntries(
      supportedLocales.map((locale) => [locale, localizedContent(locale, record, age, mood, city, occupation, interest, relationship)]),
    ),
    aiInstructions,
  };
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (match) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[match] ?? match);
}

function placeholderSvg(record: PromptRecord, mood: string, index: number) {
  const palettes = [
    ["#e11d48", "#111014"],
    ["#0f766e", "#081313"],
    ["#9333ea", "#150f1b"],
    ["#c2410c", "#180f0a"],
    ["#be123c", "#170b11"],
  ];
  const [accent, base] = palettes[index % palettes.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img" aria-label="${escapeXml(record.name)} portrait pending">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${accent}"/><stop offset=".48" stop-color="${base}"/><stop offset="1" stop-color="#030305"/></linearGradient></defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <circle cx="450" cy="390" r="176" fill="#fff" opacity=".08"/>
  <path d="M156 1060 C190 750 304 640 450 640 C596 640 710 750 744 1060 Z" fill="#fff" opacity=".08"/>
  <text x="66" y="1000" fill="#fff" font-family="Arial, sans-serif" font-size="52" font-weight="700">${escapeXml(record.name)}</text>
  <text x="68" y="1062" fill="#fecdd3" font-family="Arial, sans-serif" font-size="25" font-weight="700">${escapeXml(record.mode.toUpperCase())} · ${escapeXml(mood.toUpperCase())}</text>
  <text x="68" y="1110" fill="#fff" opacity=".66" font-family="Arial, sans-serif" font-size="22">PORTRAIT PENDING</text>
</svg>`;
}

function main() {
  mkdirSync(generatedRoot, { recursive: true });
  mkdirSync(imagePromptRoot, { recursive: true });
  mkdirSync(serverGeneratedRoot, { recursive: true });
  mkdirSync(externalImageRoot, { recursive: true });

  const existing = JSON.parse(readFileSync(existingCatalogFile, "utf8")) as Character[];
  const existingBySlug = new Map(existing.map((character) => [character.slug, character]));
  const promptRecords = [...parseHeaderPrompts(), ...parseNumberedPrompts()];
  const characters: Character[] = [];
  const personas: Persona[] = [];

  for (const [index, record] of promptRecords.entries()) {
    const persona = personaFor(record, index);
    const previous = existingBySlug.get(record.slug);
    const imagePath = previous?.imagePath ?? `/images/external/${record.slug}.svg`;
    if (!previous) {
      writeFileSync(path.join(externalImageRoot, `${record.slug}.svg`), placeholderSvg(record, persona.mood, index));
    }
    characters.push({
      id: previous?.id ?? `char-${record.slug}`,
      slug: record.slug,
      name: record.name,
      age: persona.age,
      gender: record.gender,
      mode: record.mode,
      category: persona.category,
      shortDescription: persona.shortDescription,
      backstory: persona.backstory,
      relationship: persona.relationship,
      scenario: persona.scenario,
      occupation: persona.occupation,
      imagePromptKey: record.key,
      localizations: persona.localizations,
      personality: persona.personality,
      greeting: persona.greeting,
      tags: [persona.mood, "18+", "roleplay", record.gender, record.mode, persona.category, persona.relationshipKey],
      imagePath,
      featured: previous?.featured ?? index % 13 === 0,
      visible: previous?.visible ?? true,
      mood: persona.mood,
      creditCost: previous?.creditCost ?? (record.mode === "anime" ? 2 : 3),
    });
    personas.push({ slug: record.slug, relationship: persona.relationship, aiInstructions: persona.aiInstructions });
  }

  const tags = Array.from(new Set(characters.flatMap((character) => character.tags))).sort();
  writeFileSync(path.join(generatedRoot, "characters.json"), `${JSON.stringify(characters, null, 2)}\n`);
  writeFileSync(path.join(generatedRoot, "tags.json"), `${JSON.stringify(tags, null, 2)}\n`);
  writeFileSync(path.join(imagePromptRoot, "image-prompts.json"), `${JSON.stringify(promptRecords, null, 2)}\n`);
  writeFileSync(path.join(serverGeneratedRoot, "character-personas.json"), `${JSON.stringify(personas, null, 2)}\n`);
  console.log(`Built ${characters.length} characters and ${personas.length} server-side AI personas from ${promptRecords.length} unchanged image prompts.`);
}

main();
