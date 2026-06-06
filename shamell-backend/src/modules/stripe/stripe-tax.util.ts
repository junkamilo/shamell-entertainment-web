import { BadRequestException } from '@nestjs/common';

/** Stripe preset: General - Services (Dashboard tax setup). */
export const STRIPE_SERVICES_TAX_CODE = 'txcd_20030000';

export function stripeAutomaticTaxParams(): { automatic_tax: { enabled: true } } {
  return { automatic_tax: { enabled: true } };
}

export function stripeTaxProductData(args: {
  name: string;
  description?: string;
}): { name: string; description?: string; tax_code: string } {
  return {
    name: args.name,
    ...(args.description ? { description: args.description } : {}),
    tax_code: STRIPE_SERVICES_TAX_CODE,
  };
}

export type StripeCheckoutAmountFields = {
  id?: string;
  amount_total?: number | null;
  amount_subtotal?: number | null;
  currency?: string | null;
};

/**
 * Validates a paid Checkout Session against the catalog subtotal stored in DB.
 * When Stripe Tax applies, amount_subtotal matches DB and amount_total includes tax.
 */
export function assertCheckoutPaidAmounts(
  session: StripeCheckoutAmountFields,
  args: {
    expectedSubtotalCents: number;
    expectedCurrency: string;
    sessionLabel?: string;
  },
): void {
  const label = args.sessionLabel ?? session.id?.trim() ?? 'unknown';
  const expectedSubtotal = args.expectedSubtotalCents;
  const amountTotal = session.amount_total;
  const amountSubtotal = session.amount_subtotal;

  if (typeof amountTotal !== 'number') {
    throw new BadRequestException(`Missing amount_total for session=${label}.`);
  }

  if (typeof amountSubtotal === 'number') {
    if (amountSubtotal !== expectedSubtotal) {
      throw new BadRequestException(
        `Subtotal mismatch for session=${label}. expected=${expectedSubtotal} got=${amountSubtotal}.`,
      );
    }
    if (amountTotal < expectedSubtotal) {
      throw new BadRequestException(
        `Total below subtotal for session=${label}. subtotal=${expectedSubtotal} total=${amountTotal}.`,
      );
    }
  } else if (amountTotal !== expectedSubtotal) {
    throw new BadRequestException(
      `Amount mismatch for session=${label}. expected=${expectedSubtotal} got=${amountTotal}.`,
    );
  }

  const sessionCurrency = session.currency?.toLowerCase();
  const expectedCurrency = args.expectedCurrency.toLowerCase();
  if (!sessionCurrency || sessionCurrency !== expectedCurrency) {
    throw new BadRequestException(
      `Currency mismatch for session=${label}. expected=${expectedCurrency} got=${sessionCurrency ?? 'null'}.`,
    );
  }
}
