"""HTML builder for A4 printable documents with MathJax support."""

import re

__all__ = ["build_html", "build_html_structured"]


def _md_to_html_body(md: str) -> str:
    """Convert markdown to HTML body content. Preserves SVG/div/LaTeX as-is."""
    # Step 0: Safety net — demote construction step headings to paragraphs
    # Catches ALL formats: # P₁:, ## P₃:, ### $P_1$:, # P4:, etc.
    md = re.sub(
        r"^#{1,6}\s*((?:\$?P[_₁₂₃₄₅₆₇₈₉\d]+\$?|P\s*[₁₂₃₄₅₆₇₈₉])\s*[:.]?\s*.+)$",
        r"\1",
        md,
        flags=re.MULTILINE,
    )

    # Step 1: Protect SVG and HTML div blocks from paragraph wrapping
    svg_blocks: dict[str, str] = {}
    svg_counter = [0]

    def _protect_svg(m: re.Match) -> str:
        key = f"__SVG_BLOCK_{svg_counter[0]}__"
        svg_blocks[key] = m.group(0)
        svg_counter[0] += 1
        return f"\n{key}\n"

    html = re.sub(r"<div[^>]*>[\s\S]*?</div>", _protect_svg, md)
    html = re.sub(r"<svg[\s\S]*?</svg>", _protect_svg, html)

    # Step 2: Headings
    for i in range(6, 0, -1):
        html = re.sub(rf"^{'#' * i}\s+(.+)$", rf"<h{i}>\1</h{i}>", html, flags=re.MULTILINE)

    # Step 3: Inline formatting
    html = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", html)
    html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"(?<![\\])\*(.+?)\*", r"<em>\1</em>", html)

    # Step 4: Horizontal rules
    html = re.sub(r"^---+$", r"<hr>", html, flags=re.MULTILINE)

    # Step 5: Unordered lists (- item)
    html = re.sub(r"^- (.+)$", r"<li>\1</li>", html, flags=re.MULTILINE)
    html = re.sub(r"((?:<li>.*</li>\n?)+)", lambda m: "<ul>" + m.group(1) + "</ul>", html)

    # Step 6: Ordered lists (1. item) — wrap in <ol>
    html = re.sub(r"^\d+\.\s+(.+)$", r"<oli>\1</oli>", html, flags=re.MULTILINE)
    html = re.sub(r"((?:<oli>.*</oli>\n?)+)", lambda m: "<ol>" + m.group(1).replace("<oli>", "<li>").replace("</oli>", "</li>") + "</ol>", html)

    # Step 7: Letter options (a) b) c) d)) — keep as lines with break
    html = re.sub(r"^([a-z]\))\s+(.+)$", r"\1 \2<br>", html, flags=re.MULTILINE)

    # Step 8: Wrap remaining text in paragraphs (skip blocks)
    lines = html.split("\n\n")
    result_parts = []
    block_tags = ("<h", "<ul", "<ol", "<li", "<hr", "<div", "<svg", "<table", "__SVG_BLOCK_")
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if any(stripped.startswith(tag) for tag in block_tags):
            result_parts.append(stripped)
        else:
            result_parts.append(f"<p>{stripped}</p>")
    html = "\n".join(result_parts)

    # Step 9: Clean up
    html = html.replace("<p></p>", "")
    html = re.sub(r"\n{3,}", "\n\n", html)

    # Step 10: Restore SVG blocks
    for key, block in svg_blocks.items():
        html = html.replace(key, block)
        html = html.replace(f"<p>{key}</p>", block)

    # Step 11: Fix invalid nesting — extract <ol>/<ul> from inside <p> tags
    html = re.sub(r"<p>(.*?)<ol>", r"<p>\1</p>\n<ol>", html)
    html = re.sub(r"</ol></p>", r"</ol>", html)
    html = re.sub(r"<p>(.*?)<ul>", r"<p>\1</p>\n<ul>", html)
    html = re.sub(r"</ul></p>", r"</ul>", html)
    html = html.replace("<p></p>", "")

    return html


