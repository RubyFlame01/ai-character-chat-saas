import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

export default async function ReferralLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!code) redirect("/signup");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090714] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <span className="brand-gradient flex size-14 items-center justify-center rounded-2xl shadow-[0_0_32px_rgba(168,85,247,.5)]">
            <Sparkles size={24} className="text-white" />
          </span>
        </div>
        <h1 className="mb-2 text-3xl font-black text-white">You're invited!</h1>
        <p className="mb-2 text-zinc-400">
          Your friend sent you a special invite to LustTalk AI.
        </p>
        <p className="mb-8 text-sm font-bold text-violet-300">
          Sign up now and both of you get <span className="text-white">+50 free credits</span>.
        </p>
        <Link
          href={`/signup?ref=${encodeURIComponent(code)}`}
          className="brand-gradient block w-full rounded-2xl py-3.5 text-sm font-black text-white shadow-[0_0_24px_rgba(124,58,237,.4)] transition hover:opacity-90"
        >
          Claim Your Bonus & Join Free
        </Link>
        <p className="mt-4 text-xs text-zinc-600">
          Already have an account?{" "}
          <Link href={`/login?ref=${encodeURIComponent(code)}`} className="text-violet-400 hover:text-white">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
