export function buildFixedTicketConfirmationSubject(eventName: string): string {
  return `Ticket confirmed — ${eventName}`;
}

export function buildFixedTicketConfirmationText(input: {
  eventName: string;
  customerName: string;
  ticketNumber: number;
  eventDateLabel: string;
  amount: string;
}): string {
  return [
    `Hello ${input.customerName},`,
    '',
    `Your ticket purchase for ${input.eventName} was successful.`,
    `Your ticket number: #${input.ticketNumber}`,
    `Event: ${input.eventDateLabel}`,
    `Amount paid: ${input.amount}`,
    '',
    'Thank you,',
    'Shamell Entertainment',
  ].join('\n');
}

export function buildFixedTicketConfirmationHtml(input: {
  eventName: string;
  customerName: string;
  ticketNumber: number;
  eventDateLabel: string;
  amount: string;
}): string {
  const name = escapeHtml(input.customerName);
  const event = escapeHtml(input.eventName);
  const eventDate = escapeHtml(input.eventDateLabel);
  const amount = escapeHtml(input.amount);
  const ticket = escapeHtml(String(input.ticketNumber));
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#0a0908;color:#f5e6b8;padding:24px">
<p>Hello ${name},</p>
<p>Your ticket purchase for <strong>${event}</strong> was successful.</p>
<p><strong>Your ticket number:</strong> #${ticket}<br/><strong>Event:</strong> ${eventDate}<br/><strong>Amount paid:</strong> ${amount}</p>
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
