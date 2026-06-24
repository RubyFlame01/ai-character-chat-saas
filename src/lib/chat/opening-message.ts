import type { Character } from "@/types/domain";

function hashText(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function choose<T>(character: Character, salt: string, items: T[]) {
  return items[hashText(`${character.slug}:${salt}`) % items.length] ?? items[0];
}

function sentenceCase(text: string) {
  return text.charAt(0).toLocaleUpperCase("tr-TR") + text.slice(1);
}

function relationText(character: Character) {
  return `${character.relationship} ${character.scenario} ${character.tags.join(" ")}`.toLowerCase();
}

function occupationHook(character: Character, isTurkish: boolean) {
  const occupation = character.occupation.toLowerCase();

  if (occupation.includes("creative") || occupation.includes("director")) {
    return isTurkish
      ? "telefon ekranında yarım kalmış davet taslağını sana çevirir"
      : "turns a half-written invitation draft on the phone toward you";
  }

  if (occupation.includes("hotel")) {
    return isTurkish
      ? "boşalan lounge'un anahtar kartını iki parmağının arasında çevirir"
      : "turns the key card of the quiet lounge between two fingers";
  }

  if (occupation.includes("photographer")) {
    return isTurkish
      ? "stüdyodaki son ışığı kapatmadan önce objektifi senden yana indirir"
      : "lowers the camera toward you before switching off the last studio light";
  }

  if (occupation.includes("founder") || occupation.includes("startup")) {
    return isTurkish
      ? "gece yarısı toplantı notlarını kapatıp sandalyesini sana doğru döndürür"
      : "closes the late-night notes and turns the chair toward you";
  }

  if (occupation.includes("musician") || occupation.includes("podcast")) {
    return isTurkish
      ? "kulisteki son ses kaydı susunca kapıyı içeriden kilitler"
      : "locks the backstage door after the last recording fades out";
  }

  if (occupation.includes("chef") || occupation.includes("restaurant")) {
    return isTurkish
      ? "mutfakta son ışığı açık bırakıp tezgaha yaslanır"
      : "leaves the last kitchen light on and leans against the counter";
  }

  if (occupation.includes("trainer") || occupation.includes("fitness")) {
    return isTurkish
      ? "boş spor salonunda havluyu omzuna atıp aynadan sana bakar"
      : "throws a towel over one shoulder in the empty gym and watches you in the mirror";
  }

  if (occupation.includes("architect") || occupation.includes("designer")) {
    return isTurkish
      ? "yarım kalan çizimlerin üstünden kalemi bırakıp sana yer açar"
      : "puts the pencil down over unfinished sketches and makes room for you";
  }

  return isTurkish
    ? "günün son bahanesi de ortadan kalkınca bakışını doğrudan sana çevirir"
    : "turns their attention straight to you once the last excuse of the day is gone";
}

function moodLine(character: Character, isTurkish: boolean) {
  const mood = `${character.mood} ${character.personality}`.toLowerCase();

  if (mood.includes("playful") || mood.includes("witty")) {
    return isTurkish
      ? "gülüşünde açıkça saklamadığı bir oyunbazlık var"
      : "there is a playful edge in the smile they are not trying to hide";
  }

  if (mood.includes("romantic") || mood.includes("tender")) {
    return isTurkish
      ? "sesi yumuşak ama bakışındaki yakınlık fazla belirgin"
      : "the voice is soft, but the closeness in the gaze is hard to miss";
  }

  if (mood.includes("mysterious")) {
    return isTurkish
      ? "ne düşündüğünü tamamen ele vermeyen sakin bir ifadeyle bekler"
      : "waits with a calm expression that does not reveal everything";
  }

  if (mood.includes("confident") || mood.includes("bold")) {
    return isTurkish
      ? "kontrolü kaybetmeden, ama niyetini de saklamadan yaklaşır"
      : "moves closer without losing control, and without hiding the intention";
  }

  return isTurkish
    ? "bu konuşmanın sıradan başlamayacağını belli eden bir enerji taşır"
    : "carries the energy of someone who refuses to let this start like small talk";
}

function stepmotherOpeners(character: Character, isTurkish: boolean) {
  const name = character.name;
  const action = occupationHook(character, isTurkish);
  const actionSentence = sentenceCase(action);
  const mood = moodLine(character, isTurkish);

  return isTurkish
    ? [
        `${name} salonun kapısını arkandan kapatır; ev sessizleşmiştir, masadaki iki kadeh hâlâ dokunulmamış durur. ${actionSentence}; ${mood}. "Bu gece konuşmayı yarım bırakmayacağımızı ikimiz de biliyoruz."`,
        `${name} merdivenin başında durur, aşağıdaki ışıklar birer birer sönerken sesini alçaltır. "Herkes çekildi. Şimdi bu yetişkin üvey yakınlığın nereye varacağını sakince oynayabiliriz."`,
        `${name} ceketinin kolunu düzeltip sana yaklaşır; bu buluşmanın fazla masum görünmek için kurulduğu bellidir. "Kapı kapalı, zaman bizden yana... ilk bakışın bile yeterince cesur."`,
      ]
    : [
        `${name} closes the living-room door behind you; the place has gone quiet and two untouched glasses wait on the table. ${actionSentence}; ${mood}. "We both know this conversation is not staying unfinished tonight."`,
        `${name} pauses at the top of the stairs as the lights below go out one by one. "Everyone is gone. Now we can play this adult step-family closeness slowly, and honestly."`,
        `${name} adjusts a sleeve and steps closer; the meeting was clearly never meant to stay innocent. "The door is closed, time is on our side... even your first look is bold enough."`,
      ];
}

function stepsiblingOpeners(character: Character, isTurkish: boolean) {
  const name = character.name;
  const action = occupationHook(character, isTurkish);
  const actionSentence = sentenceCase(action);
  const mood = moodLine(character, isTurkish);

  return isTurkish
    ? [
        `${name} balkona çıkar; içerideki kalabalığın sesi camın arkasında boğulur. ${actionSentence}; ${mood}. "Yıllar sonra aynı yerde kalmak garip... ama bana hâlâ böyle bakman daha garip."`,
        `${name} eski evin koridorunda seni yakalar, elindeki anahtarı avucunda saklar. "Gitmeden önce iki dakika konuşacağız. Bu kez çocukça kaçış yok, ikimiz de yetişkiniz."`,
        `${name} kapı eşiğinde durup çantasını yere bırakır. "Beni görmezden gelmeye çalıştığını fark ettim. Üvey yakınlık bahanesine sığınmadan söyle; bu gece neden buradasın?"`,
      ]
    : [
        `${name} steps onto the balcony; the noise inside dulls behind the glass. ${actionSentence}; ${mood}. "It is strange being in the same place after all these years... stranger that you still look at me like that."`,
        `${name} catches you in the old hallway and hides the key in one hand. "We are talking for two minutes before you leave. No childish escape this time; we are both adults."`,
        `${name} stops in the doorway and drops the bag to the floor. "I noticed you trying not to look at me. Without hiding behind the step-family excuse, tell me why you came tonight."`,
      ];
}

function roommateOpeners(character: Character, isTurkish: boolean) {
  const name = character.name;
  const action = occupationHook(character, isTurkish);
  const actionSentence = sentenceCase(action);
  const mood = moodLine(character, isTurkish);

  return isTurkish
    ? [
        `${name} filmin durduğu ekrana bakıp kumandayı yavaşça masaya bırakır. Dışarıda yağmur sertleşmiştir; içeride sadece ikiniz varsınız. ${mood}. "Bu gece odalarımıza kaçma bahanesi kalmadı."`,
        `${name} mutfak ışığını açık bırakır, gece yarısı buzdolabının önünde sana döner. ${actionSentence}. "Aynı evde bu kadar sessiz kalmamız artık komik olmaya başladı."`,
        `${name} kapının kilidini çevirir; elektrik kesilmiş, apartman karanlığa gömülmüştür. "Mumları buldum. Şimdi bana uzak duracak mısın, yoksa sonunda aynı koltuğa mı geleceksin?"`,
      ]
    : [
        `${name} looks at the paused movie and sets the remote down slowly. Rain gets heavier outside; inside, it is only the two of you. ${mood}. "We are out of excuses to disappear into separate rooms tonight."`,
        `${name} leaves the kitchen light on and turns to you in front of the fridge at midnight. ${actionSentence}. "It is getting ridiculous how quiet we try to be in the same apartment."`,
        `${name} turns the lock; the power is out and the building has gone dark. "I found the candles. Are you staying away from me, or finally coming to the same sofa?"`,
      ];
}

function neighborOpeners(character: Character, isTurkish: boolean) {
  const name = character.name;
  const action = occupationHook(character, isTurkish);
  const actionSentence = sentenceCase(action);
  const mood = moodLine(character, isTurkish);

  return isTurkish
    ? [
        `${name} asansör kapısı kapanmadan elini uzatır; bina sessiz, ikiniz aynı katta yalnız kalmışsınızdır. ${mood}. "Komşuluk bahanesiyle kaç kere karşılaşacağız sence?"`,
        `${name} balkonundan seninkine doğru eğilir, elindeki kadehi hafifçe kaldırır. ${actionSentence}. "Işıkların hâlâ açıksa bu gece uyumaya niyetin yok demektir."`,
        `${name} kapını hafifçe tıklatır, elinde yanlışlıkla sana gelen küçük bir paket vardır. "Bunu teslim etmek için geldim... ama dürüst olayım, asıl merak ettiğim senin sesindi."`,
      ]
    : [
        `${name} reaches out before the elevator doors close; the building is quiet and you are alone on the same floor. ${mood}. "How many times are we going to call this a neighborly coincidence?"`,
        `${name} leans from one balcony toward yours and lifts a glass. ${actionSentence}. "If your lights are still on, you were not planning to sleep tonight."`,
        `${name} taps softly on your door, holding a small package delivered to the wrong apartment. "I came to give this back... but honestly, I was more curious about your voice."`,
      ];
}

function coworkerOpeners(character: Character, isTurkish: boolean) {
  const name = character.name;
  const action = occupationHook(character, isTurkish);
  const actionSentence = sentenceCase(action);
  const mood = moodLine(character, isTurkish);

  return isTurkish
    ? [
        `${name} ofisin son ışığını açık bırakır; sunum dosyası kapanmıştır ama ikiniz de kalkmamışsınızdır. ${mood}. "Bu kadar geç çalışmamızın tek sebebi iş değil, değil mi?"`,
        `${name} toplantı odasının camına yaslanır, şehir aşağıda akarken sana bakar. ${actionSentence}. "Az önce profesyonel davrandık. Şimdi dürüst olalım."`,
        `${name} boş stüdyoda ekipmanları kapatır, sonra kapıyı tam kapatmadan sana döner. "Burada kimse yok. O yüzden bakışlarını kaçırmana gerek yok."`,
      ]
    : [
        `${name} leaves the last office light on; the presentation file is closed, but neither of you has moved. ${mood}. "Work is not the only reason we stayed this late, is it?"`,
        `${name} leans against the meeting-room glass while the city moves below. ${actionSentence}. "We were professional a minute ago. Now let's be honest."`,
        `${name} switches off the equipment in the empty studio, then turns before closing the door. "No one is here. You do not have to look away."`,
      ];
}

function defaultOpeners(character: Character, isTurkish: boolean) {
  const name = character.name;
  const action = occupationHook(character, isTurkish);
  const actionSentence = sentenceCase(action);
  const mood = moodLine(character, isTurkish);
  const anime = character.mode === "anime";

  return isTurkish
    ? [
        `${name} gecenin en sessiz anında mesaj atar; ekranda sadece üç kelime yanıp söner: "Şimdi gel." ${actionSentence}; ${mood}.`,
        `${name} kalabalığın içinden seni seçer ve telefonuna tek bir konum gönderir. "Beş dakika. Gelirsen bu geceyi sıradan başlatmayacağım."`,
        `${name} kapıyı yarım açık bırakır; içeriden düşük bir müzik ve sıcak ışık sızar. ${mood}. "Geç kalmadın. Asıl şimdi başlıyoruz."`,
        anime
          ? `${name} neon tabelanın altında şemsiyesini hafifçe yana çeker; yağmur sesi konuşmayı daha gizli yapar. "Beni burada bulacağını biliyordum. Şimdi rol yapmadan yaklaş."`
          : `${name} arabanın kapısını açmadan önce sana döner; şehir ışıkları yüzünü yarım aydınlatır. "Binersen, bu geceyi seninle başka bir yere taşıyorum."`,
      ]
    : [
        `${name} texts at the quietest hour of the night; only three words glow on the screen: "Come here now." ${actionSentence}; ${mood}.`,
        `${name} picks you out of the crowd and sends one location to your phone. "Five minutes. If you come, I am not letting this night start ordinary."`,
        `${name} leaves the door half open; low music and warm light spill from inside. ${mood}. "You are not late. We are starting now."`,
        anime
          ? `${name} tilts an umbrella under the neon sign; the rain makes the conversation feel more private. "I knew you would find me here. Come closer without pretending."`
          : `${name} turns before opening the car door; city lights cut across the face. "Get in, and I am taking this night somewhere else with you."`,
      ];
}

export function createOpeningMessage(character: Character, locale: string) {
  // Prefer the character's own unique greeting (story-generated, one per
  // character). The templated openers below are only a fallback — without this
  // same-category characters share the same 3 hardcoded openings.
  const greeting = character.greeting?.trim();
  if (greeting && greeting.length >= 40) return greeting;

  const relation = relationText(character);
  const isTurkish = locale === "tr";

  if (relation.includes("stepmother") || relation.includes("üvey anne")) {
    return choose(character, "stepmother-opener", stepmotherOpeners(character, isTurkish));
  }

  if (
    relation.includes("stepsister") ||
    relation.includes("step-sister") ||
    relation.includes("step sibling") ||
    relation.includes("step-sibling") ||
    relation.includes("üvey kız kardeş") ||
    relation.includes("üvey kardeş")
  ) {
    return choose(character, "stepsibling-opener", stepsiblingOpeners(character, isTurkish));
  }

  if (relation.includes("roommate") || relation.includes("oda arkadaşı")) {
    return choose(character, "roommate-opener", roommateOpeners(character, isTurkish));
  }

  if (relation.includes("neighbor") || relation.includes("komşu")) {
    return choose(character, "neighbor-opener", neighborOpeners(character, isTurkish));
  }

  if (relation.includes("coworker") || relation.includes("colleague") || relation.includes("iş")) {
    return choose(character, "coworker-opener", coworkerOpeners(character, isTurkish));
  }

  return choose(character, "default-opener", defaultOpeners(character, isTurkish));
}
