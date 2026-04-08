"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const selectedChurchId = React.useMemo(() => {
    if (
      currentChurchId != null &&
      churches.some((c) => c.id === currentChurchId)
    ) {
      return currentChurchId;
    }
    return churches[0]?.id ?? "";
  }, [churches, currentChurchId]);

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
      <Label
        htmlFor="church-switcher"
        className="mb-1 block text-xs font-medium text-muted-foreground"
      >
        คริสตจักรปัจจุบัน
      </Label>
      <Select
        value={selectedChurchId}
        onValueChange={(id) => setCurrentChurchId(id)}
      >
        <SelectTrigger
          id="church-switcher"
          className="h-9 w-full rounded-md border-sidebar-border bg-background px-2 text-sm"
          data-testid="church-context-switcher"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start" sideOffset={4}>
          {churches.map((church) => (
            <SelectItem key={church.id} value={church.id}>
              {church.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
