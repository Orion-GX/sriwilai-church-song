"use client";

import { ChordproPreviewModal } from "@/components/songs/chordpro-preview-modal";
import { ConvertLyricsModal } from "@/components/songs/convert-lyrics-modal";
import { SongFormatHelpModal } from "@/components/songs/song-format-help-modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  createSong,
  fetchSongCategories,
  fetchSongTagsCatalog,
  updateSong,
} from "@/lib/api/songs";
import type { SongCategorySnippet, SongVersion } from "@/lib/api/types";
import { slugifySongTag } from "@/lib/songs/tag-slug";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

const CATEGORY_NONE = "__none__";
const EMPTY_TAG_SLUGS: string[] = [];
const PASTEL_TAG_BUTTON_CLASSES = [
  "bg-primary-input text-foreground ring-1 ring-outline-variant/20 hover:bg-accent/70",
  "bg-accent/70 text-foreground ring-1 ring-outline-variant/20 hover:bg-accent",
  "bg-secondary-container/50 text-secondary ring-1 ring-secondary/15 hover:bg-secondary-container/70",
  "bg-muted text-foreground ring-1 ring-outline-variant/20 hover:bg-surface-high",
] as const;

function getPastelTagButtonClass(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PASTEL_TAG_BUTTON_CLASSES[hash % PASTEL_TAG_BUTTON_CLASSES.length];
}

const MUSIC_KEYS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
  "Cm",
  "C#m",
  "Dbm",
  "Dm",
  "D#m",
  "Ebm",
  "Em",
  "Fm",
  "F#m",
  "Gbm",
  "Gm",
  "G#m",
  "Abm",
  "Am",
  "A#m",
  "Bbm",
  "Bm",
] as const;

const TIME_SIGNATURES = [
  "4/4",
  "3/4",
  "6/8",
  "2/4",
  "2/2",
  "6/4",
  "12/8",
] as const;

type SongEditorFormProps = {
  mode: "create" | "edit";
  songId?: string;
  initialTitle?: string;
  initialChordpro?: string;
  initialVersions?: SongVersion[];
  /** หมวดปัจจุบันจาก API (ใช้แสดงชื่อเมื่อไม่มีในรายการหมวด) */
  initialCategory?: SongCategorySnippet | null;
  initialTagSlugs?: string[];
  initialOriginalKey?: string | null;
  initialTempo?: number | null;
  initialTimeSignature?: string | null;
  /** ใช้เมื่อหน้าใส่ SectionHeader แล้ว — ซ่อนหัวการ์ดซ้ำ */
  hideCardHeader?: boolean;
};

const CHORDPRO_PLACEHOLDER = `{intro: [Gmaj7] / [Cmaj7] x2}
{verse: 1}
[Gmaj7]ทุกวันเวลา ข้าอยากอยู่ใกล้[Cmaj7]ชิดพระองค์
[Gmaj7]ทุกวันเวลา อยู่ในความ[Cmaj7]รักของพระองค์
{chorus: 1}
[Gmaj7]ทุกวันเวลา [Cmaj7]ข้าอยากอยู่ใกล้ชิดพระองค์ [D][G]
[Gmaj7]ทุกวันเวลา [Cmaj7]อยู่ในความรักของพระองค์ [D][G]
{outro: [Gmaj7] / [Cmaj7] x2}`;

