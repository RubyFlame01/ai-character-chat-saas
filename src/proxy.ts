import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { detectLocale, isLocale } from "@/lib/i18n-config";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const queryLocale = request.nextUrl.searchParams.get("lang");
  const currentLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const nextLocale = isLocale(queryLocale)
    ? queryLocale
    : isLocale(currentLocale)
      ? currentLocale
      : detectLocale(request.headers.get("accept-language"));

  request.cookies.set("NEXT_LOCALE", nextLocale);

  if (!supabaseUrl || !supabaseAnonKey) {
    const response = NextResponse.next({ request });
    response.cookies.set("NEXT_LOCALE", nextLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();
  response.cookies.set("NEXT_LOCALE", nextLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|generated).*)"],
};
