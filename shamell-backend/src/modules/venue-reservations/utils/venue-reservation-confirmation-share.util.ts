import { createHmac, timingSafeEqual } from 'crypto';

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function signConfirmationShareToken(
  reservationId: string,
  paidAtIso: string,
  secret: string,
): string {
  const payload = `${reservationId}|${paidAtIso}`;
  return `${Buffer.from(payload, 'utf8').toString('base64url')}.${signPayload(payload, secret)}`;
}

export function verifyConfirmationShareToken(
  token: string,
  secret: string,
): { reservationId: string; paidAtIso: string } | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) {
    return null;
  }

  try {
    const payload = Buffer.from(encoded, 'base64url').toString('utf8');
    const expected = signPayload(payload, secret);
    const actualBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (
      actualBuf.length !== expectedBuf.length ||
      !timingSafeEqual(actualBuf, expectedBuf)
    ) {
      return null;
    }

    const [reservationId, paidAtIso] = payload.split('|');
    if (!reservationId || !paidAtIso) {
      return null;
    }

    return { reservationId, paidAtIso };
  } catch {
    return null;
  }
}
