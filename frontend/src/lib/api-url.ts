/**
 * Python API base URL — calls backend directly (bypasses Next.js proxy 30s timeout).
 * Set NEXT_PUBLIC_API_URL on Render; empty string = same-origin (local dev with proxy).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
