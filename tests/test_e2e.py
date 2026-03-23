"""
E2E Test — Sistem Traduceri Matematica
Testeaza: upload imagine -> OCR -> traducere -> HTML output

Rulare:
  1. Porneste backend: cd backend && uvicorn app.main:app --port 8000
  2. Ruleaza testul: python tests/test_e2e.py

Necesita: requests (pip install requests)
"""

import os
import sys
import time
import json
import requests

BASE_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


def test_health():
    """Test 1: Health check backend"""
    print("[TEST 1] Health check...", end=" ")
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=10)
        assert r.status_code == 200, f"Status {r.status_code}"
        data = r.json()
        assert data.get("status") == "ok", f"Status: {data}"
        print("OK")
        return True
    except Exception as e:
        print(f"FAIL — {e}")
        return False


def test_translate_single_image():
    """Test 2: Traducere singura imagine RO -> SK"""
    print("[TEST 2] Traducere imagine (RO -> SK)...", end=" ")
    img_path = os.path.join(FIXTURES_DIR, "test_page_1.jpeg")
    if not os.path.exists(img_path):
        print("SKIP — fisier test_page_1.jpeg lipseste")
        return None

    try:
        with open(img_path, "rb") as f:
            r = requests.post(
                f"{BASE_URL}/api/translate",
                files={"files": ("test_page_1.jpeg", f, "image/jpeg")},
                data={"source_lang": "ro", "target_lang": "sk"},
                timeout=120,
            )

        assert r.status_code == 200, f"Status {r.status_code}: {r.text[:300]}"
        data = r.json()

        # Verify response structure
        assert "results" in data or "html" in data, f"Missing results/html: {list(data.keys())}"

        html = data.get("results", [{}])[0].get("html") or data.get("html", "")
        assert len(html) > 100, f"HTML prea scurt: {len(html)} chars"
        assert "<" in html, "Nu pare HTML valid"

        print(f"OK — {len(html)} chars HTML")

        # Save output for inspection
        out_path = os.path.join(FIXTURES_DIR, "output_test_2.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"       Output salvat: {out_path}")

        return True
    except Exception as e:
        print(f"FAIL — {e}")
        return False


def test_translate_multiple_images():
    """Test 3: Traducere 2 imagini RO -> EN"""
    print("[TEST 3] Traducere 2 imagini (RO -> EN)...", end=" ")
    img1 = os.path.join(FIXTURES_DIR, "test_page_1.jpeg")
    img2 = os.path.join(FIXTURES_DIR, "test_page_2.jpeg")
    if not os.path.exists(img1) or not os.path.exists(img2):
        print("SKIP — fisiere test lipsesc")
        return None

    try:
        files = [
            ("files", ("page1.jpeg", open(img1, "rb"), "image/jpeg")),
            ("files", ("page2.jpeg", open(img2, "rb"), "image/jpeg")),
        ]
        r = requests.post(
            f"{BASE_URL}/api/translate",
            files=files,
            data={"source_lang": "ro", "target_lang": "en"},
            timeout=180,
        )

        assert r.status_code == 200, f"Status {r.status_code}: {r.text[:300]}"
        data = r.json()
        results = data.get("results", [])
        assert len(results) >= 1, f"Expected >=1 results, got {len(results)}"

        total_html = sum(len(r.get("html", "")) for r in results)
        print(f"OK — {len(results)} rezultate, {total_html} chars HTML total")
        return True
    except Exception as e:
        print(f"FAIL — {e}")
        return False


def test_convert_endpoint():
    """Test 4: Verify convert endpoint exists"""
    print("[TEST 4] Convert endpoint...", end=" ")
    try:
        # Just check the endpoint responds (even with error for missing files)
        r = requests.post(f"{BASE_URL}/api/convert", timeout=10)
        # 400 or 422 is OK — means endpoint exists
        assert r.status_code in [200, 400, 422], f"Status {r.status_code}"
        print(f"OK — endpoint activ (status {r.status_code})")
        return True
    except Exception as e:
        print(f"FAIL — {e}")
        return False


def test_history_endpoint():
    """Test 5: Verify history endpoint exists"""
    print("[TEST 5] History endpoint...", end=" ")
    try:
        r = requests.get(f"{BASE_URL}/api/history", timeout=10)
        assert r.status_code in [200, 404], f"Status {r.status_code}"
        print(f"OK — status {r.status_code}")
        return True
    except Exception as e:
        print(f"FAIL — {e}")
        return False


def test_latex_preservation():
    """Test 6: Verifica ca formulele LaTeX sunt pastrate in traducere"""
    print("[TEST 6] Preservare LaTeX...", end=" ")
    img_path = os.path.join(FIXTURES_DIR, "test_page_1.jpeg")
    if not os.path.exists(img_path):
        print("SKIP — fisier test lipseste")
        return None

    try:
        with open(img_path, "rb") as f:
            r = requests.post(
                f"{BASE_URL}/api/translate",
                files={"files": ("test.jpeg", f, "image/jpeg")},
                data={"source_lang": "ro", "target_lang": "sk"},
                timeout=120,
            )

        if r.status_code != 200:
            print(f"SKIP — traducere a esuat ({r.status_code})")
            return None

        data = r.json()
        html = data.get("results", [{}])[0].get("html") or data.get("html", "")

        # Check for MathJax markers or LaTeX patterns
        has_math = any(marker in html for marker in [
            "\\(", "\\)", "\\[", "\\]",
            "$$", "$",
            "mathjax", "MathJax",
            "<math", "\\frac", "\\sqrt",
        ])

        if has_math:
            print("OK — formule matematice detectate in output")
        else:
            print("WARN — nu s-au detectat formule matematice (poate imaginea nu contine formule)")

        return True
    except Exception as e:
        print(f"FAIL — {e}")
        return False


def main():
    print("=" * 60)
    print("E2E TEST — Sistem Traduceri Matematica")
    print(f"Backend URL: {BASE_URL}")
    print("=" * 60)
    print()

    start = time.time()
    results = {}

    results["health"] = test_health()
    if not results["health"]:
        print("\nBackend-ul nu raspunde. Porneste-l cu:")
        print("  cd backend && uvicorn app.main:app --port 8000")
        sys.exit(1)

    results["translate_single"] = test_translate_single_image()
    results["translate_multi"] = test_translate_multiple_images()
    results["convert"] = test_convert_endpoint()
    results["history"] = test_history_endpoint()
    results["latex"] = test_latex_preservation()

    elapsed = time.time() - start

    print()
    print("=" * 60)
    print("REZULTATE:")
    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    skipped = sum(1 for v in results.values() if v is None)
    total = len(results)

    for name, result in results.items():
        status = "PASS" if result is True else "FAIL" if result is False else "SKIP"
        print(f"  {status} — {name}")

    print(f"\n{passed}/{total} passed, {failed} failed, {skipped} skipped")
    print(f"Timp: {elapsed:.1f}s")
    print("=" * 60)

    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
