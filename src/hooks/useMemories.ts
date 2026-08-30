"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchActivity, listMemories, subscribe } from "@/lib/client";
import type { ActivityEvent, Memory } from "@/lib/types";

/**
 * Live view of the shared memory layer.
 *
 * BroadcastChannel gives instant updates when another tab writes; the interval
 * is the safety net that also catches writes made from another browser window
 * or by a direct API call during the demo.
 */
export function useMemories(pollMs = 2500) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const [nextMemories, nextEvents] = await Promise.all([listMemories(), fetchActivity()]);
      setMemories(nextMemories);
      setEvents(nextEvents);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tether is unreachable.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), pollMs);
    const unsubscribe = subscribe(() => void refresh());
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [refresh, pollMs]);

  return { memories, events, loading, error, refresh, setMemories };
}
