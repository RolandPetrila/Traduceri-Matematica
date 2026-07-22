/**
 * Python API base URL — calls the backend (traduceri-api) directly.
 * Set NEXT_PUBLIC_API_URL in the Vercel project env; empty string = same-origin
 * (local dev, where next.config.js rewrites /api/* to the local dev_server).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