export function SongEditorForm({
  mode,
  songId,
  initialTitle = "",
  initialChordpro = "",
  initialCategory = null,
  initialTagSlugs = EMPTY_TAG_SLUGS,
  initialOriginalKey = null,
  initialTempo = null,
  initialTimeSignature = null,
  hideCardHeader = false,
}: SongEditorFormProps) {
  type EditorVersion = {
    id?: string;
    localId: string;
    code: "th" | "en" | "custom";
    name: string;
    chordproBody: string;
    isDefault: boolean;
    sortOrder: number;
  };

  const createFallbackVersion = React.useCallback(
    (): EditorVersion => ({
      localId: "local-th-default",
      code: "th",
      name: "ไทย",
      chordproBody: initialChordpro,
      isDefault: true,
      sortOrder: 0,
    }),
    [initialChordpro],
  );

  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [chordproBody, setChordproBody] = React.useState(initialChordpro);
  const [categoryId, setCategoryId] = React.useState<string | null>(
    initialCategory?.id ?? null,
  );
  const [originalKey, setOriginalKey] = React.useState<string>(
    initialOriginalKey ?? "",
  );
  const [tempo, setTempo] = React.useState<string>(
    initialTempo != null ? String(initialTempo) : "",
  );
  const [timeSignature, setTimeSignature] = React.useState<string>(
    initialTimeSignature ?? "",
  );
  const [tagSlugs, setTagSlugs] = React.useState<string[]>(initialTagSlugs);
  const [tagDraft, setTagDraft] = React.useState("");
  const [tagFieldError, setTagFieldError] = React.useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [convertOpen, setConvertOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["songCategoriesCatalog"],
    queryFn: fetchSongCategories,
    staleTime: 60_000,
  });

  const { data: tagCatalog = [] } = useQuery({
    queryKey: ["songTagsCatalog"],
    queryFn: fetchSongTagsCatalog,
    staleTime: 60_000,
  });

  const tagCatalogBySlug = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tagCatalog) {
      m.set(t.slug, t.name);
    }
    return m;
  }, [tagCatalog]);

  const suggestedTags = React.useMemo(
    () => tagCatalog.filter((t) => !tagSlugs.includes(t.slug)),
    [tagCatalog, tagSlugs],
  );

  React.useEffect(() => {
    setTitle(initialTitle);
    setCategoryId(initialCategory?.id ?? null);
    setTagSlugs(initialTagSlugs ?? []);
    setOriginalKey(initialOriginalKey ?? "");
    setTempo(initialTempo != null ? String(initialTempo) : "");
    setTimeSignature(initialTimeSignature ?? "");
  }, [
    initialTitle,
    initialChordpro,
    initialCategory,
    initialTagSlugs,
    initialOriginalKey,
    initialTempo,
    initialTimeSignature,
    createFallbackVersion,
  ]);

  function addTagSlug(slug: string) {
    setTagFieldError(null);
    if (tagSlugs.includes(slug)) {
      setTagFieldError("มีแท็กนี้แล้ว");
      return;
    }
    setTagSlugs((prev) => [...prev, slug]);
  }

  function addTagFromDraft() {
    setTagFieldError(null);
    const raw = tagDraft.trim();
    if (!raw) {
      setTagFieldError("กรุณาใส่ชื่อแท็ก");
      return;
    }
    const slug = slugifySongTag(raw);
    if (slug === "tag") {
      setTagFieldError(
        "แท็กต้องมีตัวอักษร a–z หรือตัวเลข (เช่น praise, worship)",
      );
      return;
    }
    addTagSlug(slug);
    setTagDraft("");
  }

  function removeTag(slug: string) {
    setTagSlugs((prev) => prev.filter((s) => s !== slug));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const parsedTempo = tempo.trim() ? Number(tempo) : null;
      if (mode === "create") {
        await createSong({
          title,
          chordproBody,
          isPublished: true,
          ...(categoryId ? { categoryId } : {}),
          ...(tagSlugs.length ? { tagSlugs } : {}),
          ...(originalKey ? { originalKey } : {}),
          ...(parsedTempo != null ? { tempo: parsedTempo } : {}),
          ...(timeSignature ? { timeSignature } : {}),
        });
        router.push(`/dashboard/songs`);
      } else if (songId) {
        await updateSong(songId, {
          title,
          chordproBody,
          categoryId: categoryId ?? null,
          tagSlugs,
          originalKey: originalKey || null,
          tempo: parsedTempo,
          timeSignature: timeSignature || null,
        });
        router.push(`/dashboard/songs`);
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

  const categoryKnown =
    categoryId != null && categories.some((c) => c.id === categoryId);
  const orphanCategory =
    categoryId != null && !categoryKnown && initialCategory?.id === categoryId
      ? initialCategory
      : null;
  const categorySelectValue =
    categoryId != null && (categoryKnown || orphanCategory)
      ? categoryId
      : CATEGORY_NONE;

  return (
    <Card className="mx-auto w-full max-w-3xl" data-testid="song-editor-form">
      {!hideCardHeader ? (
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "สร้างเพลงใหม่" : "แก้ไขเพลง"}
          </CardTitle>
          <CardDescription>
            เนื้อ ChordPro — คอร์ดใน [วงเล็บเหลี่ยม]
          </CardDescription>
        </CardHeader>
      ) : null}
      <form onSubmit={onSubmit}>
        <CardContent
          className={hideCardHeader ? "space-y-4 pt-5" : "space-y-4"}
        >
          {error ? (
            <FormErrorBanner data-testid="song-editor-error">
              {error}
            </FormErrorBanner>
          ) : null}
          <div className="space-y-2">
            <Label
              className="text-sm font-semibold text-primary"
              htmlFor="song-title"
            >
              ชื่อเพลง
            </Label>
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
            <Label
              className="text-sm font-semibold text-primary"
              htmlFor="song-category"
            >
              กลุ่ม / หมวดหมู่
            </Label>
            {categoriesLoading ? (
              <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            ) : (
              <Select
                value={categorySelectValue}
                onValueChange={(v) =>
                  setCategoryId(v === CATEGORY_NONE ? null : v)
                }
              >
                <SelectTrigger
                  id="song-category"
                  className="w-full max-w-md"
                  data-testid="song-category-select"
                >
                  <SelectValue placeholder="เลือกหมวด" />
                </SelectTrigger>
                <SelectContent position="popper" align="start" sideOffset={4}>
                  <SelectItem value={CATEGORY_NONE}>ไม่ระบุกลุ่ม</SelectItem>
                  {orphanCategory ? (
                    <SelectItem value={orphanCategory.id}>
                      {orphanCategory.name}
                    </SelectItem>
                  ) : null}
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              จัดกลุ่มเพลงในหมวดเดียวกันเพื่อกรองหรือจัดรายการ
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label
                className="text-sm font-semibold text-primary"
                htmlFor="song-original-key"
              >
                คีย์
              </Label>
              <Select
                value={originalKey || "__none__"}
                onValueChange={(v) => setOriginalKey(v === "__none__" ? "" : v)}
              >
                <SelectTrigger
                  id="song-original-key"
                  className="w-full"
                  data-testid="song-original-key-select"
                >
                  <SelectValue placeholder="เลือกคีย์" />
                </SelectTrigger>
                <SelectContent position="popper" align="start" sideOffset={4}>
                  <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                  {MUSIC_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                className="text-sm font-semibold text-primary"
                htmlFor="song-tempo"
              >
                ความเร็ว (BPM)
              </Label>
              <Input
                id="song-tempo"
                type="number"
                min={20}
                max={300}
                placeholder="เช่น 120"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                data-testid="song-input-tempo"
              />
            </div>

            <div className="space-y-2">
              <Label
                className="text-sm font-semibold text-primary"
                htmlFor="song-time-signature"
              >
                Time Signature
              </Label>
              <Select
                value={timeSignature || "__none__"}
                onValueChange={(v) =>
                  setTimeSignature(v === "__none__" ? "" : v)
                }
              >
                <SelectTrigger
                  id="song-time-signature"
                  className="w-full"
                  data-testid="song-time-signature-select"
                >
                  <SelectValue placeholder="เลือก Time Signature" />
                </SelectTrigger>
                <SelectContent position="popper" align="start" sideOffset={4}>
                  <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                  {TIME_SIGNATURES.map((ts) => (
                    <SelectItem key={ts} value={ts}>
                      {ts}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="song-tags-input"
              className="text-sm font-semibold text-primary"
            >
              แท็ก
            </Label>
            <div className="flex flex-wrap gap-2">
              {tagSlugs.map((slug) => (
                <span
                  key={slug}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm ${getPastelTagButtonClass(
                    slug,
                  )}`}
                >
                  <span>{tagCatalogBySlug.get(slug) ?? slug}</span>
                  <button
                    type="button"
                    className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                    aria-label={`ลบแท็ก ${slug}`}
                    onClick={() => removeTag(slug)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              ))}
              {/* {tagSlugs.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  ยังไม่มีแท็ก
                </span>
              ) : null} */}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Input
                id="song-tags-input"
                value={tagDraft}
                onChange={(e) => {
                  setTagDraft(e.target.value);
                  setTagFieldError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTagFromDraft();
                  }
                }}
                placeholder="เช่น praise, worship"
                className="max-w-md text-sm font-normal"
                data-testid="song-input-tag-draft"
              />
              <Button
                type="button"
                variant="primary"
                className="shrink-0"
                onClick={addTagFromDraft}
                data-testid="song-add-tag"
              >
                เพิ่มแท็ก
              </Button>
            </div>
            {tagFieldError ? (
              <p className="text-sm text-destructive" role="alert">
                {tagFieldError}
              </p>
            ) : null}
            {suggestedTags.length > 0 ? (
              <div className="space-y-1.5">
                {/* <p className="text-xs font-medium text-muted-foreground">
                  เลือกจากแท็กที่มีในระบบ
                </p> */}
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.map((t) => (
                    <Button
                      key={t.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      className={`h-8 text-xs ${getPastelTagButtonClass(t.slug)}`}
                      onClick={() => addTagSlug(t.slug)}
                      data-testid={`song-suggest-tag-${t.slug}`}
                    >
                      + {t.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="song-chordpro">ChordPro</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConvertOpen(true)}
                  data-testid="song-chordpro-convert-toggle"
                  aria-haspopup="dialog"
                  aria-expanded={convertOpen}
                >
                  Convert to ChordPro
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHelpOpen(true)}
                  data-testid="song-chordpro-help-toggle"
                  aria-haspopup="dialog"
                  aria-expanded={helpOpen}
                >
                  คำแนะนำ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                  data-testid="song-chordpro-preview-toggle"
                  aria-haspopup="dialog"
                  aria-expanded={previewOpen}
                >
                  ดูตัวอย่าง
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Label
                htmlFor="song-version-name"
                className="text-xs font-semibold text-primary"
              >
                คอร์ดเพลง
              </Label>
            </div>
            <SongFormatHelpModal
              open={helpOpen}
              onClose={() => setHelpOpen(false)}
            />
            <ConvertLyricsModal
              open={convertOpen}
              onClose={() => setConvertOpen(false)}
              onApplyResult={(nextChordPro) => setChordproBody(nextChordPro)}
            />
            <ChordproPreviewModal
              open={previewOpen}
              onClose={() => setPreviewOpen(false)}
              chordproBody={chordproBody}
              originalKey={originalKey || undefined}
              tempo={tempo.trim() ? Number(tempo) : undefined}
              timeSignature={timeSignature || undefined}
              contextTitle={`${title.trim() || "เพลง"}`}
            />
            <Textarea
              id="song-chordpro"
              value={chordproBody}
              onChange={(e) => setChordproBody(e.target.value)}
              required
              minLength={1}
              rows={14}
              className="font-mono text-sm placeholder:text-muted-foreground"
              data-testid="song-input-chordpro"
              placeholder={CHORDPRO_PLACEHOLDER}
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
