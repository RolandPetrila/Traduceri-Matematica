/* prng.js — MT19937 + shim Python `random` (ORACOL, §7 Stratul 2).
 *
 * Replică EXACT `random.Random(seed)` din CPython → „același seed → același
 * rezultat" byte-cu-byte JS vs Python. Infra PARTAJATĂ de toate generatoarele.
 *
 * Acoperă: seeding pe int (init_by_array cu cuvinte 32-bit little-endian, ca
 * CPython _random.random_seed), genrand_uint32, getrandbits, _randbelow,
 * randrange, randint, choice, shuffle, random.
 *
 * `sample()` NU e portat încă (algoritm cu euristică selecție/pool, ușor de
 * greșit byte-exact) — aruncă explicit; se adaugă când un generator îl cere.
 *
 * Multiplicările pe 32 de biți folosesc Math.imul (JS `*` pierde precizie peste
 * 2^53). Toate stările sunt Uint32 (>>>0).
 */
(function (root) {
  "use strict";

  var N = 624,
    M = 397,
    MATRIX_A = 0x9908b0df,
    UPPER_MASK = 0x80000000,
    LOWER_MASK = 0x7fffffff;

  function bitLength(n) {
    // număr de biți ai unui întreg ne-negativ (Python int.bit_length)
    var b = 0;
    while (n > 0) {
      n = Math.floor(n / 2);
      b++;
    }
    return b;
  }

  // Cuvintele 32-bit little-endian ale lui abs(seed) — ca _PyLong_AsByteArray
  // little-endian în random_seed. Folosește BigInt pentru corectitudine peste 2^53.
  function seedToKey(seed) {
    var n = BigInt(Math.trunc(Math.abs(seed)));
    if (n === 0n) return [0];
    var key = [];
    var mask = 0xffffffffn;
    while (n > 0n) {
      key.push(Number(n & mask) >>> 0);
      n >>= 32n;
    }
    return key;
  }

  function PyRandom(seed) {
    this.mt = new Uint32Array(N);
    this.mti = N + 1;
    this.seed(seed == null ? 0 : seed);
  }

  PyRandom.prototype.init_genrand = function (s) {
    var mt = this.mt;
    mt[0] = s >>> 0;
    for (var i = 1; i < N; i++) {
      var prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      // 1812433253 * prev + i  (mod 2^32)
      mt[i] = (Math.imul(1812433253, prev) + i) >>> 0;
    }
    this.mti = N;
  };

  PyRandom.prototype.init_by_array = function (key) {
    this.init_genrand(19650218);
    var mt = this.mt;
    var i = 1,
      j = 0;
    var k = N > key.length ? N : key.length;
    for (; k; k--) {
      var p = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (((mt[i] ^ Math.imul(p, 1664525)) >>> 0) + key[j] + j) >>> 0;
      i++;
      j++;
      if (i >= N) {
        mt[0] = mt[N - 1];
        i = 1;
      }
      if (j >= key.length) j = 0;
    }
    for (k = N - 1; k; k--) {
      var p2 = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (((mt[i] ^ Math.imul(p2, 1566083941)) >>> 0) - i) >>> 0;
      i++;
      if (i >= N) {
        mt[0] = mt[N - 1];
        i = 1;
      }
    }
    mt[0] = 0x80000000;
  };

  PyRandom.prototype.seed = function (s) {
    this.init_by_array(seedToKey(s));
  };

  PyRandom.prototype.genrand_uint32 = function () {
    var mt = this.mt;
    var y;
    var mag01 = [0x0, MATRIX_A];
    if (this.mti >= N) {
      var kk;
      for (kk = 0; kk < N - M; kk++) {
        y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK);
        mt[kk] = (mt[kk + M] ^ (y >>> 1) ^ mag01[y & 0x1]) >>> 0;
      }
      for (; kk < N - 1; kk++) {
        y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK);
        mt[kk] = (mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 0x1]) >>> 0;
      }
      y = (mt[N - 1] & UPPER_MASK) | (mt[0] & LOWER_MASK);
      mt[N - 1] = (mt[M - 1] ^ (y >>> 1) ^ mag01[y & 0x1]) >>> 0;
      this.mti = 0;
    }
    y = mt[this.mti++];
    y ^= y >>> 11;
    y = (y ^ ((y << 7) & 0x9d2c5680)) >>> 0;
    y = (y ^ ((y << 15) & 0xefc60000)) >>> 0;
    y ^= y >>> 18;
    return y >>> 0;
  };

  // getrandbits(k) pentru 1 <= k <= 32 (suficient pentru generatoarele curente).
  PyRandom.prototype.getrandbits = function (k) {
    if (k <= 0 || k > 32)
      throw new Error("getrandbits: k trebuie 1..32 (portat), primit " + k);
    return this.genrand_uint32() >>> (32 - k);
  };

  // _randbelow_with_getrandbits (CPython) — consumă biți identic, inclusiv n==1.
  PyRandom.prototype._randbelow = function (n) {
    if (!n) return 0;
    var k = bitLength(n);
    var r = this.getrandbits(k);
    while (r >= n) r = this.getrandbits(k);
    return r;
  };

  // randrange(stop) sau randrange(start, stop) cu step=1 (formele folosite azi).
  PyRandom.prototype.randrange = function (start, stop) {
    if (stop === undefined) {
      if (start <= 0) throw new Error("randrange(stop): stop trebuie > 0");
      return this._randbelow(start);
    }
    var width = stop - start;
    if (width <= 0) throw new Error("randrange: interval gol");
    return start + this._randbelow(width);
  };

  PyRandom.prototype.randint = function (a, b) {
    return a + this._randbelow(b - a + 1);
  };

  PyRandom.prototype.choice = function (seq) {
    return seq[this._randbelow(seq.length)];
  };

  // shuffle in-place — Fisher-Yates ca CPython (reversed range, _randbelow(i+1)).
  PyRandom.prototype.shuffle = function (x) {
    for (var i = x.length - 1; i > 0; i--) {
      var j = this._randbelow(i + 1);
      var t = x[i];
      x[i] = x[j];
      x[j] = t;
    }
    return x;
  };

  PyRandom.prototype.random = function () {
    var a = this.genrand_uint32() >>> 5;
    var b = this.genrand_uint32() >>> 6;
    return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
  };

  PyRandom.prototype.sample = function () {
    throw new Error(
      "PyRandom.sample: neportat încă — adaugă când un generator îl cere",
    );
  };

  root.PlansePRNG = {
    PyRandom: PyRandom,
    bitLength: bitLength,
    seedToKey: seedToKey,
  };
})(typeof window !== "undefined" ? window : globalThis);
