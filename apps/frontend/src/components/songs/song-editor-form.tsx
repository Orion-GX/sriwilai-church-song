"use client";

import { ChordEditorToolbar } from "@/components/songs/chord-editor-toolbar";
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
  fetchSongAdminCategories,
  fetchSongAdminTagsCatalog,
  updateSong,
} from "@/lib/api/songs";
import type {
  SongCategorySnippet,
  SongTagCatalogItem,
  SongVersion,
} from "@/lib/api/types";
import { slugifySongTag } from "@/lib/songs/tag-slug";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, Trash2, Upload, X } from "lucide-react";
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
  initialCoverImageUrl?: string | null;
  /** ใช้เมื่อหน้าใส่ SectionHeader แล้ว — ซ่อนหัวการ์ดซ้ำ */
  hideCardHeader?: boolean;
  /** โหมดอ่านอย่างเดียว: แสดงค่าเดิมทั้งหมด แต่แก้ไขไม่ได้ */
  readOnly?: boolean;
  /** ข้อความเสริมด้านบนฟอร์มสำหรับโหมดอ่านอย่างเดียว */
  readOnlyNote?: string;
};

const CHORDPRO_PLACEHOLDER = `{intro: [Gmaj7] / [Cmaj7] x2}
{verse: 1}
[Gmaj7]ทุกวันเวลา ข้าอยากอยู่ใกล้[Cmaj7]ชิดพระองค์
[Gmaj7]ทุกวันเวลา อยู่ในความ[Cmaj7]รักของพระองค์
{chorus: 1}
[Gmaj7]ทุกวันเวลา [Cmaj7]ข้าอยากอยู่ใกล้ชิดพระองค์
[Gmaj7]ทุกวันเวลา [Cmaj7]อยู่ในความรักของพระองค์
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
  initialCoverImageUrl = null,
  hideCardHeader = false,
  readOnly = false,
  readOnlyNote,
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
  const [coverImageUrl, setCoverImageUrl] = React.useState<string>(
    initialCoverImageUrl ?? "",
  );
  const [coverFieldError, setCoverFieldError] = React.useState<string | null>(
    null,
  );
  const [tagSlugs, setTagSlugs] = React.useState<string[]>(initialTagSlugs);
  const [tagDraft, setTagDraft] = React.useState("");
  const [tagFieldError, setTagFieldError] = React.useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [convertOpen, setConvertOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const coverInputRef = React.useRef<HTMLInputElement | null>(null);
  const chordproTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["dashboard", "songCategoriesCatalog"],
    queryFn: fetchSongAdminCategories,
    staleTime: 60_000,
  });

  const { data: tagCatalog = [] } = useQuery({
    queryKey: ["dashboard", "songTagsCatalog"],
    queryFn: fetchSongAdminTagsCatalog,
    staleTime: 60_000,
  });

  const tagCatalogBySlug = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tagCatalog) {
      m.set(t.code, t.name);
    }
    return m;
  }, [tagCatalog]);

  const suggestedTags = React.useMemo(
    () => tagCatalog.filter((t) => !tagSlugs.includes(t.code)),
    [tagCatalog, tagSlugs],
  );

  React.useEffect(() => {
    setTitle(initialTitle);
    setCategoryId(initialCategory?.id ?? null);
    setTagSlugs(initialTagSlugs ?? []);
    setOriginalKey(initialOriginalKey ?? "");
    setTempo(initialTempo != null ? String(initialTempo) : "");
    setTimeSignature(initialTimeSignature ?? "");
    setCoverImageUrl(initialCoverImageUrl ?? "");
    setCoverFieldError(null);
  }, [
    initialTitle,
    initialChordpro,
    initialCategory,
    initialTagSlugs,
    initialOriginalKey,
    initialTempo,
    initialTimeSignature,
    initialCoverImageUrl,
    createFallbackVersion,
  ]);

  function openCoverPicker() {
    setCoverFieldError(null);
    coverInputRef.current?.click();
  }

  function clearCoverImage() {
    setCoverFieldError(null);
    setCoverImageUrl("");
  }

  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setCoverFieldError("รองรับเฉพาะไฟล์รูปภาพ");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setCoverFieldError("ขนาดรูปต้องไม่เกิน 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setCoverFieldError("ไม่สามารถอ่านไฟล์รูปได้");
        return;
      }
      setCoverFieldError(null);
      setCoverImageUrl(result);
    };
    reader.onerror = () => {
      setCoverFieldError("ไม่สามารถอ่านไฟล์รูปได้");
    };
    reader.readAsDataURL(file);
  }

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

  const insertIntoChordEditor = React.useCallback((text: string) => {
    const textarea = chordproTextareaRef.current;
    if (!textarea) {
      setChordproBody((prev) => `${prev}${text}`);
      return;
    }

    const cursorStart = textarea.selectionStart ?? 0;
    const cursorEnd = textarea.selectionEnd ?? cursorStart;
    const nextCursorPos = cursorStart + text.length;

    setChordproBody((prev) => {
      const before = prev.slice(0, cursorStart);
      const after = prev.slice(cursorEnd);
      return `${before}${text}${after}`;
    });

    requestAnimationFrame(() => {
      const nextTextarea = chordproTextareaRef.current;
      if (!nextTextarea) {
        return;
      }
      nextTextarea.focus();
      nextTextarea.setSelectionRange(nextCursorPos, nextCursorPos);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setError(null);
    setLoading(true);
    try {
      const parsedTempo = tempo.trim() ? Number(tempo) : null;
      const normalizedCoverImageUrl = coverImageUrl.trim();
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
          ...(normalizedCoverImageUrl
            ? { coverImageUrl: normalizedCoverImageUrl }
            : {}),
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
          coverImageUrl: normalizedCoverImageUrl || null,
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
    <Card className="mx-auto w-full max-w-none" data-testid="song-editor-form">
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
        <fieldset disabled={readOnly}>
          <CardContent
            className={hideCardHeader ? "space-y-4 pt-5" : "space-y-4"}
          >
            {readOnly && readOnlyNote ? (
              <FormErrorBanner data-testid="song-editor-readonly-note">
                {readOnlyNote}
              </FormErrorBanner>
            ) : null}
            {error ? (
              <FormErrorBanner data-testid="song-editor-error">
                {error}
              </FormErrorBanner>
            ) : null}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">ข้อมูลเพลง</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      placeholder="เช่น ทุกวันเวลา"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      className="text-sm font-semibold text-primary"
                      htmlFor="song-category"
                    >
                      หมวดหมู่
                    </Label>
                    {categoriesLoading ? (
                      <Skeleton className="h-10 w-full rounded-lg" />
                    ) : (
                      <Select
                        value={categorySelectValue}
                        onValueChange={(v) =>
                          setCategoryId(v === CATEGORY_NONE ? null : v)
                        }
                      >
                        <SelectTrigger
                          id="song-category"
                          className="w-full"
                          data-testid="song-category-select"
                        >
                          <SelectValue placeholder="เลือกหมวด" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          align="start"
                          sideOffset={4}
                        >
                          <SelectItem value={CATEGORY_NONE}>
                            ไม่ระบุกลุ่ม
                          </SelectItem>
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
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">รายละเอียดเพลง</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-2">
                      <Label
                        className="text-sm font-semibold text-primary"
                        htmlFor="song-original-key"
                      >
                        คีย์
                      </Label>
                      <Select
                        value={originalKey || "__none__"}
                        onValueChange={(v) =>
                          setOriginalKey(v === "__none__" ? "" : v)
                        }
                      >
                        <SelectTrigger
                          id="song-original-key"
                          className="w-full"
                          data-testid="song-original-key-select"
                        >
                          <SelectValue placeholder="เลือกคีย์" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          align="start"
                          sideOffset={4}
                        >
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
                        placeholder="72"
                        value={tempo}
                        onChange={(e) => setTempo(e.target.value)}
                        data-testid="song-input-tempo"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2 xl:col-span-1">
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
                        <SelectContent
                          position="popper"
                          align="start"
                          sideOffset={4}
                        >
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">กลุ่ม / หมวดหมู่</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="song-tags-input"
                      className="text-sm font-semibold text-primary"
                    >
                      ป้ายกำกับ
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
                    </div>
                    <div className="space-y-2">
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
                        placeholder="เช่น คริสตมาส, อีสเตอร์, ของพระคุณ.."
                        className="w-full text-sm font-normal"
                        data-testid="song-input-tag-draft"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        className="w-full"
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
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedTags.map((t: SongTagCatalogItem) => (
                          <Button
                            key={t.id}
                            type="button"
                            size="sm"
                            variant="outline"
                            className={`h-8 text-xs ${getPastelTagButtonClass(t.code)}`}
                            onClick={() => addTagSlug(t.code)}
                            data-testid={`song-suggest-tag-${t.code}`}
                          >
                            + {t.name}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">เพิ่มรูปปก</CardTitle>
                  <CardDescription>รูปปกสำหรับอ้างอิง</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverFileChange}
                  />
                  <div className="relative overflow-hidden rounded-xl border border-border bg-surface-low">
                    <div className="aspect-[4/3]">
                      {coverImageUrl ? (
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${coverImageUrl})` }}
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                          <ImagePlus className="h-8 w-8" aria-hidden />
                          <p className="text-sm">ยังไม่มีรูปปก</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={openCoverPicker}
                    >
                      <Upload className="h-4 w-4" aria-hidden />
                      เลือกรูปภาพ
                    </Button>
                    {coverImageUrl ? (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={clearCoverImage}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        ลบรูป
                      </Button>
                    ) : null}
                  </div>
                  {coverFieldError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {coverFieldError}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card className="h-full">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>คอร์ด / เนื้อเพลง</CardTitle>
                    <CardDescription>
                      ใช้วงเล็บเหลี่ยมสำหรับคอร์ด (e.g. [G])
                    </CardDescription>
                  </div>
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
                      แปลงเนื้อเพลง
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
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
                      variant="primary"
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
              </CardHeader>
              <CardContent>
                <SongFormatHelpModal
                  open={helpOpen}
                  onClose={() => setHelpOpen(false)}
                />
                <ConvertLyricsModal
                  open={convertOpen}
                  onClose={() => setConvertOpen(false)}
                  onApplyResult={(nextChordPro) =>
                    setChordproBody(nextChordPro)
                  }
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
                <ChordEditorToolbar onInsert={insertIntoChordEditor} />
                <Textarea
                  id="song-chordpro"
                  ref={chordproTextareaRef}
                  value={chordproBody}
                  onChange={(e) => setChordproBody(e.target.value)}
                  required
                  minLength={1}
                  rows={28}
                  className="min-h-[620px] text-sm font-semibold placeholder:text-muted-foreground placeholder:font-normal"
                  data-testid="song-input-chordpro"
                  placeholder={CHORDPRO_PLACEHOLDER}
                />
              </CardContent>
            </Card>
          </div>

            {!readOnly ? (
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/songs")}
                  data-testid="song-cancel"
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={loading} data-testid="song-submit">
                  {loading
                    ? mode === "create"
                      ? "กำลังสร้าง…"
                      : "กำลังบันทึก…"
                    : "บันทึก"}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </fieldset>
      </form>
    </Card>
  );
}
