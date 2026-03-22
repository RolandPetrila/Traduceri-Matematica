import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const res = await fetch(`${BACKEND_URL}/api/convert`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error }, { status: res.status });
    }

    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": res.headers.get("Content-Disposition") || "attachment",
      },
    });
  } catch (error) {
    console.error("Conversion API error:", error);
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 503 }
    );
  }
}
