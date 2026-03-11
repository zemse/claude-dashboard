import { useState, useCallback } from "react";
import type { DashboardData, PricingConfig } from "@/lib/types";
import { parseDirectory } from "@/lib/parser";

interface UsageDataState {
  data: DashboardData | null;
  loading: boolean;
  progress: { current: number; total: number } | null;
  error: string | null;
}

export function useUsageData() {
  const [state, setState] = useState<UsageDataState>({
    data: null,
    loading: false,
    progress: null,
    error: null,
  });

  const loadData = useCallback(
    async (handle: FileSystemDirectoryHandle, pricing: PricingConfig) => {
      setState({ data: null, loading: true, progress: null, error: null });
      try {
        const data = await parseDirectory(handle, pricing, (current, total) => {
          setState((prev) => ({ ...prev, progress: { current, total } }));
        });
        setState({ data, loading: false, progress: null, error: null });
      } catch (e) {
        setState({
          data: null,
          loading: false,
          progress: null,
          error: e instanceof Error ? e.message : "Failed to parse data",
        });
      }
    },
    []
  );

  return { ...state, loadData };
}
