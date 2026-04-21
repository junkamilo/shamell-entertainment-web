import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch gallery images from Prisma DB (stored in Cloudflare R2)
  return NextResponse.json({ images: [], total: 0 }, { status: 200 });
}
