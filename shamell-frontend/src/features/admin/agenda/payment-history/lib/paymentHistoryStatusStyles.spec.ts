import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { describe, expect, it } from "vitest";
import { paymentStatusStyles } from "./paymentHistoryStatusStyles";

describe("paymentStatusStyles", () => {
  it("maps each status to icon and badge classes", () => {
    expect(paymentStatusStyles("PAID").Icon).toBe(CheckCircle2);
    expect(paymentStatusStyles("PAID").badgeClass).toContain("emerald");
    expect(paymentStatusStyles("PENDING").Icon).toBe(Clock);
    expect(paymentStatusStyles("PENDING").badgeClass).toContain("gold");
    expect(paymentStatusStyles("EXPIRED").Icon).toBe(Clock);
    expect(paymentStatusStyles("EXPIRED").badgeClass).toContain("amber");
    expect(paymentStatusStyles("CANCELLED").Icon).toBe(XCircle);
    expect(paymentStatusStyles("CANCELLED").badgeClass).toContain("red");
  });
});
