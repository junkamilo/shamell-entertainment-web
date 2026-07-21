import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { CreateAdminClassEnrollmentBody } from "../types/bookClass.types";

type Success = {
  ok: true;
  enrollmentId: string;
  message: string;
  payUrl?: string;
};

type Failure = { ok: false; message: string };

async function postAdminClassEnrollment(
  token: string,
  path: "cash" | "checkout-session",
  body: CreateAdminClassEnrollmentBody,
): Promise<Success | Failure> {
  const base = getAdminApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(
      `${base}/api/v1/upcoming-events/admin/class-enrollments/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Request failed.";
    return { ok: false, message: msg };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, message: "Invalid response." };
  }
  const row = data as Record<string, unknown>;
  if (typeof row.enrollmentId !== "string") {
    return { ok: false, message: "Invalid response." };
  }
  return {
    ok: true,
    enrollmentId: row.enrollmentId,
    message: typeof row.message === "string" ? row.message : "Done.",
    payUrl: typeof row.payUrl === "string" ? row.payUrl : undefined,
  };
}

export function createAdminClassCashEnrollment(
  token: string,
  body: CreateAdminClassEnrollmentBody,
) {
  return postAdminClassEnrollment(token, "cash", body);
}

export function createAdminClassCheckoutSession(
  token: string,
  body: CreateAdminClassEnrollmentBody,
) {
  return postAdminClassEnrollment(token, "checkout-session", body);
}
