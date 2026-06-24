import Image from "next/image";
import Link from "next/link";
import { CreditCard, Crown, Gift, MessageCircle, Plus, Sparkles, Zap } from "lucide-react";
import { getDictionary, getLocale } from "@/lib/i18n";
import { pricingPlans } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/server/auth";
import { getUserCharacters, getUserConversationList } from "@/lib/server/conversations";
import { hasSupabaseAdminEnv } from "@/lib/config";
import { cn } from "@/lib/utils";
import { ReferralBox } from "@/components/dashboard/referral-box";

const TIER_COLORS: Record<string, string> = {
  free: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  silver: "border-blue-400/30 bg-blue-400/10 text-blue-200",
  gold: "border-yellow-400/30 bg-yellow-400/10 text-yellow-200",
  platinum: "border-violet-400/30 bg-violet-400/10 text-violet-200",
};

const TIER_MONTHLY: Record<string, number> = {
  free: 100,
  silver: 2500,
  gold: 7500,
  platinum: 18000,
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string; plan?: string; credits?: string }>;
}) {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const params = searchParams ? await searchParams : {};
  const selectedPlan = pricingPlans.find((plan) => plan.id === params.plan);
  const checkoutSuccess = params.checkout === "mock-success";

  const tier = user?.subscriptionTier ?? "free";
  const tierLabel = user?.entitlements.label ?? "Free";
  const monthlyMax = TIER_MONTHLY[tier] ?? 100;
  const credits = user?.credits ?? 0;
  const creditsUsedPct = Math.max(0, Math.min(100, Math.round(((monthlyMax - credits) / monthlyMax) * 100)));

  const modelAccess = user?.entitlements.canUsePremiumModel
    ? "Standard + Premium AI"
    : user?.entitlements.canUseStandardModel
      ? "Standard Uncensored"
      : "Free Chatbot";

  const renewalLabel = user?.subscriptionRenewsAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(user.subscriptionRenewsAt))
    : null;

  const [myCharacters, recentConversations] = await Promise.all([
    user && user.id !== "demo-user" && hasSupabaseAdminEnv()
      ? getUserCharacters(user.id)
      : Promise.resolve([]),
    user && user.id !== "demo-user" && hasSupabaseAdminEnv()
      ? getUserConversationList(user.id)
      : Promise.resolve([]),
  ]);

  return (
    <div className="cinematic-bg min-h-screen">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {checkoutSuccess && (
          <div className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3.5 text-sm font-semibold text-emerald-100">
            ✓ {selectedPlan?.name ?? "Plan"} activated — {Number(params.credits ?? 0).toLocaleString(locale)} credits ready.
          </div>
        )}

        {/* Profile header */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xl font-black text-white shadow-[0_0_24px_rgba(124,58,237,.4)]">
            {(user?.displayName ?? "?")[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">{user?.displayName ?? "Guest"}</h1>
            <p className="text-sm text-zinc-500">{user?.email ?? ""}</p>
          </div>
          <span className={cn("rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest", TIER_COLORS[tier])}>
            {tierLabel}
          </span>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {/* Credits card */}
          <div className="col-span-1 sm:col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <CreditCard size={13} /> Credits remaining
              </div>
              <span className="text-2xl font-black text-white">{credits.toLocaleString(locale)}</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all"
                style={{ width: `${100 - creditsUsedPct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-zinc-600">
              <span>{creditsUsedPct}% used this month</span>
              <span>{monthlyMax.toLocaleString(locale)} total</span>
            </div>
          </div>

          {/* Subscription card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <Crown size={13} /> Subscription
            </div>
            <p className="mt-2 text-lg font-black text-white">{tierLabel}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {renewalLabel ? `Renews ${renewalLabel}` : "No active plan"}
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600/20 px-3 py-1.5 text-xs font-bold text-violet-200 transition hover:bg-violet-600/30"
            >
              <Zap size={11} /> Upgrade
            </Link>
          </div>
        </div>

        {/* Model access */}
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <Sparkles size={13} /> AI Model Access
          </div>
          <p className="mt-2 text-base font-black text-white">{modelAccess}</p>
          {!user?.entitlements.canUseStandardModel && (
            <p className="mt-1 text-xs text-zinc-500">
              Upgrade to Silver or higher to unlock uncensored AI models.
            </p>
          )}
        </div>

        {/* Recent conversations */}
        {recentConversations.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black text-white">Recent Conversations</h2>
              <Link href="/messages" className="text-xs font-bold text-violet-300 hover:text-white">
                View all →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentConversations.slice(0, 6).map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.characterSlug}`}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition hover:border-violet-500/30 hover:bg-violet-600/5"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-white/10">
                    <Image src={conv.characterImagePath} alt={conv.characterName} fill sizes="40px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{conv.characterName}</p>
                    <p className="truncate text-xs text-zinc-500">{conv.lastMessagePreview}</p>
                  </div>
                  <MessageCircle size={14} className="shrink-0 text-zinc-600 group-hover:text-violet-400" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* My created characters */}
        {myCharacters.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black text-white">{dict.dashboard.myCharacters}</h2>
              <Link href="/create-character" className="flex items-center gap-1.5 text-xs font-bold text-violet-300 hover:text-white">
                <Plus size={13} /> Create new
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {myCharacters.map((char) => (
                <Link
                  key={char.slug}
                  href={`/chat/${char.slug}`}
                  className="group relative overflow-hidden rounded-xl border border-white/[0.08] transition hover:border-violet-500/30"
                >
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={char.imagePath}
                      alt={char.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-black text-white">{char.name}</p>
                    <p className="text-xs capitalize text-zinc-400">{char.mode}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Referral section */}
        {user && user.id !== "demo-user" && (
          <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <Gift size={13} /> Invite Friends · Earn Credits
            </div>
            <p className="mb-3 text-sm text-zinc-400">
              Share your link — you and your friend both get <span className="font-bold text-violet-300">+50 credits</span> when they sign up.
            </p>
            <ReferralBox
              referralCode={(user as any).referralCode}
              referralCount={(user as any).referralCount ?? 0}
            />
          </div>
        )}

        {/* Quick actions */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/characters", icon: Sparkles, label: "Browse Companions", desc: "Find your next chat partner" },
            { href: "/messages", icon: MessageCircle, label: "Messages", desc: "Continue a conversation" },
            { href: "/create-character", icon: Plus, label: "Create Character", desc: "Build your custom companion" },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition hover:border-violet-500/30 hover:bg-violet-600/5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-violet-300 group-hover:bg-violet-600/30">
                <Icon size={16} />
              </span>
              <div>
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
