import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Return available dates from DB/calendar
  return NextResponse.json({ available: [], blocked: [] }, { status: 200 });
}
