/* signature.js — semnături canonice per tip (dedup exact, §8) + MD5 pur JS.
 *
 * Web Crypto NU oferă MD5 → implementare proprie, ca să reproducem byte-exact
 * `hashlib.md5(...).hexdigest()[:12]` din generatoarele Python.
 *
 * Semnătura Labirint = formatul din generator_labirint.py:
 *   s = "|".join(sorted(f"{min(cell)}-{max(cell)}" for edge in pasaje))
 *   h = md5(s)[:12];  return f"{nivel}|{n}x{n}|{h}"
 * unde fiecare celulă e formatată ca repr-ul Python al tuplului: "(r, c)".
 */
(function (root) {
  "use strict";

  // ---------- MD5 (pe bytes) ----------
  var S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ];
  var K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
    0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
    0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
    0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
    0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
    0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];

  function rotl(x, c) {
    return ((x << c) | (x >>> (32 - c))) >>> 0;
  }

  function md5bytes(bytes) {
    var origLen = bytes.length;
    var bitLenLo = (origLen << 3) >>> 0;
    var bitLenHi = Math.floor(origLen / 0x20000000) >>> 0; // (len*8) >> 32
    // padding
    var withOne = origLen + 1;
    var padLen = (56 - (withOne % 64) + 64) % 64;
    var total = withOne + padLen + 8;
    var msg = new Uint8Array(total);
    msg.set(bytes, 0);
    msg[origLen] = 0x80;
    // length in bits, little-endian 64-bit
    msg[total - 8] = bitLenLo & 0xff;
    msg[total - 7] = (bitLenLo >>> 8) & 0xff;
    msg[total - 6] = (bitLenLo >>> 16) & 0xff;
    msg[total - 5] = (bitLenLo >>> 24) & 0xff;
    msg[total - 4] = bitLenHi & 0xff;
    msg[total - 3] = (bitLenHi >>> 8) & 0xff;
    msg[total - 2] = (bitLenHi >>> 16) & 0xff;
    msg[total - 1] = (bitLenHi >>> 24) & 0xff;

    var a0 = 0x67452301,
      b0 = 0xefcdab89,
      c0 = 0x98badcfe,
      d0 = 0x10325476;
    var Mword = new Uint32Array(16);

    for (var off = 0; off < total; off += 64) {
      for (var i = 0; i < 16; i++) {
        var j = off + i * 4;
        Mword[i] =
          (msg[j] |
            (msg[j + 1] << 8) |
            (msg[j + 2] << 16) |
            (msg[j + 3] << 24)) >>>
          0;
      }
      var A = a0,
        B = b0,
        C = c0,
        D = d0;
      for (var k = 0; k < 64; k++) {
        var F, g;
        if (k < 16) {
          F = (B & C) | (~B & D);
          g = k;
        } else if (k < 32) {
          F = (D & B) | (~D & C);
          g = (5 * k + 1) % 16;
        } else if (k < 48) {
          F = B ^ C ^ D;
          g = (3 * k + 5) % 16;
        } else {
          F = C ^ (B | (~D >>> 0));
          g = (7 * k) % 16;
        }
        F = (F + A + K[k] + Mword[g]) >>> 0;
        A = D;
        D = C;
        C = B;
        B = (B + rotl(F, S[k])) >>> 0;
      }
      a0 = (a0 + A) >>> 0;
      b0 = (b0 + B) >>> 0;
      c0 = (c0 + C) >>> 0;
      d0 = (d0 + D) >>> 0;
    }

    return toHexLE(a0) + toHexLE(b0) + toHexLE(c0) + toHexLE(d0);
  }

  function toHexLE(x) {
    var s = "";
    for (var i = 0; i < 4; i++) {
      var byte = (x >>> (i * 8)) & 0xff;
      s += (byte < 16 ? "0" : "") + byte.toString(16);
    }
    return s;
  }

  var _enc = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
  function md5(str) {
    var bytes = _enc
      ? _enc.encode(str)
      : Uint8Array.from(unescape(encodeURIComponent(str)), function (c) {
          return c.charCodeAt(0);
        });
    return md5bytes(bytes);
  }

  // ---------- semnătură Labirint ----------
  function cellRepr(cell) {
    // repr Python al tuplului (r, c) — cu ", " între componente
    return "(" + cell[0] + ", " + cell[1] + ")";
  }
  function cellCmp(a, b) {
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[1] - b[1];
  }

  /**
   * @param {string} nivel
   * @param {number} rows
   * @param {number} cols
   * @param {Array<[[number,number],[number,number]]>} edges  perechi de celule
   * @param {string} [extra]  suffix ASCII opțional (forma/ieșire non-implicite);
   *   omis => format identic cu fixture-ul Python "nivel|NxN|hash" (3 segmente).
   */
  function labirint(nivel, rows, cols, edges, extra) {
    var parts = edges.map(function (e) {
      var a = e[0],
        b = e[1];
      var lo = cellCmp(a, b) <= 0 ? a : b;
      var hi = cellCmp(a, b) <= 0 ? b : a;
      return cellRepr(lo) + "-" + cellRepr(hi);
    });
    parts.sort(function (x, y) {
      return x < y ? -1 : x > y ? 1 : 0;
    });
    var h = md5(parts.join("|")).slice(0, 12);
    var sig = nivel + "|" + rows + "x" + cols + "|" + h;
    if (extra) sig += "|" + extra;
    return sig;
  }

  root.PlanseSig = { md5: md5, labirint: labirint };
})(typeof window !== "undefined" ? window : globalThis);
