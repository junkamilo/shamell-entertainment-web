import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // TODO: Validate credentials against DB (Prisma) and issue JWT
    // Placeholder — replace with real auth logic
    if (email === "admin@shamellentertainment.com" && password === "shamell2025") {
      const response = NextResponse.json({ success: true }, { status: 200 });
      response.cookies.set("admin-token", "placeholder-token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
