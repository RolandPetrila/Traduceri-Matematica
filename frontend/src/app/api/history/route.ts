import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/history`);
    if (!res.ok) throw new Error("Failed to fetch history");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ entries: [] });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/history/${id}`, {
      method: "DELETE",
    });
    return NextResponse.json({ ok: res.ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
