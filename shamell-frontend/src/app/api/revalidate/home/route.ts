import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (secret) {
    const authHeader = request.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    const headerSecret = request.headers.get("x-revalidate-secret");
    if (bearer !== secret && headerSecret !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  revalidatePath("/");
  revalidateTag("home-above-fold", "max");

  return NextResponse.json({ ok: true, revalidated: true, now: Date.now() });
}
