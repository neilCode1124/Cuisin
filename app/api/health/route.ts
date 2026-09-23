import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    provider: "deepseek",
    configured: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
  });
}
