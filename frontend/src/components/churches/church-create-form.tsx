"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { createChurch } from "@/lib/api/churches";

export function ChurchCreateForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const trimmedSlug = slug.trim();
      const created = await createChurch({
        name: name.trim(),
        ...(trimmedSlug ? { slug: trimmedSlug } : {}),
      });
      router.push(`/dashboard/churches/${created.id}/manage`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "สร้างไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card data-testid="church-create-form">
      <CardHeader>
        <CardTitle>สร้างคริสตจักร</CardTitle>
        <CardDescription>
          slug ว่างได้ — ระบบสร้างจากชื่อให้อัตโนมัติ (a-z ตัวเล็กและ -)
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <p
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              data-testid="church-create-error"
            >
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="church-name">ชื่อ</Label>
            <Input
              id="church-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={200}
              data-testid="church-input-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="church-slug">Slug (ไม่บังคับ)</Label>
            <Input
              id="church-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="เช่น my-chapel"
              maxLength={120}
              data-testid="church-input-slug"
            />
          </div>
          <Button type="submit" disabled={loading} data-testid="church-submit">
            {loading ? "กำลังสร้าง…" : "สร้าง"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
