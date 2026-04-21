import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // TODO: Implement admin user registration with Prisma
  return NextResponse.json(
    { error: "Registration is not open. Contact the system administrator." },
    { status: 403 }
  );
}
