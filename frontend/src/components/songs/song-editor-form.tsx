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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { createSong, updateSong } from "@/lib/api/songs";

type SongEditorFormProps = {
  mode: "create" | "edit";
  songId?: string;
  initialTitle?: string;
  initialChordpro?: string;
};

export function SongEditorForm({
  mode,
  songId,
  initialTitle = "",
  initialChordpro = "",
}: SongEditorFormProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [chordpro, setChordpro] = React.useState(initialChordpro);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setTitle(initialTitle);
    setChordpro(initialChordpro);
  }, [initialTitle, initialChordpro]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "create") {
        const created = await createSong({ title, chordproBody: chordpro, isPublished: true });
        router.push(`/songs/${created.id}`);
        router.refresh();
      } else if (songId) {
        const updated = await updateSong(songId, { title, chordproBody: chordpro });
        router.push(`/songs/${updated.id}`);
        router.refresh();
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : mode === "create"
            ? "สร้างเพลงไม่สำเร็จ"
            : "บันทึกเพลงไม่สำเร็จ";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-3xl" data-testid="song-editor-form">
      <CardHeader>
        <CardTitle>{mode === "create" ? "สร้างเพลงใหม่" : "แก้ไขเพลง"}</CardTitle>
        <CardDescription>
          เนื้อ ChordPro — คอร์ดใน [วงเล็บเหลี่ยม]
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <p
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              data-testid="song-editor-error"
            >
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="song-title">ชื่อเพลง</Label>
            <Input
              id="song-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={1}
              data-testid="song-input-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="song-chordpro">ChordPro</Label>
            <Textarea
              id="song-chordpro"
              value={chordpro}
              onChange={(e) => setChordpro(e.target.value)}
              required
              minLength={1}
              rows={14}
              className="font-mono text-sm"
              data-testid="song-input-chordpro"
            />
          </div>
          <Button type="submit" disabled={loading} data-testid="song-submit">
            {loading
              ? mode === "create"
                ? "กำลังสร้าง…"
                : "กำลังบันทึก…"
              : mode === "create"
                ? "สร้างเพลง"
                : "บันทึก"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
