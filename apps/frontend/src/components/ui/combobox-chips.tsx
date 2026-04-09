"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ComboboxChipsOption = {
  value: string;
  label: string;
};

type ComboboxChipsProps = {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: ComboboxChipsOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  multiple?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function ComboboxChips({
  value,
  onValueChange,
  options,
  placeholder = "เลือกค่า...",
  searchPlaceholder = "พิมพ์เพื่อค้นหา...",
  emptyText = "ไม่พบข้อมูล",
  multiple = true,
  className,
  ariaLabel,
}: ComboboxChipsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const optionButtonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  React.useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    setHighlightedIndex(0);
    searchInputRef.current?.focus();
  }, [open]);

  const optionMap = React.useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );

  const selectedOptions = React.useMemo(
    () => value.map((item) => optionMap.get(item)).filter(Boolean) as ComboboxChipsOption[],
    [optionMap, value],
  );

  const filteredOptions = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  }, [options, query]);

  React.useEffect(() => {
    if (highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(filteredOptions.length > 0 ? filteredOptions.length - 1 : 0);
    }
  }, [filteredOptions.length, highlightedIndex]);

  React.useEffect(() => {
    const el = optionButtonRefs.current[highlightedIndex];
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  function removeValue(item: string) {
    onValueChange(value.filter((v) => v !== item));
  }

  function toggleValue(item: string) {
    const selected = value.includes(item);
    if (multiple) {
      onValueChange(
        selected ? value.filter((v) => v !== item) : [...value, item],
      );
      return;
    }
    onValueChange(selected ? [] : [item]);
    setOpen(false);
  }

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onSearchInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredOptions.length > 0
          ? Math.min(filteredOptions.length - 1, prev + 1)
          : prev,
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(0, prev - 1));
      return;
    }
    if (e.key === "Enter") {
      if (filteredOptions.length === 0) return;
      e.preventDefault();
      toggleValue(filteredOptions[highlightedIndex]?.value ?? filteredOptions[0].value);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-white px-3 py-2 text-left text-sm shadow-sm",
          "dark:bg-card",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map((option) => (
              <Badge key={option.value} variant="secondary" className="gap-1 pr-1">
                <span>{option.label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className="inline-flex cursor-pointer rounded p-0.5 hover:bg-black/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeValue(option.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      removeValue(option.value);
                    }
                  }}
                >
                  <X className="h-3 w-3" aria-hidden />
                </span>
              </Badge>
            ))
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card p-2 shadow-elevated">
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchInputKeyDown}
            placeholder={searchPlaceholder}
            className="mb-2 h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <div id={listboxId} role="listbox" className="max-h-56 overflow-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filteredOptions.map((option) => {
                const selected = value.includes(option.value);
                const highlighted =
                  filteredOptions[highlightedIndex]?.value === option.value;
                return (
                  <button
                    key={option.value}
                    ref={(node) => {
                      optionButtonRefs.current = optionButtonRefs.current.slice(
                        0,
                        filteredOptions.length,
                      );
                      optionButtonRefs.current[filteredOptions.indexOf(option)] = node;
                    }}
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                      highlighted && "bg-accent",
                    )}
                    onMouseEnter={() =>
                      setHighlightedIndex(filteredOptions.indexOf(option))
                    }
                  >
                    <span>{option.label}</span>
                    {selected ? <Check className="h-4 w-4 text-foreground/70" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

