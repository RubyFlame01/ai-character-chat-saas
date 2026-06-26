"use client";

import { useSyncExternalStore } from "react";

/**
 * Module-level store holding the current live online visitor count.
 * A single <OnlinePresence /> mounted in the root layout owns the Supabase
 * Realtime presence channel and writes here; any component can read the value
 * via useOnlineCount() without opening its own channel (avoids double-counting).
 */
let onlineCount: number | null = null;
const listeners = new Set<() => void>();

export function setOnlineCount(value: number | null) {
  onlineCount = value;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return onlineCount;
}

/** Reads the live online count. Returns null while connecting / unavailable. */
export function useOnlineCount(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
