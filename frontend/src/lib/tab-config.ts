// Copie in frontend/config/ fiindca deploy-ul Vercel are root=frontend/ si NU
// vede ../config/ de la radacina repo. Sursa canonica: <repo>/config/tabs.json
// — tine-le sincronizate daca modifici tab-urile.
import tabsData from "../../config/tabs.json";

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  default?: boolean;
}

export const TABS: TabConfig[] = tabsData.tabs;
export const DEFAULT_TAB =
  TABS.find((t) => t.default)?.id || TABS[0]?.id || "traduceri";
export type TabId = string;
