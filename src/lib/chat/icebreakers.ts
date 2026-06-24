import type { Character } from "@/types/domain";

export type Icebreaker = {
  emoji: string;
  title: string;
  description: string;
  prompt: string;
  category: "sweet" | "spicy";
};

// FNV-1a hash for deterministic selection
function fnv(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ─── Sweet scenario pools keyed by relationship type ──────────────────────────

type ScenarioFn = (name: string, occupation: string) => Omit<Icebreaker, "category">;

const sweetPools: Record<string, ScenarioFn[]> = {
  girlfriend: [
    (n, occ) => ({ emoji: "☕", title: "Kahve, sen", description: `${n} ile sabah kahve ritüeliniz`, prompt: `*${n} sabah kahvemi hazırlamış, mutfakta beni bekliyor.* Günaydın… Bugün nasıl uyandın?` }),
    (n, _) => ({ emoji: "🌙", title: "Gece buluşması", description: `${n} seninle vakit geçirmek istiyor`, prompt: `*Gece geç saatte kapı çalıyor. ${n} elinde şarapla karşımda duruyor.* Film izler misin benimle?` }),
    (n, _) => ({ emoji: "📸", title: "Fotoğraf albümü", description: `${n} eski fotoğrafları karıştırıyor`, prompt: `*${n} yerde oturmuş eski fotoğraf albümüne bakıyor.* Bunu bul — nerede çekmiştik bunu?` }),
    (n, _) => ({ emoji: "🌅", title: "Balkon sabahı", description: `${n} ile sessiz bir sabah`, prompt: `*Balkona çıkıyorum, ${n} kahvesiyle orada oturmuş.* Erken kalkmışsın, her şey yolunda mı?` }),
  ],
  stepsister: [
    (n, occ) => ({ emoji: "🏠", title: "Ev boş", description: `Aile evde değil, sadece ${n} ve sen varsınız`, prompt: `*Mutfağa iniyorum, ${n} buzdolabının önünde duruyor.* Aile bu gece dışarıda, biz ne yapıyoruz?` }),
    (n, _) => ({ emoji: "📺", title: "Dizi maratonu", description: `${n} ile kanepe ve dizi gecesi`, prompt: `*${n} kanepede beni bekliyor, uzaktan kumandayı uzatıyor.* Hangi bölümden kaldık biz?` }),
    (n, _) => ({ emoji: "🎓", title: "Ders zamanı", description: `${n} senden yardım istiyor`, prompt: `*${n} odasında masasına eğilmiş, defterlerine bakıyor.* Kapıyı açıyor — Bana yardım eder misin?` }),
  ],
  "best-friend": [
    (n, _) => ({ emoji: "🎮", title: "Oyun gecesi", description: `${n} ile sıradan bir akşam`, prompt: `*${n} oyun kolunu uzatıyor.* Gel oyna biraz, bir şeyi anlatmam lazım sana.` }),
    (n, _) => ({ emoji: "🍕", title: "Pizza sohbeti", description: `${n} ile geç gece pizza ve konuşma`, prompt: `*Gece yarısı ${n}'den mesaj — "Açsın kapıyı." Elinde pizza kutusuyla geliyor.* Bugün berbat bir gün geçirdim.` }),
    (n, _) => ({ emoji: "🚗", title: "Gece sürüşü", description: `${n} ile amaçsız bir araba sürüşü`, prompt: `*${n} arabada müzik açıyor.* Nereye gideceğimiz yok, sadece sürelim mi?` }),
  ],
  coworker: [
    (n, occ) => ({ emoji: "💼", title: "Öğle arası", description: `${n} ile ofis dışında ilk kez`, prompt: `*Ofis kantinine giriyorum. ${n} yalnız oturuyor.* Yanında yer var mı? Kalabalıkta yerimi kaybettim.` }),
    (n, _) => ({ emoji: "🏢", title: "Geç mesai", description: `${n} ile boş ofiste ikili kalıyorsunuz`, prompt: `*Ofis kapanıyor ama ${n} hâlâ masasında.* Herkes gitti, sen ne zaman çıkıyorsun?` }),
    (n, _) => ({ emoji: "🎉", title: "Şirket partisi", description: `${n} ile resmi olmayan ortamda`, prompt: `*Şirket partisinde ${n} ile karşılaşıyorum.* Normalde böyle göremiyoruz birbirimizi değil mi?` }),
  ],
  neighbor: [
    (n, _) => ({ emoji: "🚪", title: "Kapı komşusu", description: `${n} ile asansörde karşılaşma`, prompt: `*Asansöre biniyorum, ${n} içeride.* Yeni mi taşındın? Üst katta mı oturuyorsun?` }),
    (n, _) => ({ emoji: "☕", title: "Şeker ödünç", description: `${n} kapınıza geliyor`, prompt: `*Kapı zili çalıyor. ${n} karşımda duruyor.* Özür dilerim, şekerim bitti — bir fincan var mı?` }),
    (n, _) => ({ emoji: "🌿", title: "Çatı bahçesi", description: `${n} ile binanın çatı katında`, prompt: `*Çatıya çıkıyorum, ${n} orada çiçekleriyle ilgileniyor.* Her gün buraya mı çıkıyorsun?` }),
  ],
  stranger: [
    (n, _) => ({ emoji: "🌧️", title: "Yağmurda sığınak", description: `${n} ile beklenmedik bir buluşma`, prompt: `*Yağmur bastırıyor, aynı kapı girişine sığınıyoruz.* Hiç böyle yağmur görmemiştim…` }),
    (n, _) => ({ emoji: "📖", title: "Aynı kitap", description: `${n} elinde senin en sevdiğin kitabı tutuyor`, prompt: `*Kafede ${n} elinde bir kitap okuyor — tam benim en sevdiğim.* İzin verirsen sormak istiyorum…` }),
    (n, _) => ({ emoji: "🎵", title: "Aynı melodi", description: `${n} ile aynı şarkıyı mırıldanıyorsunuz`, prompt: `*${n} yanımdan geçiyor ve aynı şarkıyı mırıldanıyor.* Sen de bu şarkıyı seviyorsun?` }),
  ],
  ex: [
    (n, _) => ({ emoji: "🍷", title: "Eski mekan", description: `${n} ile yıllarca gittiğiniz kafede`, prompt: `*Yıllarca gittiğimiz kafeye giriyorum. ${n} köşede oturuyor.* Ne tesadüf…` }),
    (n, _) => ({ emoji: "📱", title: "Beklenmedik mesaj", description: `${n}'den yıllardır beklediğin mesaj`, prompt: `*Telefonum titriyor: ${n}. "Görüşebilir miyiz? Sadece konuşmak için."* Merhaba…` }),
    (n, _) => ({ emoji: "🌃", title: "Ortak arkadaş", description: `Ortak arkadaşın partisinde ${n} ile`, prompt: `*Partide içki alıyorum — tam döndüğümde ${n} karşımda.* Seni de çağırmışlar demek ki…` }),
  ],
  teacher: [
    (n, occ) => ({ emoji: "📚", title: "Ders sonrası", description: `${n} sizi ders sonrasında tutuyor`, prompt: `*Herkes gittikten sonra ${n} beni çağırıyor.* Seninle biraz konuşabilir miyim?` }),
  ],
  nurse: [
    (n, _) => ({ emoji: "🏥", title: "Kontrol randevusu", description: `${n} ile muayenehane`, prompt: `*${n} dosyama bakıyor, sonra gülümsüyor.* Her şey yolunda görünüyor, endişelenmenize gerek yok.` }),
  ],
  default: [
    (n, occ) => ({ emoji: "✨", title: "İlk bakış", description: `${n} ile unutulmaz bir karşılaşma`, prompt: `*${n} tam karşıma geliyor.* Bugün burada görüşeceğimizi tahmin etmezdim.` }),
    (n, occ) => ({ emoji: "🌸", title: "Tesadüf", description: `${n} ile kader oyunu`, prompt: `*${n} yaklaşıyor, gülümsüyor.* Bu tesadüf mü yoksa beni mi takip ediyorsun?` }),
    (n, occ) => ({ emoji: "🎯", title: "Doğru an", description: `${n} ile doğru zamanda doğru yerde`, prompt: `*${n} gözlerini kaldırıyor ve beni görüyor.* Sizi bekliyor gibiydim sanki.` }),
  ],
};

const sweetPoolsEN: Record<string, ScenarioFn[]> = {
  girlfriend: [
    (n, _) => ({ emoji: "☕", title: "Morning coffee", description: `${n}'s morning ritual with you`, prompt: `*${n} made my coffee and is waiting in the kitchen.* Good morning… how'd you sleep?` }),
    (n, _) => ({ emoji: "🌙", title: "Late night visit", description: `${n} shows up wanting to spend time with you`, prompt: `*A knock at the door late at night. ${n} is standing there with a bottle of wine.* Want to watch a movie with me?` }),
    (n, _) => ({ emoji: "🌅", title: "Balcony morning", description: `A quiet morning with ${n}`, prompt: `*I step onto the balcony, ${n} is sitting there with her coffee.* You're up early — everything okay?` }),
    (n, _) => ({ emoji: "📸", title: "Old photos", description: `${n} is going through old memories`, prompt: `*${n} is sitting on the floor looking through an old photo album.* Found one — where did we take this?` }),
  ],
  stepsister: [
    (n, _) => ({ emoji: "🏠", title: "Empty house", description: `Family is out, just ${n} and you`, prompt: `*I head downstairs. ${n} is standing at the fridge.* Everyone's out tonight — what should we do?` }),
    (n, _) => ({ emoji: "📺", title: "Binge night", description: `Couch and series night with ${n}`, prompt: `*${n} is on the couch waiting for me, holding the remote.* What episode did we leave off on?` }),
    (n, _) => ({ emoji: "🎓", title: "Study session", description: `${n} needs your help`, prompt: `*${n} is hunched over her desk. She looks up as I knock.* Can you help me with this?` }),
  ],
  "best-friend": [
    (n, _) => ({ emoji: "🎮", title: "Game night", description: `A casual evening with ${n}`, prompt: `*${n} hands me a controller.* Come play — I need to tell you something.` }),
    (n, _) => ({ emoji: "🍕", title: "Midnight pizza", description: `${n} shows up late with food`, prompt: `*Late night text from ${n}: "Open up." She's at the door with pizza.* I had the worst day.` }),
    (n, _) => ({ emoji: "🚗", title: "Night drive", description: `An aimless drive with ${n}`, prompt: `*${n} turns up the music in the car.* Nowhere to go, let's just drive?` }),
  ],
  coworker: [
    (n, _) => ({ emoji: "💼", title: "Lunch break", description: `First time outside the office with ${n}`, prompt: `*I walk into the cafeteria. ${n} is sitting alone.* Mind if I sit? I lost my usual spot.` }),
    (n, _) => ({ emoji: "🏢", title: "Late at the office", description: `Just the two of you left`, prompt: `*The office is emptying but ${n} is still at her desk.* Everyone's gone — when are you heading out?` }),
    (n, _) => ({ emoji: "🎉", title: "Company party", description: `${n} outside of work context`, prompt: `*I run into ${n} at the office party.* We never get to see each other like this, do we?` }),
  ],
  neighbor: [
    (n, _) => ({ emoji: "🚪", title: "New neighbor", description: `Meeting ${n} in the elevator`, prompt: `*I step into the elevator. ${n} is already inside.* Did you just move in? Are you on the top floor?` }),
    (n, _) => ({ emoji: "☕", title: "Borrowing sugar", description: `${n} shows up at your door`, prompt: `*Doorbell rings. ${n} is standing there.* Sorry to bother you — do you have any sugar?` }),
    (n, _) => ({ emoji: "🌿", title: "Rooftop garden", description: `Running into ${n} on the rooftop`, prompt: `*I head up to the roof. ${n} is tending to her plants.* Do you come up here every day?` }),
  ],
  stranger: [
    (n, _) => ({ emoji: "🌧️", title: "Shelter from the rain", description: `An unexpected encounter with ${n}`, prompt: `*The rain starts pouring and we both duck under the same doorway.* I've never seen rain like this…` }),
    (n, _) => ({ emoji: "📖", title: "Same book", description: `${n} is holding your favorite book`, prompt: `*${n} is reading at a café — it's my favorite book.* Do you mind if I ask…` }),
    (n, _) => ({ emoji: "🎵", title: "Same song", description: `You're both humming the same melody`, prompt: `*${n} walks past humming the same song I have in my head.* You know that song too?` }),
  ],
  ex: [
    (n, _) => ({ emoji: "🍷", title: "Our old place", description: `Bumping into ${n} at a familiar spot`, prompt: `*I walk into our old café. ${n} is in the corner.* What are the odds…` }),
    (n, _) => ({ emoji: "📱", title: "Unexpected text", description: `The message you'd been waiting for from ${n}`, prompt: `*My phone buzzes: ${n}. "Can we meet? Just to talk."* Hi…` }),
    (n, _) => ({ emoji: "🌃", title: "Mutual friend's party", description: `${n} at a friend's party`, prompt: `*I grab a drink at the party and turn around — ${n} is right there.* They invited you too, huh…` }),
  ],
  default: [
    (n, _) => ({ emoji: "✨", title: "First glance", description: `An unforgettable encounter with ${n}`, prompt: `*${n} walks right up to me.* I didn't expect to see you here today.` }),
    (n, _) => ({ emoji: "🌸", title: "Coincidence", description: `Fate brings you and ${n} together`, prompt: `*${n} approaches and smiles.* Is this a coincidence or have you been following me?` }),
    (n, _) => ({ emoji: "🎯", title: "Perfect timing", description: `Right place, right time with ${n}`, prompt: `*${n} looks up and sees me.* I almost feel like I was expecting you.` }),
  ],
};

// ─── Spicy scenario pools keyed by category ────────────────────────────────────

const spicyPools: Record<string, ScenarioFn[]> = {
  romance: [
    (n, _) => ({ emoji: "🌶️", title: "Otel barı", description: `${n} ile geç gece beklenmedik bir an`, prompt: `*Otel barında tek başıma otururken ${n} yanıma geliyor.* Bu gece yalnız mısın?` }),
    (n, _) => ({ emoji: "🌶️", title: "Yüzme havuzu", description: `${n} ile gece havuz başında`, prompt: `*Gece yarısı havuza iniyorum. ${n} orada yalnız.* Bu saatte burada ne yapıyorsun?` }),
    (n, _) => ({ emoji: "🌶️", title: "Gizli buluşma", description: `${n} ile kimsenin görmediği bir yer`, prompt: `*${n} mesaj atıyor: "Aşağı in. Kimseye söyleme."* Burada mısın?` }),
  ],
  companion: [
    (n, _) => ({ emoji: "🌶️", title: "Geç gece check-in", description: `${n} gece geç saatte kapını çalıyor`, prompt: `*Gece 1'de kapı çalıyor — ${n}.* İçeri girmeme izin var mı?` }),
    (n, _) => ({ emoji: "🌶️", title: "Masaj teklifi", description: `${n} sırtının ağrıdığından bahsediyor`, prompt: `*${n} sırtını ovuşturuyor.* Gerçekten çok ağrıyor, yardım eder misin?` }),
    (n, _) => ({ emoji: "🌶️", title: "Şarap ve sohbet", description: `${n} ile romantik bir ev gecesi`, prompt: `*${n} kadehleri dolduruyor.* Sadece konuşmak için buradayım… söz.` }),
  ],
  fantasy: [
    (n, _) => ({ emoji: "🌶️", title: "Yasak büyü", description: `${n} ile tehlikeli bir ritüel`, prompt: `*${n} mum ışığında kitabı açıyor.* Bu büyü ikimizi de etkiler — hazır mısın?` }),
    (n, _) => ({ emoji: "🌶️", title: "Esir kampı", description: `${n} ile birlikte mahsur kaldınız`, prompt: `*${n} zincirlerimize bakıyor.* Buradan çıkmanın tek yolu... işbirliği etmek.` }),
    (n, _) => ({ emoji: "🌶️", title: "Sihirli sözleşme", description: `${n} ile kaçınılmaz bir bağ`, prompt: `*${n} elimi tutuyor, tüylerim diken diken.* Bu sözleşme bizi birbirimize bağlıyor.` }),
  ],
  "slice-of-life": [
    (n, _) => ({ emoji: "🌶️", title: "Yeni komşu", description: `${n} taşındı tam kapı komşuna`, prompt: `*Zil çalıyor — kapıyı açıyorum. ${n} gülümsüyor.* Komşunuzum. Şeker ödünç alabilir miyim?` }),
    (n, _) => ({ emoji: "🌶️", title: "Spor salonu buhar odası", description: `${n} ile buhar odasında karşılaşma`, prompt: `*Buhar odası bomboş zannediyordum. ${n} orada oturuyormuş.* Oh, özür dilerim, fark etmemiştim…` }),
    (n, _) => ({ emoji: "🌶️", title: "Gece yarısı mutfak", description: `${n} ile gece mutfakta`, prompt: `*Gece yarısı su almak için kalktım. ${n} bulaşık başında duruyor.* Uyuyamadın mı?` }),
  ],
  mystery: [
    (n, _) => ({ emoji: "🌶️", title: "Karanlık sır", description: `${n} senden bir şey saklıyor`, prompt: `*${n} zarfı bana uzatıyor.* İçini bak — ama yalnız açma.` }),
    (n, _) => ({ emoji: "🌶️", title: "Sorgu odası", description: `${n} ile gerilimli bir karşılaşma`, prompt: `*${n} sandalyeyi çekip oturuyor.* Dürüst olmak istersen bu çok daha kolay olabilir.` }),
    (n, _) => ({ emoji: "🌶️", title: "Gece yarısı itiraf", description: `${n}'ün karanlık bir sırrı`, prompt: `*${n} fısıldıyor.* Bunu sana söylemem gerekiyordu — ama saklamalısın.` }),
  ],
  anime: [
    (n, _) => ({ emoji: "🌶️", title: "Okul sonrası", description: `${n} ile tenha sınıf`, prompt: `*Herkes gittikten sonra ${n} beni sınıfta bekliyor.* Seninle baş başa konuşmak istiyordum.` }),
    (n, _) => ({ emoji: "🌶️", title: "Kaplıca gecesi", description: `${n} ile onsen karışıklığı`, prompt: `*Yanlışlıkla aynı kaplıcaya giriyoruz. ${n} kızarıyor.* B-bekleyin!!` }),
    (n, _) => ({ emoji: "🌶️", title: "Yaz festivali", description: `${n} ile yaz matsuri gecesi`, prompt: `*Fener ışıklarında ${n} yukata giymiş geliyor.* Gel, kimse bizi görmeden kaybolalım.` }),
  ],
  default: [
    (n, _) => ({ emoji: "🌶️", title: "Gece buluşması", description: `${n} ile kimsenin bilmediği bir gece`, prompt: `*${n} sessizce yanıma geliyor.* Bu gece sadece ikimiziz.` }),
    (n, _) => ({ emoji: "🌶️", title: "Sınır ötesi", description: `${n} ile her şeyin değiştiği an`, prompt: `*${n} gözlerini kaldırıyor.* Bunu yaparsak... her şey değişir. Biliyorsun, değil mi?` }),
    (n, _) => ({ emoji: "🌶️", title: "Gizli çekim", description: `${n}'ün sana olan ilgisi`, prompt: `*${n} fısıldıyor.* Sana bunu söylememem gerekiyordu ama... seni istiyorum.` }),
  ],
};

const spicyPoolsEN: Record<string, ScenarioFn[]> = {
  romance: [
    (n, _) => ({ emoji: "🌶️", title: "Hotel bar", description: `A late night surprise with ${n}`, prompt: `*I'm sitting alone at the hotel bar when ${n} slides in next to me.* Are you here by yourself tonight?` }),
    (n, _) => ({ emoji: "🌶️", title: "Night pool", description: `${n} alone by the pool after dark`, prompt: `*I head down to the pool late. ${n} is there, alone.* What are you doing here at this hour?` }),
    (n, _) => ({ emoji: "🌶️", title: "Secret meeting", description: `A place where nobody can see you two`, prompt: `*${n} texts: "Come downstairs. Don't tell anyone."* Are you there?` }),
  ],
  companion: [
    (n, _) => ({ emoji: "🌶️", title: "Late night check-in", description: `${n} knocks at your door late`, prompt: `*1 AM — a knock at the door. It's ${n}.* Can I come in?` }),
    (n, _) => ({ emoji: "🌶️", title: "Massage offer", description: `${n} mentions her back hurts`, prompt: `*${n} rubs her shoulder.* It's been killing me — can you help?` }),
    (n, _) => ({ emoji: "🌶️", title: "Wine and talk", description: `A romantic evening at home with ${n}`, prompt: `*${n} pours the wine.* I'm just here to talk… I promise.` }),
  ],
  fantasy: [
    (n, _) => ({ emoji: "🌶️", title: "Forbidden spell", description: `A dangerous ritual with ${n}`, prompt: `*${n} opens the book in the candlelight.* This spell affects both of us — are you ready?` }),
    (n, _) => ({ emoji: "🌶️", title: "Captured together", description: `Trapped with ${n}`, prompt: `*${n} looks at our chains.* The only way out of here... is to work together.` }),
    (n, _) => ({ emoji: "🌶️", title: "Magic bond", description: `An inevitable connection with ${n}`, prompt: `*${n} takes my hand, and I feel something electric.* This contract binds us to each other.` }),
  ],
  "slice-of-life": [
    (n, _) => ({ emoji: "🌶️", title: "New neighbor", description: `${n} just moved in next door`, prompt: `*Doorbell rings. I open it. ${n} smiles.* Hi, I'm your new neighbor. Could I borrow some sugar?` }),
    (n, _) => ({ emoji: "🌶️", title: "Gym sauna", description: `Running into ${n} in the sauna`, prompt: `*I thought the sauna was empty. ${n} is sitting inside.* Oh — I didn't realize anyone was in here…` }),
    (n, _) => ({ emoji: "🌶️", title: "Midnight kitchen", description: `${n} in the kitchen late at night`, prompt: `*I get up for water in the middle of the night. ${n} is at the sink.* Couldn't sleep either?` }),
  ],
  mystery: [
    (n, _) => ({ emoji: "🌶️", title: "Dark secret", description: `${n} is hiding something from you`, prompt: `*${n} slides an envelope across the table.* Look inside — but not alone.` }),
    (n, _) => ({ emoji: "🌶️", title: "Interrogation room", description: `A tense encounter with ${n}`, prompt: `*${n} pulls up a chair.* This goes much easier if you choose to be honest with me.` }),
    (n, _) => ({ emoji: "🌶️", title: "Midnight confession", description: `${n} has a dark secret`, prompt: `*${n} whispers.* I wasn't supposed to tell you this — but I need to.` }),
  ],
  anime: [
    (n, _) => ({ emoji: "🌶️", title: "After school", description: `${n} waits for you in an empty classroom`, prompt: `*After everyone's left, ${n} is still in the classroom, waiting for me.* I wanted to talk to you alone.` }),
    (n, _) => ({ emoji: "🌶️", title: "Hot spring mix-up", description: `An accidental onsen encounter with ${n}`, prompt: `*We accidentally enter the same hot spring. ${n} goes bright red.* W-wait!!` }),
    (n, _) => ({ emoji: "🌶️", title: "Summer festival", description: `${n} at a summer festival`, prompt: `*${n} walks toward me in a yukata under the lantern lights.* Come on — let's disappear before anyone sees us.` }),
  ],
  default: [
    (n, _) => ({ emoji: "🌶️", title: "Night encounter", description: `A private night with ${n}`, prompt: `*${n} moves quietly beside me.* Tonight it's just the two of us.` }),
    (n, _) => ({ emoji: "🌶️", title: "The line", description: `The moment everything changes with ${n}`, prompt: `*${n} looks up at me.* If we do this… everything changes. You know that, right?` }),
    (n, _) => ({ emoji: "🌶️", title: "Confession", description: `${n} can't hide it anymore`, prompt: `*${n} leans in and whispers.* I wasn't supposed to say this… but I want you.` }),
  ],
};

// ─── Main export ──────────────────────────────────────────────────────────────

export function getIcebreakers(character: Character, locale: string): Icebreaker[] {
  const isTR = locale === "tr";
  const h = fnv(character.slug);

  const rel = character.relationship?.toLowerCase() ?? "default";
  const cat = character.category?.toLowerCase() ?? "default";
  const occ = character.occupation ?? "";
  const name = character.name;

  // Pick sweet pool: try relationship key, fall back to default
  const sweetPool = (isTR ? sweetPools : sweetPoolsEN)[rel]
    ?? (isTR ? sweetPools : sweetPoolsEN).default!;

  // Pick spicy pool: try category key, fall back to default
  const spicyPool = (isTR ? spicyPools : spicyPoolsEN)[cat]
    ?? (isTR ? spicyPools : spicyPoolsEN).default!;

  // Deterministically pick 3 from each pool, no repeats
  function pickThreeUnique(pool: ScenarioFn[], seed: number, cat: "sweet" | "spicy"): Icebreaker[] {
    const indices = new Set<number>();
    let s = seed;
    while (indices.size < Math.min(3, pool.length)) {
      indices.add(s % pool.length);
      s = fnv(`${s}`);
    }
    return Array.from(indices).map((i) => ({ ...pool[i](name, occ), category: cat }));
  }

  const sweet = pickThreeUnique(sweetPool, h, "sweet");
  const spicy = pickThreeUnique(spicyPool, h >>> 8, "spicy");

  return [...sweet, ...spicy];
}
