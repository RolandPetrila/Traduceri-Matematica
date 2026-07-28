import { Image } from "@tiptap/extension-image";

/**
 * Imagine REDIMENSIONABILĂ pe foaie (2026-07-29, Roland §17) — figuri geometrice (B)
 * + orice imagine încărcată. Prinzi colțul jos-dreapta → mărești/micșorezi, cu
 * proporția BLOCATĂ (o figură nu trebuie deformată). Dublu-click = mărime originală.
 *
 * DE CE atribut de nod, nu CSS pe wrapper: dimensiunea trebuie să supraviețuiască
 * exportului. `renderHTML` emite `width`/`height` REALE pe `<img>` → intră în
 * `editor.getHTML()` → PDF/HTML (browserul le respectă, `height:auto` păstrează
 * proporția) ȘI Word (`renderFiguresToPng` păstrează un width existent, turbodocx
 * îl mapează la dimensiunea imaginii). NodeView-ul e DOAR pentru handle-ul viu —
 * export-ul nu depinde de el (evită capcana din finding_tiptap_table_nodeview_...).
 *
 * Drag: listeneri pe `window` (pointermove/up/cancel), FĂRĂ `setPointerCapture`
 * (capcană CDP: aruncă pe pointer-ul de test → dragul nu pornește). Același tipar
 * dovedit ca grip-urile chenarului Matematică (Cerința 1).
 */

const MIN_W = 48; // px — sub asta figura devine ilizibilă

/** Lățimea maximă utilă = lățimea conținutului editorului (coloana A4/foaia). */
function contentWidth(dom: HTMLElement): number {
  const w = dom.clientWidth;
  return w > MIN_W ? w : 658; // fallback ≈ lățimea A4 utilă
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("width") || null,
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.width ? { width: String(attributes.width) } : {},
      },
      height: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("height") || null,
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.height ? { height: String(attributes.height) } : {},
      },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrap = document.createElement("div");
      wrap.className = "img-resize-wrap";

      const img = document.createElement("img");
      img.draggable = false;

      const handle = document.createElement("span");
      handle.className = "img-resize-handle";
      handle.setAttribute("aria-hidden", "true");
      handle.title =
        "Trage = redimensionează · dublu-click pe figură = mărime originală";

      wrap.append(img, handle);

      // Reflectă atributele nodului pe <img>. Aplicăm inline DOAR lățimea; înălțimea
      // rămâne `auto` (CSS) → proporția se păstrează responsiv (pe mobil `max-width:100%`
      // micșorează lățimea, iar height:auto recalculează înălțimea — fără deformare).
      // Atributul `height` de nod există DOAR pentru export (DOCX/turbodocx cere ambele
      // ca să nu turtească figura); pe ecran nu-l aplicăm inline.
      const applyAttrs = (n: typeof node) => {
        const src = (n.attrs.src as string) || "";
        if (img.getAttribute("src") !== src) img.setAttribute("src", src);
        img.setAttribute("alt", (n.attrs.alt as string) || "");
        const w = n.attrs.width as string | number | null;
        img.style.width = w ? `${parseFloat(String(w))}px` : "";
        img.style.height = "";
      };
      applyAttrs(node);

      // ---- Drag pe handle (aspect blocat) ----
      let startX = 0;
      let startW = 0;
      let ratio = 1; // w/h curent → păstrăm proporția
      let dragging = false;

      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        e.preventDefault();
        const dom = editor.view.dom as HTMLElement;
        const max = contentWidth(dom);
        const w = Math.max(MIN_W, Math.min(max, startW + (e.clientX - startX)));
        // Doar lățimea inline; înălțimea vizibilă vine din height:auto (aspect păstrat).
        img.style.width = `${Math.round(w)}px`;
      };

      const stop = () => {
        if (!dragging) return;
        dragging = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
        const pos = typeof getPos === "function" ? getPos() : null;
        if (pos == null) return;
        const w = Math.round(parseFloat(img.style.width) || startW);
        const h = Math.round(w / ratio); // aspect blocat → înălțimea derivă din lățime
        const tr = editor.view.state.tr.setNodeMarkup(pos, undefined, {
          ...editor.view.state.doc.nodeAt(pos)?.attrs,
          width: w,
          height: h,
        });
        editor.view.dispatch(tr);
      };

      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = img.getBoundingClientRect();
        startX = e.clientX;
        startW = rect.width || MIN_W;
        ratio = rect.height > 0 ? rect.width / rect.height : 1;
        dragging = true;
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
      });

      // Dublu-click pe imagine → revine la mărimea naturală (șterge width/height).
      img.addEventListener("dblclick", (e) => {
        e.preventDefault();
        const pos = typeof getPos === "function" ? getPos() : null;
        if (pos == null) return;
        const attrs = editor.view.state.doc.nodeAt(pos)?.attrs ?? {};
        const tr = editor.view.state.tr.setNodeMarkup(pos, undefined, {
          ...attrs,
          width: null,
          height: null,
        });
        editor.view.dispatch(tr);
      });

      return {
        dom: wrap,
        update: (updatedNode) => {
          if (updatedNode.type.name !== node.type.name) return false;
          applyAttrs(updatedNode);
          return true;
        },
        selectNode: () => wrap.classList.add("is-selected"),
        deselectNode: () => wrap.classList.remove("is-selected"),
        // Handle-ul e UI-ul nostru: nu-l lăsăm pe ProseMirror să-l trateze ca
        // start de node-drag / schimbare de selecție.
        stopEvent: (e: Event) =>
          e.type.startsWith("pointer") && (e.target as Node) === handle,
        // Manipulăm singuri DOM-ul (src/dimensiune) → PM să nu-l reciteasca.
        ignoreMutation: () => true,
      };
    };
  },
}).configure({ allowBase64: true });
