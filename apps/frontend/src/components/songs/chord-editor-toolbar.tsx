"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Info } from "lucide-react";

const SECTION_INSERT_TEMPLATES = [
  { id: "intro", label: "[Intro]", text: "{intro: [G] / [D]}" },
  { id: "verse", label: "[Verse]", text: "{verse: 1}" },
  { id: "chorus", label: "[Chorus]", text: "{chorus: 1}" },
  { id: "midtro", label: "[Midtro]", text: "{midtro: [Em] / [C]}" },
  { id: "bridge", label: "[Bridge]", text: "{bridge: 1}" },
  { id: "solo", label: "[Solo]", text: "{solo: [G] / [D]}" },
  { id: "instrument", label: "[Instrument]", text: "{instrument: [G] / [D]}" },
  { id: "outro", label: "[Outro]", text: "{outro: [G] / [D]}" },
] as const;

const CHORD_ROOTS = [
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
] as const;

const CHORD_BASIC_SUFFIXES = ["", "m", "7"] as const;
const CHORD_EXTENDED_SUFFIXES = ["maj7", "sus2", "sus4"] as const;
const CHORD_SLASH_SUFFIXES = ["", "m", "7"] as const;
const LETTER_ROOTS = ["C", "D", "E", "F", "G", "A", "B"] as const;

type ChordChoiceGroups = {
  basic: string[];
  extended: string[];
  slash: string[];
};

function buildChordChoices(root: (typeof CHORD_ROOTS)[number]) {
  const basicChoices = CHORD_BASIC_SUFFIXES.map((suffix) => `${root}${suffix}`);
  const extendedChoices = CHORD_EXTENDED_SUFFIXES.map(
    (suffix) => `${root}${suffix}`,
  );
  const rootLetter = root.charAt(0) as (typeof LETTER_ROOTS)[number];
  const rootIndex = LETTER_ROOTS.indexOf(rootLetter);

  if (rootIndex < 0) {
    return {
      basic: basicChoices,
      extended: extendedChoices,
      slash: [],
    } satisfies ChordChoiceGroups;
  }

  const slashBassNotes = [
    LETTER_ROOTS[(rootIndex + 2) % LETTER_ROOTS.length],
    LETTER_ROOTS[(rootIndex + 4) % LETTER_ROOTS.length],
  ];
  const slashChoices = CHORD_SLASH_SUFFIXES.flatMap((suffix) =>
    slashBassNotes.map((bass) => `${root}${suffix}/${bass}`),
  );

  return {
    basic: basicChoices,
    extended: extendedChoices,
    slash: slashChoices,
  } satisfies ChordChoiceGroups;
}

type ChordEditorToolbarProps = {
  onInsert: (text: string) => void;
};

export function ChordEditorToolbar({ onInsert }: ChordEditorToolbarProps) {
  return (
    <div className="mb-4 space-y-3 rounded-xl bg-surface-low px-3 py-3">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          หัวข้อ:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SECTION_INSERT_TEMPLATES.map((section) => (
            <Button
              key={section.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => onInsert(`${section.text}\n`)}
              data-testid={`song-insert-section-${section.id}`}
            >
              {section.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          คอร์ด:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CHORD_ROOTS.map((root) => {
            const chordGroups = buildChordChoices(root);
            return (
              <DropdownMenu key={root}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 min-w-[2.2rem] px-2.5 text-sm"
                    data-testid={`song-chord-menu-${root}`}
                  >
                    {root}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  sideOffset={6}
                  className="min-w-[144px]"
                >
                  <DropdownMenuLabel>Basic</DropdownMenuLabel>
                  {chordGroups.basic.map((chord) => (
                    <DropdownMenuItem
                      key={chord}
                      onSelect={() => onInsert(`[${chord}]`)}
                      data-testid={`song-insert-chord-${chord}`}
                    >
                      {chord}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Extended</DropdownMenuLabel>
                  {chordGroups.extended.map((chord) => (
                    <DropdownMenuItem
                      key={chord}
                      onSelect={() => onInsert(`[${chord}]`)}
                      data-testid={`song-insert-chord-${chord}`}
                    >
                      {chord}
                    </DropdownMenuItem>
                  ))}

                  {chordGroups.slash.length > 0 ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Slash</DropdownMenuLabel>
                      {chordGroups.slash.map((chord) => (
                        <DropdownMenuItem
                          key={chord}
                          onSelect={() => onInsert(`[${chord}]`)}
                          data-testid={`song-insert-chord-${chord}`}
                        >
                          {chord}
                        </DropdownMenuItem>
                      ))}
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end items-center gap-1 text-xs text-muted-foreground">
        <Info className="h-4 w-4" />
        <p>เลือกคอร์ดหรือหัวข้อจากรายการด้านบนแล้วกด Enter เพื่อแทรก</p>
      </div>
    </div>
  );
}