def build_html_structured(pages_data: list[dict], figures: list[dict[int, str]], target_lang: str) -> str:
    """Build HTML from structured OCR data + cropped figures.

    Args:
        pages_data: list of OCR structured JSON per page
        figures: list of {section_index: base64_png} per page
        target_lang: language code for html lang attribute
    """
    page_sections = []
    for page_idx, (page, figs) in enumerate(zip(pages_data, figures)):
        skip_next = False
        parts = []
        sections = page.get("sections", [])
        parts.append(f'<div class="source-file">Pagina {page_idx + 1}</div>')

        title = page.get("title", "")
        if title:
            parts.append(f"<h1>{title}</h1>")

        for sec_idx, section in enumerate(page.get("sections", [])):
            sec_type = section.get("type", "paragraph")
            content = section.get("content", "")

            # Safety net: demote heading to step if it contains P₁-P₉ pattern
            if sec_type == "heading" and re.search(
                r"(?:\$?P[_₁₂₃₄₅₆₇₈₉\d]+\$?|P\s*[₁₂₃₄₅₆₇₈₉])\s*[:.]\s*", content
            ):
                sec_type = "step"

            if sec_type == "heading":
                level = section.get("level", 2)
                parts.append(f"<h{level}>{content}</h{level}>")
            elif sec_type == "step":
                parts.append(f"<p>{content}</p>")
            elif sec_type == "observation":
                parts.append(f"<p><strong>{content}</strong></p>")
            elif sec_type == "list":
                # Content may have numbered items
                items = [line.strip() for line in content.split("\n") if line.strip()]
                if items:
                    parts.append("<ol>")
                    for item in items:
                        # Strip leading number/dot
                        import re as _re
                        clean = _re.sub(r"^\d+\.\s*", "", item)
                        parts.append(f"<li>{clean}</li>")
                    parts.append("</ol>")
            elif sec_type == "figure":
                # Insert cropped figure as <img> if available
                b64 = figs.get(sec_idx, "")
                caption = section.get("caption", "")
                if b64:
                    # Check if next section is also a figure (paired: P1+P2 side by side)
                    next_idx = sec_idx + 1
                    next_sec = sections[next_idx] if next_idx < len(sections) else None
                    next_is_figure = next_sec and next_sec.get("type") == "figure"
                    next_b64 = figs.get(next_idx, "") if next_is_figure else ""

                    if next_b64 and not skip_next:
                        # Render paired figures side by side
                        next_caption = next_sec.get("caption", "") if next_sec else ""
                        parts.append(
                            f'<div style="display:flex;justify-content:center;gap:12px;margin:10px 0">'
                            f'<div style="text-align:center">'
                            f'<img src="data:image/png;base64,{b64}" '
                            f'alt="{caption or "Figura"}" '
                            f'style="max-width:48%;height:auto;background:#fff;border:1px solid #eee;" />'
                            f'{"<p><em>" + caption + "</em></p>" if caption else ""}'
                            f'</div>'
                            f'<div style="text-align:center">'
                            f'<img src="data:image/png;base64,{next_b64}" '
                            f'alt="{next_caption or "Figura"}" '
                            f'style="max-width:48%;height:auto;background:#fff;border:1px solid #eee;" />'
                            f'{"<p><em>" + next_caption + "</em></p>" if next_caption else ""}'
                            f'</div>'
                            f'</div>'
                        )
                        skip_next = True
                    elif skip_next:
                        # This figure was already rendered as part of a pair
                        skip_next = False
                    else:
                        # Single figure
                        parts.append(
                            f'<div style="display:flex;justify-content:center;margin:8px 0">'
                            f'<img src="data:image/png;base64,{b64}" '
                            f'alt="{caption or "Figura"}" '
                            f'style="max-width:90%;height:auto;background:#fff;border:1px solid #eee;" />'
                            f'</div>'
                            f'{"<p style=\"text-align:center\"><em>" + caption + "</em></p>" if caption else ""}'
                        )
                else:
                    desc = section.get("caption", section.get("description", ""))
                    parts.append(f'<p><em>[Figura: {desc or "indisponibila"}]</em></p>')
            else:
                # paragraph or unknown
                if content:
                    parts.append(f"<p>{content}</p>")

        body = "\n".join(parts)
        page_sections.append(
            f'<section class="paper"><div class="paper-content">{body}</div></section>'
        )

    pages_html = "\n".join(page_sections)
    n = len(pages_data)
    return _build_html_shell(pages_html, n, target_lang)


