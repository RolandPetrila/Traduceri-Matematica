"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Test de microfon cu indicator de nivel LIVE (2026-07-26).
 *
 * De ce: telemetria dictării arată `dictation_audio` (stream deschis) urmat DOAR
 * de `no-speech` → `no_voice_loop`. Adică microfonul selectat livrează stream, dar
 * TĂCUT (dispozitiv greșit — ex. „Sound Blaster Rec" — sau Mut/nivel 0). Web Speech
 * API NU permite alegerea dispozitivului din cod, dar `getUserMedia` DA → aici poți
 * TESTA fiecare intrare și vedea care îți duce vocea. Apoi setezi ACEA intrare ca
 * microfon implicit în Chrome (lacăt → Microfon) și dictarea o folosește.
 */
export function MicTestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [level, setLevel] = useState(0); // 0..1
  const [peak, setPeak] = useState(0); // cel mai tare nivel văzut (dovada că aude)
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopAll = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setLevel(0);
  }, []);

  // Pornește măsurarea pe dispozitivul cerut (sau implicit).
  const startMeter = useCallback(
    async (id?: string) => {
      stopAll();
      setError(null);
      setPeak(0);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: id ? { deviceId: { exact: id } } : true,
        });
        streamRef.current = stream;
        // După permisiune primim etichetele reale ale dispozitivelor.
        const list = (await navigator.mediaDevices.enumerateDevices()).filter(
          (d) => d.kind === "audioinput",
        );
        setDevices(list);
        const active = stream.getAudioTracks()[0]?.getSettings().deviceId;
        if (active) setDeviceId(active);

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        src.connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);

        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length); // 0..~1
          const norm = Math.min(1, rms * 3); // amplificăm vizual vorbirea normală
          setLevel(norm);
          setPeak((p) => (norm > p ? norm : p));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        const name = (e as DOMException)?.name;
        setError(
          name === "NotAllowedError"
            ? "Permisiune refuzată. Apasă lacătul din bara de adrese → Microfon → Permite."
            : name === "NotFoundError"
              ? "Niciun microfon găsit. Verifică dispozitivul de intrare din Windows."
              : "Nu am putut porni testul microfonului.",
        );
      }
    },
    [stopAll],
  );

  useEffect(() => {
    if (open) startMeter();
    else stopAll();
    return () => stopAll();
  }, [open, startMeter, stopAll]);

  const pct = Math.round(level * 100);
  const peakPct = Math.round(peak * 100);
  const heard = peak > 0.08; // a văzut vreodată semnal clar de voce

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Testează microfonul</DialogTitle>
          <DialogDescription>
            Vorbește acum. Bara de mai jos trebuie să sară când vorbești. Dacă
            rămâne la zero, dispozitivul ăsta e tăcut — alege altul din listă.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {devices.length > 0 && (
            <Select
              value={deviceId}
              onValueChange={(v) => {
                setDeviceId(v);
                startMeter(v);
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Alege microfonul" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label || "Microfon"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Bara de nivel live */}
          <div className="h-4 w-full overflow-hidden rounded bg-muted">
            <div
              className={`h-full transition-[width] duration-75 ${
                level > 0.02 ? "bg-green-500" : "bg-muted-foreground/30"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Nivel: {pct}% · maxim văzut: {peakPct}%{" "}
            {heard ? (
              <span className="font-medium text-green-600">
                ✓ microfonul aude
              </span>
            ) : (
              <span className="font-medium text-amber-600">
                — încă n-am auzit voce
              </span>
            )}
          </p>

          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="rounded-md border border-border bg-muted/40 p-2 text-[11px] leading-snug text-muted-foreground">
            <strong>Dacă bara nu sare la vorbire:</strong> intrarea selectată e
            tăcută. Alege alt microfon din listă până sare bara. Apoi, în
            Chrome: lacătul din bara de adrese → <em>Microfon</em> → alege ACEL
            dispozitiv. Dictarea folosește microfonul implicit al Chrome.
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Închide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
