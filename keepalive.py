"""Keep-alive ping for Render free tier services.
Prevents cold starts by pinging health endpoints every 14 minutes via Render cron job.
"""
import urllib.request
import sys

ENDPOINTS = [
    "https://traduceri-api.onrender.com/api/health",
    "https://traduceri-matematica-7sh7.onrender.com",
]

for url in ENDPOINTS:
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            print(f"[keepalive] OK {resp.status} — {url}")
    except Exception as e:
        # Don't fail the cron job — just log and continue
        print(f"[keepalive] WARN — {url}: {e}")

sys.exit(0)
