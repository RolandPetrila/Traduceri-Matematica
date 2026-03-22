import re
import markdown

from app.config import MATHJAX_SRC

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sistem Traduceri — Rezultat</title>
<script>
window.MathJax = {{
  tex: {{ inlineMath: [['$','$'], ['\\\\(','\\\\)']], displayMath: [['$$','$$'], ['\\\\[','\\\\]']] }},
  svg: {{ fontCache: 'global' }}
}};
</script>
<script src="{mathjax_src}" async></script>
<style>
  @page {{ size: A4; margin: 18mm 15mm 22mm 15mm; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font: 12pt/1.55 'Cambria', 'Cambria Math', Georgia, serif; color: #222; }}

  .page {{
    width: 210mm; min-height: 277mm; margin: 0 auto;
    padding: 18mm 15mm 22mm 15mm; position: relative;
    page-break-after: always; background: #fff;
  }}
  @media screen {{ .page {{ border: 1px solid #ccc; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }} }}
  @media print {{ .page {{ padding: 0; border: none; box-shadow: none; }} }}

  h1 {{ font-size: 16pt; margin: 0 0 8pt; color: #1a3a5c; border-bottom: 2px solid #1a3a5c; padding-bottom: 4pt; }}
  h2 {{ font-size: 13pt; margin: 12pt 0 6pt; color: #2d5a27; }}
  p {{ margin: 4pt 0; text-align: justify; }}
  ol, ul {{ margin: 4pt 0 4pt 24pt; }}
  strong {{ color: #333; }}

  .page-number {{
    position: absolute; bottom: 10mm; left: 0; right: 0;
    text-align: center; font-size: 10pt; color: #888;
  }}

  svg {{ max-width: 100%; height: auto; }}
  div[style*="display:flex"] {{ margin: 8pt 0; }}
</style>
</head>
<body>
{pages}
<script>
document.addEventListener('DOMContentLoaded', function() {{
  document.querySelectorAll('.page').forEach(function(page) {{
    var content = page.querySelector('.page-content');
    if (!content) return;
    var maxH = page.clientHeight - 40;
    if (content.scrollHeight > maxH) {{
      var scale = maxH / content.scrollHeight;
      content.style.transform = 'scale(' + scale + ')';
      content.style.transformOrigin = 'top left';
      content.style.width = (100 / scale) + '%';
    }}
  }});
}});
</script>
</body>
</html>"""

PAGE_TEMPLATE = """<section class="page">
  <div class="page-content">
{content}
  </div>
  <div class="page-number">{page_num}</div>
</section>"""

# LaTeX protection for markdown processing
MATH_RE = re.compile(r"(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)")


def _protect_math(text: str) -> tuple[str, dict[str, str]]:
    placeholders: dict[str, str] = {}

    def _replace(m: re.Match) -> str:
        key = f"@@MATH_TOKEN_{len(placeholders)}@@"
        placeholders[key] = m.group(0)
        return key

    return MATH_RE.sub(_replace, text), placeholders


def _restore_math(html: str, placeholders: dict[str, str]) -> str:
    for key, val in placeholders.items():
        html = html.replace(key, val)
    return html


def _md_to_html(md_text: str) -> str:
    protected, placeholders = _protect_math(md_text)
    html = markdown.markdown(protected, extensions=["extra", "sane_lists"], output_format="html5")
    return _restore_math(html, placeholders)


def build_html_a4(pages_md: list[str], lang: str = "sk") -> str:
    """Build printable A4 HTML from list of markdown pages."""
    page_sections = []

    for i, md_text in enumerate(pages_md, 1):
        html_content = _md_to_html(md_text)
        page_sections.append(
            PAGE_TEMPLATE.format(content=html_content, page_num=i)
        )

    return HTML_TEMPLATE.format(
        lang=lang,
        mathjax_src=MATHJAX_SRC,
        pages="\n".join(page_sections),
    )
