"use client";

import { BackButton, ModuleHero } from "@/components/admin/layout";
import { Pagination } from "@/components/admin/data-display";
import { AGENDA_HUB_PATH } from "../../lib/agendaRoutes";
import { useStripeWebhooksPage } from "../hooks/useStripeWebhooksPage";
import type { AdminWebhookStatus } from "../types/stripeWebhooks.types";

const STATUS_OPTIONS: AdminWebhookStatus[] = [
  "RECEIVED",
  "PROCESSING",
  "PROCESSED",
  "FAILED",
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function statusBadgeClass(status: AdminWebhookStatus): string {
  if (status === "PROCESSED") return "bg-emerald-500/20 text-emerald-200";
  if (status === "FAILED") return "bg-red-500/20 text-red-200";
  if (status === "PROCESSING") return "bg-amber-500/20 text-amber-200";
  return "bg-foreground/10 text-foreground/70";
}

export default function StripeWebhooksPageContent() {
  const page = useStripeWebhooksPage();

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <BackButton href={AGENDA_HUB_PATH} label="Back" className="mb-4" />
      <ModuleHero
        title="Stripe webhooks"
        subtitle="Audit log for Stripe webhook deliveries: status, handler, retries, and errors."
        bordered={false}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-foreground/60">
          Flow
          <input
            type="text"
            value={page.flowFilter}
            onChange={(e) => page.setFlowFilter(e.target.value)}
            placeholder="e.g. class_session"
            className="rounded border border-foreground/15 bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-foreground/60">
          Status
          <select
            value={page.statusFilter}
            onChange={(e) => {
              page.setStatusFilter(e.target.value as AdminWebhookStatus | "");
              page.setFailedOnly(false);
              page.setPage(1);
            }}
            className="rounded border border-foreground/15 bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-1 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={page.failedOnly}
            onChange={(e) => {
              page.setFailedOnly(e.target.checked);
              if (e.target.checked) page.setStatusFilter("");
              page.setPage(1);
            }}
          />
          Failed only
        </label>
        <button
          type="button"
          onClick={() => void page.reload()}
          className="rounded border border-foreground/20 px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5"
        >
          Refresh
        </button>
      </div>

      {page.error ? (
        <p className="text-sm text-red-300">{page.error}</p>
      ) : page.isLoading ? (
        <p className="text-sm text-foreground/55">Loading webhook events…</p>
      ) : page.items.length === 0 ? (
        <p className="text-sm text-foreground/55">No webhook events found.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-foreground/15 text-xs uppercase tracking-wide text-foreground/50">
                  <th className="px-2 py-2">Received</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Flow</th>
                  <th className="px-2 py-2">Handler</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Attempts</th>
                  <th className="px-2 py-2">Checkout session</th>
                  <th className="px-2 py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-foreground/10 align-top hover:bg-foreground/[0.03]"
                  >
                    <td className="px-2 py-2 whitespace-nowrap text-foreground/70">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">{row.eventType}</td>
                    <td className="px-2 py-2">{row.metadataFlow ?? "—"}</td>
                    <td className="px-2 py-2">{row.handler ?? "—"}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-2 py-2">{row.attempts}</td>
                    <td className="max-w-[140px] truncate px-2 py-2 font-mono text-xs">
                      {row.checkoutSessionId ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-2 py-2 text-red-300">
                      {row.lastError ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-3 md:hidden">
            {page.items.map((row) => (
              <article
                key={row.id}
                className="rounded-lg border border-foreground/15 p-3 text-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                  >
                    {row.status}
                  </span>
                  <span className="text-xs text-foreground/50">
                    {formatDate(row.createdAt)}
                  </span>
                </div>
                <p className="font-mono text-xs">{row.eventType}</p>
                <p className="text-foreground/70">
                  {row.metadataFlow ?? "—"} · {row.handler ?? "—"} · attempts{" "}
                  {row.attempts}
                </p>
                {row.checkoutSessionId ? (
                  <p className="truncate font-mono text-xs text-foreground/60">
                    {row.checkoutSessionId}
                  </p>
                ) : null}
                {row.lastError ? (
                  <p className="mt-1 text-xs text-red-300">{row.lastError}</p>
                ) : null}
              </article>
            ))}
          </div>

          <Pagination
            className="mt-6"
            meta={{
              page: page.meta.page,
              perPage: page.perPage,
              totalItems: page.meta.totalItems,
              totalPages: page.meta.totalPages,
              hasPrev: page.meta.hasPrev,
              hasNext: page.meta.hasNext,
            }}
            onPageChange={page.setPage}
            onPerPageChange={page.setPerPage}
          />
        </>
      )}
    </div>
  );
}
