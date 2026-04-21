import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin-token");

  if (!token) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // TODO: Verify JWT and return user data from DB
  return NextResponse.json(
    { user: { email: "admin@shamellentertainment.com", role: "admin" } },
    { status: 200 }
  );
}
