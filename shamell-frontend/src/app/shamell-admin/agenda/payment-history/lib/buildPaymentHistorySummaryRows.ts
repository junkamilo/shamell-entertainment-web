import type { InquiryDetailRow } from "@/components/admin/InquiryDetailsReadable";
import {
  flowLabel,
  formatPaymentAmount,
  formatPaymentDate,
  stageLabel,
  statusLabel,
} from "./paymentHistoryDisplay";
import type {
  AdminPaymentPurchaseDetails,
  AdminStripePaymentDetail,
  AdminStripePaymentRow,
} from "../types/paymentHistory.types";

function pushRow(
  rows: InquiryDetailRow[],
  label: string,
  value: string | null | undefined,
) {
  const v = value?.trim();
  if (v) rows.push({ label, value: v });
}

function formatSessionRange(
  startsAt: string,
  endsAt: string,
  timezone: string,
): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  };
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime())) return startsAt;
  const startStr = start.toLocaleString(undefined, opts);
  if (Number.isNaN(end.getTime())) return startStr;
  const endTime = end.toLocaleTimeString(undefined, {
    timeZone: timezone,
    timeStyle: "short",
  });
  return `${startStr} – ${endTime}`;
}

function purchaseDetailRows(
  detail: AdminPaymentPurchaseDetails | undefined,
): InquiryDetailRow[] {
  if (!detail) return [];
  const rows: InquiryDetailRow[] = [];

  switch (detail.flow) {
    case "BOOKING_QUOTE":
      pushRow(rows, "EVENT TYPE", detail.eventType);
      pushRow(rows, "OCCASION", detail.occasion);
      pushRow(rows, "SERVICES", detail.services);
      if (detail.eventDate) {
        pushRow(rows, "EVENT DATE", formatPaymentDate(detail.eventDate));
      }
      pushRow(rows, "LOCATION", detail.location);
      if (detail.guestCount != null && detail.guestCount > 0) {
        pushRow(rows, "GUESTS", String(detail.guestCount));
      }
      if (detail.quoteTotalAmount != null && detail.quoteTotalAmount > 0) {
        pushRow(rows, "QUOTE TOTAL", `$${detail.quoteTotalAmount.toFixed(2)}`);
      }
      if (detail.quoteDepositAmount != null && detail.quoteDepositAmount > 0) {
        pushRow(rows, "QUOTE DEPOSIT", `$${detail.quoteDepositAmount.toFixed(2)}`);
      }
      if (detail.quoteModel) {
        pushRow(rows, "QUOTE MODEL", detail.quoteModel);
      }
      break;
    case "VENUE_SEAT":
      pushRow(rows, "EVENT", detail.eventName);
      if (detail.eventDate) {
        pushRow(rows, "EVENT DATE", formatPaymentDate(detail.eventDate));
      }
      pushRow(rows, "SEAT TYPE", detail.seatKind === "CHAIR" ? "Chair" : "Table");
      pushRow(rows, "TABLE", detail.tableName);
      break;
    case "CLASS_SESSION":
      pushRow(rows, "CLASS", detail.eventName);
      pushRow(
        rows,
        "SESSION",
        formatSessionRange(
          detail.sessionStartsAt,
          detail.sessionEndsAt,
          detail.sessionTimezone,
        ),
      );
      break;
    case "FIXED_TICKET":
      pushRow(rows, "EVENT", detail.eventName);
      if (detail.eventDate) {
        pushRow(rows, "EVENT DATE", formatPaymentDate(detail.eventDate));
      }
      if (detail.ticketNumber != null) {
        pushRow(rows, "TICKET #", String(detail.ticketNumber));
      }
      break;
  }

  return rows;
}

export function buildCustomerRows(
  row: AdminStripePaymentRow,
  detail?: AdminStripePaymentDetail | null,
): InquiryDetailRow[] {
  const rows: InquiryDetailRow[] = [];
  pushRow(rows, "NAME", row.customerName);
  pushRow(rows, "EMAIL", row.customerEmail);
  if (detail?.customerPhone) {
    pushRow(rows, "PHONE", detail.customerPhone);
  }
  return rows;
}

export function buildPurchaseRows(
  row: AdminStripePaymentRow,
  detail?: AdminStripePaymentDetail | null,
): InquiryDetailRow[] {
  const rows: InquiryDetailRow[] = [];
  pushRow(rows, "FLOW", flowLabel(row.flow));
  pushRow(rows, "CONTEXT", row.contextLabel);
  const extra = purchaseDetailRows(detail?.purchaseDetails);
  for (const r of extra) {
    const exists = rows.some((x) => x.label === r.label);
    if (!exists) rows.push(r);
  }
  return rows;
}

export function buildPaymentRows(row: AdminStripePaymentRow): InquiryDetailRow[] {
  const rows: InquiryDetailRow[] = [];
  pushRow(rows, "AMOUNT", formatPaymentAmount(row.amount, row.currency));
  pushRow(rows, "PAYMENT METHOD", row.paymentMethodLabel ?? undefined);
  pushRow(rows, "STAGE", stageLabel(row.stage));
  pushRow(rows, "STATUS", statusLabel(row.status));
  pushRow(rows, "CREATED", formatPaymentDate(row.createdAt));
  pushRow(rows, "PAID", formatPaymentDate(row.paidAt));
  if (row.status === "PENDING" && row.expiresAt) {
    pushRow(rows, "EXPIRES", formatPaymentDate(row.expiresAt));
  }
  return rows;
}
