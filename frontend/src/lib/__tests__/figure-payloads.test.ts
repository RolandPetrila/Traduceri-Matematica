import {
  stripFigurePayloads,
  restoreFigurePayloads,
  type StructuredSection,
} from "@/lib/figure-payloads";

// Count every img_b64/svg that survives anywhere in a section tree (recursive).
function countPayloads(sections: StructuredSection[]): number {
  let n = 0;
  for (const s of sections) {
    if (s.img_b64) n++;
    if (s.svg) n++;
    if (s.left) n += countPayloads(s.left);
    if (s.right) n += countPayloads(s.right);
  }
  return n;
}

function sample(): StructuredSection[] {
  return [
    { type: "heading", content: "Unghiuri", level: 1 },
    { type: "paragraph", content: "Bisectoarea unui unghi." },
    { type: "figure", img_b64: "AAAAbase64PNG", caption: "Fig. 1" },
    {
      type: "two_column",
      left: [
        { type: "paragraph", content: "stanga" },
        { type: "figure", img_b64: "LEFTb64", caption: "Fig. 2" },
      ],
      right: [
        { type: "figure", svg: "<svg>right</svg>", caption: "Fig. 3" },
        { type: "paragraph", content: "dreapta" },
      ],
    },
  ];
}

describe("stripFigurePayloads", () => {
  it("removes img_b64/svg from figures, including nested two_column", () => {
    const stripped = stripFigurePayloads(sample());
    expect(countPayloads(stripped)).toBe(0);
  });

  it("keeps text content and structure intact", () => {
    const stripped = stripFigurePayloads(sample());
    expect(stripped[0]).toEqual({
      type: "heading",
      content: "Unghiuri",
      level: 1,
    });
    // figure kept as a section (caption/type) but without the image blob
    expect(stripped[2].type).toBe("figure");
    expect(stripped[2].caption).toBe("Fig. 1");
    expect(stripped[2].img_b64).toBeUndefined();
    // two_column preserved with same child counts
    expect(stripped[3].left).toHaveLength(2);
    expect(stripped[3].right).toHaveLength(2);
    expect(stripped[3].left?.[0].content).toBe("stanga");
  });

  it("does not mutate the input", () => {
    const input = sample();
    stripFigurePayloads(input);
    expect(input[2].img_b64).toBe("AAAAbase64PNG");
    expect(input[3].left?.[1].img_b64).toBe("LEFTb64");
    expect(input[3].right?.[0].svg).toBe("<svg>right</svg>");
  });
});

describe("restoreFigurePayloads (R-MATH: figures survive translation)", () => {
  it("re-attaches every figure payload from the source after a round-trip", () => {
    const original = sample();
    const stripped = stripFigurePayloads(original);

    // Simulate the backend: figures echoed back as-is (stripped), text translated.
    const translated: StructuredSection[] = stripped.map((s) => {
      if (s.type === "two_column") {
        return {
          ...s,
          left: (s.left || []).map((c) =>
            c.type === "figure"
              ? c
              : { ...c, content: (c.content || "") + "_SK" },
          ),
          right: (s.right || []).map((c) =>
            c.type === "figure"
              ? c
              : { ...c, content: (c.content || "") + "_SK" },
          ),
        };
      }
      if (s.type === "figure") return s;
      return { ...s, content: (s.content || "") + "_SK" };
    });

    // No image blobs came back from the backend...
    expect(countPayloads(translated)).toBe(0);

    const restored = restoreFigurePayloads(translated, original);

    // ...but all 3 figure payloads (2 img_b64 + 1 svg) are restored.
    expect(countPayloads(restored)).toBe(3);
    expect(restored[2].img_b64).toBe("AAAAbase64PNG");
    expect(restored[3].left?.[1].img_b64).toBe("LEFTb64");
    expect(restored[3].right?.[0].svg).toBe("<svg>right</svg>");

    // Text is the TRANSLATED text, not the original.
    expect(restored[1].content).toBe("Bisectoarea unui unghi._SK");
    expect(restored[3].left?.[0].content).toBe("stanga_SK");
    expect(restored[3].right?.[1].content).toBe("dreapta_SK");
  });

  it("passes through when original has fewer sections (defensive)", () => {
    const translated: StructuredSection[] = [
      { type: "paragraph", content: "a" },
      { type: "paragraph", content: "b" },
    ];
    const restored = restoreFigurePayloads(translated, [translated[0]]);
    expect(restored).toHaveLength(2);
    expect(restored[1].content).toBe("b");
  });
});
