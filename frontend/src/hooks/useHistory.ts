import { useState, useEffect, useCallback } from "react";
import type { HistoryEntry } from "@/lib/types";
import { getHistory, clearHistory as clearStore } from "@/lib/storage";

interface UseHistoryReturn {
  entries: HistoryEntry[];
  refresh: () => void;
  clear: () => void;
}

export function useHistory(): UseHistoryReturn {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const refresh = useCallback(() => {
    setEntries(getHistory());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clear = useCallback(() => {
    clearStore();
    setEntries([]);
  }, []);

  return { entries, refresh, clear };
}
