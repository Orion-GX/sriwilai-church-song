"use client";

import { Link2, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FollowLeaderToggleProps = {
  active: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  disabled?: boolean;
  large?: boolean;
};

/**
 * สลับโหมด follower: รับเพลง/การเลื่อนจาก leader ผ่าน WebSocket
 */
export function FollowLeaderToggle({
  active,
  onFollow,
  onUnfollow,
  disabled,
  large,
}: FollowLeaderToggleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border-2 bg-card p-4",
        active ? "border-primary" : "border-muted",
        large && "p-6",
      )}
    >
      <p
        className={cn(
          "font-medium text-muted-foreground",
          large && "text-lg",
        )}
      >
        ตาม leader
      </p>
      <p className="text-sm text-muted-foreground">
        เปิดแล้วจะเปลี่ยนเพลงและตำแหน่งเลื่อนตาม leader แบบเรียลไทม์
      </p>
      <Button
        type="button"
        size={large ? "lg" : "default"}
        variant={active ? "destructive" : "default"}
        className={cn(
          large && "h-16 text-xl font-semibold",
          !large && "w-full sm:w-auto",
        )}
        disabled={disabled}
        onClick={() => (active ? onUnfollow() : onFollow())}
      >
        {active ? (
          <>
            <Link2Off className={cn("mr-2", large ? "h-8 w-8" : "h-5 w-5")} />
            หยุดตาม
          </>
        ) : (
          <>
            <Link2 className={cn("mr-2", large ? "h-8 w-8" : "h-5 w-5")} />
            เริ่มตาม leader
          </>
        )}
      </Button>
    </div>
  );
}