def _build_html_shell(pages_html: str, page_count: int, target_lang: str) -> str:
    """Shared HTML shell (CSS + JS + MathJax) used by both build functions."""
    return f'''<!doctype html>
<html lang="{target_lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Traducere Matematica</title>
  <style>
    :root {{
      --text-color: #1b1b1b; --paper-bg: #ffffff; --font-size: 12pt;
      --line-height: 1.45; --page-width: 210mm; --page-height: 297mm;
      --page-padding-x: 12mm; --page-padding-y: 12mm;
    }}
    @page {{ size: A4; margin: 0; }}
    * {{ box-sizing: border-box; }}
    body {{ margin:0; padding:0; color:var(--text-color); background:#f2f2f2;
      font-family:"Cambria","Times New Roman",serif; font-size:var(--font-size); line-height:var(--line-height); }}
    .toolbar {{ position:sticky; top:0; z-index:100; display:flex; gap:12px; align-items:center;
      justify-content:space-between; padding:10px 14px; background:#192031; color:#fff;
      font-family:"Segoe UI",Arial,sans-serif; font-size:13px; }}
    .toolbar button {{ border:0; border-radius:6px; padding:8px 12px; background:#dce8ff;
      color:#121212; cursor:pointer; font-weight:600; }}
    main {{ max-width:calc(var(--page-width) + 24px); margin:18px auto; padding:0 12px 24px; }}
    .paper {{ --fit-scale:1; width:var(--page-width); height:var(--page-height); margin:0 auto 16px;
      padding:var(--page-padding-y) var(--page-padding-x); background:var(--paper-bg);
      box-shadow:0 2px 14px rgba(0,0,0,.12); overflow:hidden; }}
    .paper-content {{ width:calc((var(--page-width) - 2*var(--page-padding-x))/var(--fit-scale));
      transform:scale(var(--fit-scale)); transform-origin:top left; overflow-wrap:break-word; }}
    .source-file {{ margin:0 0 14px; color:#4a4a4a; font-family:"Segoe UI",Arial,sans-serif;
      font-size:10.5pt; font-weight:600; }}
    h1,h2,h3,h4 {{ margin-top:1.1em; margin-bottom:.42em; line-height:1.22; page-break-after:avoid; }}
    p,li {{ page-break-inside:avoid; }}
    hr {{ border:none; border-top:1px solid #cfcfcf; margin:1em 0; }}
    ul, ol {{ margin-top:0.45em; margin-bottom:0.6em; }}
    li {{ margin-bottom:0.2em; }}
    img {{ max-width:100%; height:auto; }}
    svg {{ max-width:100%; height:auto; display:block; margin:0.8em auto; }}
    .MathJax {{ font-size:1em !important; }}
    @media print {{
      body {{ background:#fff; }} .toolbar {{ display:none !important; }}
      main {{ max-width:none; margin:0; padding:0; }}
      .paper {{ margin:0; box-shadow:none; break-after:page; page-break-after:always; }}
      .paper:last-child {{ break-after:auto; page-break-after:auto; }}
    }}
  </style>
  <script>
    window.MathJax = {{
      tex: {{ inlineMath: [['$','$'],['\\\\(','\\\\)']], displayMath: [['$$','$$'],['\\\\[','\\\\]']] }},
      svg: {{ fontCache: 'global' }}
    }};
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
  <script>
    function fitPaperSections() {{
      document.querySelectorAll('.paper').forEach(function(page) {{
        var c = page.querySelector('.paper-content');
        if (!c) return;
        page.style.setProperty('--fit-scale', '1');
        var s = window.getComputedStyle(page);
        var avail = page.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
        var need = c.scrollHeight;
        var scale = need > 0 ? Math.min(1, avail / need) : 1;
        page.style.setProperty('--fit-scale', scale.toFixed(4));
      }});
    }}
    window.addEventListener('load', function() {{
      var p = window.MathJax && window.MathJax.startup ? window.MathJax.startup.promise : Promise.resolve();
      p.then(function() {{ fitPaperSections(); setTimeout(fitPaperSections, 150); }})
       .catch(function() {{ fitPaperSections(); }});
    }});
    window.addEventListener('resize', fitPaperSections);
    window.addEventListener('beforeprint', fitPaperSections);
  </script>
</head>
<body>
  <div class="toolbar">
    <div>Traducere matematica — {page_count} pagina(e) | Print: Scale 100%, Margins None</div>
    <button onclick="window.print()">Tipareste</button>
  </div>
  <main>
{pages_html}
  </main>
</body>
</html>'''


def build_html(pages: list[str], target_lang: str) -> str:
    """Build professional A4 HTML from markdown pages (legacy pipeline)."""
    page_sections = []
    for i, md in enumerate(pages):
        body = _md_to_html_body(md)
        page_sections.append(
            f'<section class="paper"><div class="paper-content">'
            f'<div class="source-file">Pagina {i + 1}</div>'
            f'{body}'
            f'</div></section>'
        )
    pages_html = "\n".join(page_sections)
    n = len(pages)
    return _build_html_shell(pages_html, n, target_lang)
