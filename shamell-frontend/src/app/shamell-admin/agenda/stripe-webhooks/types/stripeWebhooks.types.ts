export type AdminWebhookStatus =
  | "RECEIVED"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED";

export type AdminStripeWebhookEventRow = {
  id: string;
  eventId: string;
  eventType: string;
  livemode: boolean;
  status: AdminWebhookStatus;
  metadataFlow: string | null;
  checkoutSessionId: string | null;
  handler: string | null;
  payloadSummary: Record<string, unknown> | null;
  processedAt: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminStripeWebhookEventsQuery = {
  page?: number;
  limit?: number;
  eventType?: string;
  metadataFlow?: string;
  checkoutSessionId?: string;
  status?: AdminWebhookStatus;
  processed?: boolean;
};

export type AdminStripeWebhookEventsListResponse = {
  items: AdminStripeWebhookEventRow[];
  meta: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
};
