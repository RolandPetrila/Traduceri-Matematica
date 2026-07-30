// Copie in frontend/config/ fiindca deploy-ul Vercel are root=frontend/ si NU
// vede ../config/ de la radacina repo. Sursa canonica: <repo>/config/tabs.json
// — tine-le sincronizate daca modifici tab-urile.
import tabsData from "../../config/tabs.json";

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  default?: boolean;
  // "iframe" = static self-contained module served from public/<id>/index.html,
  // wired natively by the shell via <IframeModule> (drop folder + tabs.json
  // entry, zero shell edits). Absent/"react" = a native React panel wired
  // explicitly in page.tsx. See docs/PLAN_MASTER.md (iframe-module convention).
  kind?: "iframe" | "react";
  description?: string;
}

// Cast: JSON widens the `kind` literals to `string`; the shape is validated by
// the canonical tabs.json we control.
export const TABS: TabConfig[] = tabsData.tabs as TabConfig[];
export const DEFAULT_TAB =
  TABS.find((t) => t.default)?.id || TABS[0]?.id || "editor";
export type TabId = string;
