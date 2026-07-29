// Build-ul de browser al mammoth (fără deps Node) — importat dinamic doar când
// se dă drop pe un .docx (F9). Nu are tipuri proprii pe acest subpath → le declarăm.
declare module "mammoth/mammoth.browser" {
  export function extractRawText(input: {
    arrayBuffer: ArrayBuffer;
  }): Promise<{ value: string; messages: unknown[] }>;
}
