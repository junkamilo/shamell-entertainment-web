import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch published blog posts from Prisma DB
  return NextResponse.json({ posts: [], total: 0 }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Create blog post in Prisma DB
    return NextResponse.json(
      { message: "Post created successfully.", data: body },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
}
