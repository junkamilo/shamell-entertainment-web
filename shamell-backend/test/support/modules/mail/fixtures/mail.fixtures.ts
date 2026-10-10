export function makeTransactionalPayload(
  overrides: Partial<{
    to: string;
    toName: string;
    subject: string;
    html: string;
    text: string;
  }> = {},
) {
  return {
    to: 'guest@example.com',
    toName: 'Guest',
    subject: 'Test subject',
    html: '<p>Hello</p>',
    text: 'Hello',
    ...overrides,
  };
}
