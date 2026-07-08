import {
  getCachedTranslation,
  cacheTranslation,
  clearTranslationCache,
  getCacheStats,
} from "@/lib/translation-cache";

function file(name: string, content: string): File {
  return new File([content], name, { type: "application/pdf" });
}

beforeEach(() => {
  localStorage.clear();
});

describe("translation-cache", () => {
  it("returns null on a miss and the stored html on a hit", async () => {
    const files = [file("doc.pdf", "hello world")];
    expect(await getCachedTranslation(files, "ro", "sk")).toBeNull();
    await cacheTranslation(files, "ro", "sk", "<p>ahoj</p>");
    expect(await getCachedTranslation(files, "ro", "sk")).toBe("<p>ahoj</p>");
  });

  it("distinguishes same name+size but different content (SHA-256 key)", async () => {
    const a = [file("same.pdf", "AAAA")]; // size 4
    const b = [file("same.pdf", "BBBB")]; // same name, same size, different bytes
    await cacheTranslation(a, "ro", "sk", "<p>one</p>");
    expect(await getCachedTranslation(b, "ro", "sk")).toBeNull();
    expect(await getCachedTranslation(a, "ro", "sk")).toBe("<p>one</p>");
  });

  it("keys are scoped per language pair", async () => {
    const files = [file("doc.pdf", "x")];
    await cacheTranslation(files, "ro", "sk", "<p>sk</p>");
    expect(await getCachedTranslation(files, "ro", "en")).toBeNull();
    expect(await getCachedTranslation(files, "ro", "sk")).toBe("<p>sk</p>");
  });

  it("clearTranslationCache empties the store", async () => {
    await cacheTranslation([file("d.pdf", "y")], "ro", "sk", "<p>z</p>");
    expect(getCacheStats().entries).toBe(1);
    clearTranslationCache();
    expect(getCacheStats().entries).toBe(0);
  });
});
