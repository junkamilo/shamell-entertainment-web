import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Aggregate real stats from Prisma DB
  return NextResponse.json(
    {
      stats: {
        activeBookings: 0,
        pendingTestimonials: 0,
        galleryImages: 0,
        blogPosts: 0,
      },
    },
    { status: 200 }
  );
}
