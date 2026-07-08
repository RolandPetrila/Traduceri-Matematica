// jsdom lacks two Web APIs that translation-cache relies on:
//   1. SubtleCrypto (crypto.subtle.digest) for SHA-256 content-hash keys
//   2. Blob/File.arrayBuffer() (jsdom's Blob is a stub without it)
// Bridge in Node's implementations so the same production code runs under test.
// Real browsers provide both natively — this only affects the test environment.

const { webcrypto } = require("crypto");
const nodeBuffer = require("buffer");

if (globalThis.crypto && !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis.crypto, "subtle", {
    value: webcrypto.subtle,
    configurable: true,
  });
} else if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}

// Node's Blob/File implement arrayBuffer()/slice(); jsdom's do not.
if (nodeBuffer.Blob) globalThis.Blob = nodeBuffer.Blob;
if (nodeBuffer.File) globalThis.File = nodeBuffer.File;
