"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyChurches } from "@/lib/api/churches";
import { useAuthStore } from "@/lib/stores/auth-store";

export function ChurchSwitcher() {
  const currentChurchId = useAuthStore((s) => s.currentChurchId);
  const setCurrentChurchId = useAuthStore((s) => s.setCurrentChurchId);
  const { data } = useQuery({
    queryKey: ["myChurches"],
    queryFn: fetchMyChurches,
  });

  const churches = React.useMemo(() => data ?? [], [data]);
  React.useEffect(() => {
    if (churches.length === 0) return;
    const stillValid = currentChurchId
      ? churches.some((c) => c.id === currentChurchId)
      : false;
    if (!stillValid) {
      setCurrentChurchId(churches[0].id);
    }
  }, [churches, currentChurchId, setCurrentChurchId]);

  if (churches.length === 0) return null;

  return (
    <div className="mb-3 px-1">
      <label
        htmlFor="church-switcher"
        className="mb-1 block text-xs font-medium text-muted-foreground"
      >
        คริสตจักรปัจจุบัน
      </label>
      <select
        id="church-switcher"
        value={currentChurchId ?? ""}
        onChange={(e) => setCurrentChurchId(e.target.value || null)}
        className="h-9 w-full rounded-md border border-sidebar-border bg-background px-2 text-sm"
        data-testid="church-context-switcher"
      >
        {churches.map((church) => (
          <option key={church.id} value={church.id}>
            {church.name}
          </option>
        ))}
      </select>
    </div>
  );
}
