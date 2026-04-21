import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch bookings from Prisma DB
  return NextResponse.json({ bookings: [], total: 0 }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Create booking in Prisma DB + send confirmation email via Resend
    return NextResponse.json(
      { message: "Booking inquiry received. We will contact you shortly.", data: body },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
  }
}
