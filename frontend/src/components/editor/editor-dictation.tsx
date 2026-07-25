"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Editor } from "@tiptap/react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { setDictationInterim } from "./dictation-interim";
import { trackEditor } from "./editor-telemetry";

/**
 * Dictare vocală ro-RO (F4c) — Web Speech API.
 *
 * Suport real (verificat 2026-07-24): Chrome/Edge/Opera (desktop+Android) și
 * Safari macOS 14.1+ / iOS 14.5+, ambele sub prefixul `webkit`. Firefox NU
 * (doar în spatele unui flag) → butonul se ascunde prin feature-detection.
 *
 * Capcană iOS: `continuous` se oprește singur după câteva secunde → repornim
 * automat în `onend` cât timp utilizatorul n-a apăsat stop (ca editorul vechi).
 *
 * Confidențialitate: audio-ul e procesat în cloud-ul browserului (Google/Apple),
 * NU local → arătăm un aviz o singură dată, înainte de prima dictare.
 */
const NOTICE_KEY = "editor_nou_dictare_notice_v1";

type DictationApi = {
  /** false → browserul nu suportă; butonul nu se randează deloc. */
  supported: boolean;
  listening: boolean;
  toggle: () => void;
  error: string | null;
};

const DictationContext = createContext<DictationApi | null>(null);

export function useDictation(): DictationApi | null {
  return useContext(DictationContext);
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function EditorDictationProvider({
  editor,
  children,
}: {
  editor: Editor | null;
  children: ReactNode;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const startedAtRef = useRef(0);
  const editorRef = useRef(editor);
  editorRef.current = editor;

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
  }, []);

  const clearInterim = useCallback(() => {
    const ed = editorRef.current;
    if (ed) setDictationInterim(ed, "");
  }, []);

  const stop = useCallback(() => {
    const wasListening = listeningRef.current;
    listeningRef.current = false;
    setListening(false);
    clearInterim();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* deja oprit */
    }
    if (wasListening && startedAtRef.current) {
      trackEditor("dictation_stop", {
        durationMs: Date.now() - startedAtRef.current,
      });
      startedAtRef.current = 0;
    }
  }, [clearInterim]);

  const beginRecognition = useCallback(() => {
    const Ctor = getRecognitionCtor();
    const ed = editorRef.current;
    if (!Ctor || !ed) return;

    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = "ro-RO";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      const current = editorRef.current;
      if (!current) return;
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const chunk = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += chunk;
        else interimText += chunk;
      }
      if (finalText) {
        // Inserăm ca NOD TEXT (nu HTML) — transcriptul e text brut de la motor
        // și nu trebuie interpretat ca markup.
        current
          .chain()
          .focus()
          .insertContent({ type: "text", text: finalText })
          .run();
        // Logăm transcriptul → o sesiune viitoare poate CITI ce a auzit motorul.
        trackEditor("dictation_final", {
          textLen: finalText.length,
          sample: finalText.slice(0, 80),
        });
      }
      setDictationInterim(current, interimText);
    };

    rec.onerror = (e: any) => {
      const code = e?.error;
      if (code === "no-speech" || code === "aborted") return; // benign → onend repornește
      if (code === "not-allowed" || code === "service-not-allowed") {
        setError(
          "Microfonul e blocat. Permite accesul din setările browserului.",
        );
        stop();
        return;
      }
      setError("Dictarea s-a oprit (eroare motor vocal).");
    };

    rec.onend = () => {
      // iOS Safari oprește `continuous` după câteva secunde → repornim singuri
      // cât timp utilizatorul n-a apăsat stop.
      if (listeningRef.current) {
        try {
          rec.start();
        } catch {
          /* start prea rapid → ignorăm, următorul onend reîncearcă */
        }
      }
    };

    try {
      rec.start();
      listeningRef.current = true;
      startedAtRef.current = Date.now();
      setListening(true);
      setError(null);
      trackEditor("dictation_start", { lang: "ro-RO", continuous: true });
    } catch {
      setError("Nu am putut porni dictarea.");
    }
  }, [stop]);

  const start = useCallback(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(NOTICE_KEY) === "1";
    } catch {
      /* localStorage indisponibil → arătăm avizul */
    }
    if (!seen) {
      setNoticeOpen(true);
      return;
    }
    beginRecognition();
  }, [beginRecognition]);

  const toggle = useCallback(() => {
    if (listeningRef.current) stop();
    else start();
  }, [start, stop]);

  const acceptNotice = useCallback(() => {
    try {
      localStorage.setItem(NOTICE_KEY, "1");
    } catch {
      /* ignore */
    }
    setNoticeOpen(false);
    beginRecognition();
  }, [beginRecognition]);

  // Oprim curat la demontare (altfel microfonul rămâne activ).
  useEffect(() => {
    return () => {
      listeningRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <DictationContext.Provider value={{ supported, listening, toggle, error }}>
      {children}
      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Despre dictare</DialogTitle>
            <DialogDescription>
              Dictarea folosește serviciul de recunoaștere vocală al
              browserului: ce spui este trimis către Google (Chrome/Edge) sau
              Apple (Safari) pentru transcriere. Nu se procesează pe acest
              calculator. Textul rămâne doar în documentul tău.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoticeOpen(false)}>
              Anulează
            </Button>
            <Button onClick={acceptNotice}>Am înțeles, pornește</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DictationContext.Provider>
  );
}

/**
 * Butonul de dictare. Nu se randează deloc dacă browserul nu suportă
 * (ex. Firefox) — mai bine lipsă decât un buton care nu face nimic.
 */
export function EditorDictateButton({
  variant = "toolbar",
}: {
  variant?: "toolbar" | "slim";
}) {
  const api = useDictation();
  if (!api || !api.supported) return null;
  const { listening, toggle, error } = api;
  const slim = variant === "slim";

  return (
    <Button
      variant={listening ? "default" : slim ? "ghost" : "outline"}
      size="sm"
      className={slim ? "h-9 w-9 p-0" : "h-8 gap-1 px-2"}
      onClick={toggle}
      title={error || (listening ? "Oprește dictarea" : "Dictează (ro-RO)")}
      aria-pressed={listening}
      aria-label={listening ? "Oprește dictarea" : "Dictează"}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      {!slim && (listening ? "Oprește" : "Dictează")}
    </Button>
  );
}
