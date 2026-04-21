import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch approved testimonials from Prisma DB
  return NextResponse.json({ testimonials: [], total: 0 }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Save testimonial as pending approval in Prisma DB
    return NextResponse.json(
      { message: "Testimonial submitted for review.", data: body },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to submit testimonial." }, { status: 500 });
  }
}
