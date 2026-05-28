export function buildClassEnrollmentConfirmationSubject(eventName: string): string {
  return `Class confirmed — ${eventName}`;
}

export function buildClassEnrollmentConfirmationText(input: {
  eventName: string;
  customerName: string;
  sessionLabel: string;
  amount: string;
}): string {
  return [
    `Hello ${input.customerName},`,
    '',
    `Your class spot is confirmed for ${input.eventName}.`,
    `Session: ${input.sessionLabel}`,
    `Amount paid: ${input.amount}`,
    '',
    'Thank you,',
    'Shamell Entertainment',
  ].join('\n');
}

export function buildClassEnrollmentConfirmationHtml(input: {
  eventName: string;
  customerName: string;
  sessionLabel: string;
  amount: string;
}): string {
  const name = escapeHtml(input.customerName);
  const event = escapeHtml(input.eventName);
  const session = escapeHtml(input.sessionLabel);
  const amount = escapeHtml(input.amount);
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#0a0908;color:#f5e6b8;padding:24px">
<p>Hello ${name},</p>
<p>Your class spot is confirmed for <strong>${event}</strong>.</p>
<p><strong>Session:</strong> ${session}<br/><strong>Amount paid:</strong> ${amount}</p>
<p>Thank you,<br/>Shamell Entertainment</p>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
