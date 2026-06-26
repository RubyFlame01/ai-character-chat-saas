"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import posthog from "posthog-js";

let initialized = false;

function PostHogPageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!initialized) return;
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    posthog.capture("$pageview", { $current_url: window.location.origin + url });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Initializes PostHog product analytics. No-ops gracefully when
 * NEXT_PUBLIC_POSTHOG_KEY is not configured, so it's safe to ship before
 * a PostHog project key is added.
 */
export function PostHogProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || initialized) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false, // we capture manually on route change
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    });
    initialized = true;
  }, []);

  return (
    <Suspense fallback={null}>
      <PostHogPageviews />
    </Suspense>
  );
}
