"""Pytest config for the serverless API test suite.

Puts the ``api/`` directory on sys.path so tests can ``from lib.X import ...``,
matching the handlers' own ``from lib.X import`` fallback import style.
These tests cover PURE functions only — no network, no API keys, deterministic.
"""

import os
import sys

_API_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _API_DIR not in sys.path:
    sys.path.insert(0, _API_DIR)
