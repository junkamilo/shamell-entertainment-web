export function createStripeWebhookAuditServiceMock() {
  return {
    isProcessed: jest.fn().mockResolvedValue(false),
    trackAttempt: jest.fn().mockResolvedValue(undefined),
    markProcessing: jest.fn().mockResolvedValue(undefined),
    markProcessed: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
  };
}

export type StripeWebhookAuditServiceMock = ReturnType<
  typeof createStripeWebhookAuditServiceMock
>;
