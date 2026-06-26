"use client";

import { useEffect } from "react";
import { hasSupabaseBrowserEnv } from "@/lib/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { setOnlineCount } from "@/lib/hooks/use-online-count";

/**
 * Owns the single Supabase Realtime presence channel for the whole app.
 * Mount once in the root layout. Every browser tab joins "online-users" and
 * announces itself; the unique-client count is published to the shared store
 * read by useOnlineCount().
 */
export function OnlinePresence() {
  useEffect(() => {
    if (!hasSupabaseBrowserEnv()) return;

    const supabase = createSupabaseBrowserClient();
    const presenceKey =
      globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

    const channel = supabase.channel("online-users", {
      config: { presence: { key: presenceKey } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      setOnlineCount(null);
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
