/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Ruta citește configurația Supabase la încărcarea modulului → env ÎNAINTE de import.
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "service-key-test";
process.env.TRADUCERI_DIAG_TOKEN = "cod-de-acces-test";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GET, POST } = require("./route") as typeof import("./route");

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

function getReq(ip: string, token?: string): NextRequest {
  const headers: Record<string, string> = { "x-real-ip": ip };
  if (token !== undefined) headers["x-diag-token"] = token;
  return new NextRequest("http://localhost/api/logs?limit=5", { headers });
}

describe("GET /api/logs — citirea cere cod de acces", () => {
  it("401 fără cod, fără niciun apel la Supabase", async () => {
    const res = await GET(getReq("10.0.0.1"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.logs).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("401 cu cod greșit", async () => {
    const res = await GET(getReq("10.0.0.2", "cod-gresit"));
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("200 cu codul corect → citește din Supabase", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([{ id: "1", level: "error" }]), {
        status: 200,
      }),
    );
    const res = await GET(getReq("10.0.0.3", "cod-de-acces-test"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/rest/v1/logs?");
  });
});

describe("POST /api/logs — numele documentelor nu ajung în Supabase", () => {
  it("elimină titlul/numele de fișier din context înainte de insert", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));
    const payload = {
      level: "action",
      message: "editor:export",
      context: { format: "pdf", name: "Lucrare Popescu Ion", hasTable: true },
    };
    const res = await POST(
      new NextRequest("http://localhost/api/logs", {
        method: "POST",
        headers: { "x-real-ip": "10.0.0.4" },
        body: JSON.stringify(payload),
      }),
    );
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(sent.context).toEqual({ format: "pdf", hasTable: true });
  });
});
