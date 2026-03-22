import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Forward to FastAPI backend
    const res = await fetch(`${BACKEND_URL}/api/translate`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 503 }
    );
  }
}
