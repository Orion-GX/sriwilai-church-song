"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { fetchMyProfile, updateMyProfile } from "@/lib/api/users";
import { useAuthStore } from "@/lib/stores/auth-store";

export function ProfileForm({ hideCardHeader = false }: { hideCardHeader?: boolean }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.accessToken);
  const storeUser = useAuthStore((s) => s.user);

  const [email, setEmail] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchMyProfile();
        if (!cancelled) {
          setEmail(p.email);
          setDisplayName(p.displayName);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await updateMyProfile({ displayName });
      if (token && storeUser) {
        setAuth(token, {
          ...storeUser,
          displayName: updated.displayName,
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-muted-foreground" data-testid="profile-loading">
        กำลังโหลดโปรไฟล์…
      </p>
    );
  }

  return (
    <Card data-testid="profile-form">
      {!hideCardHeader ? (
        <CardHeader>
          <CardTitle>โปรไฟล์</CardTitle>
          <CardDescription>
            แก้ไขชื่อที่แสดง (อีเมลเปลี่ยนผ่านแอดมินเท่านั้น)
          </CardDescription>
        </CardHeader>
      ) : null}
      <form onSubmit={onSubmit}>
        <CardContent className={hideCardHeader ? "space-y-4 pt-5" : "space-y-4"}>
          {error ? (
            <p
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              data-testid="profile-error"
            >
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="profile-email">อีเมล</Label>
            <Input
              id="profile-email"
              value={email}
              readOnly
              className="bg-muted"
              data-testid="profile-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-display-name">ชื่อที่แสดง</Label>
            <Input
              id="profile-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
              maxLength={150}
              data-testid="profile-display-name-input"
            />
          </div>
          <Button type="submit" disabled={saving} data-testid="profile-submit">
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
