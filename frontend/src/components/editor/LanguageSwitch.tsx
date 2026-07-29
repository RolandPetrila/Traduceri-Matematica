"use client";

/**
 * F8 — switch de limbi în editor (2026-07-29). Butoane segmentate RO|SK|EN|DE
 * (limba AFIȘATĂ) + selector „scris în" (limba-sursă). La comutare traduce tot
 * documentul; formulele/figurile/tabelele rămân intacte.
 */

import { Loader2, Languages, ChevronDown, X } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LANGS,
  useEditorTranslate,
  type LangCode,
} from "./editor-translate-state";

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const {
    sourceLang,
    displayLang,
    isTranslating,
    error,
    switchLanguage,
    changeSource,
    clearError,
  } = useEditorTranslate();

  const srcName = LANGS.find((l) => l.code === sourceLang)?.label ?? "RO";

  return (
    <div
      className="flex items-center gap-1.5"
      title="Traduce tot documentul în limba aleasă. Formulele, figurile și tabelele rămân intacte; formatarea din interiorul frazei se poate simplifica."
    >
      {!compact && (
        <Languages className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      )}

      {/* „Scris în" — limba-sursă (direcția de traducere) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs"
            title="Limba în care e SCRIS documentul (sursa traducerii)"
          >
            scris în: <strong>{srcName}</strong>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {LANGS.map((l) => (
            <DropdownMenuItem
              key={l.code}
              onClick={() => changeSource(l.code)}
              className={l.code === sourceLang ? "font-semibold" : ""}
            >
              {l.name} ({l.label})
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Segmentat: limba afișată */}
      <ToggleGroup
        type="single"
        value={displayLang}
        onValueChange={(v) => {
          if (v && LANGS.some((l) => l.code === v))
            switchLanguage(v as LangCode);
        }}
        className="gap-0.5"
        disabled={isTranslating}
        aria-label="Limba documentului"
      >
        {LANGS.map((l) => (
          <ToggleGroupItem
            key={l.code}
            value={l.code}
            size="sm"
            className="h-8 min-w-8 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            title={`Afișează / traduce în ${l.name}`}
          >
            {isTranslating && displayLang !== l.code ? (
              <span className="inline-flex items-center gap-1">{l.label}</span>
            ) : (
              l.label
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {isTranslating && (
        <span className="inline-flex items-center gap-1 text-xs opacity-80">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> traduc…
        </span>
      )}

      {error && (
        <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-1.5 py-0.5 text-xs text-destructive">
          {error}
          <button
            onClick={clearError}
            aria-label="Închide eroarea"
            className="ml-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
    </div>
  );
}
