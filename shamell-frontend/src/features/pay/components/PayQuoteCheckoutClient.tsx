"use client";

import { fetchQuoteCheckoutClientSecret } from "../services/fetchQuoteCheckout";
import { PayTokenCheckoutClient } from "./PayTokenCheckoutClient";

type Props = { token: string };

export function PayQuoteCheckoutClient({ token }: Props) {
  return (
    <PayTokenCheckoutClient
      token={token}
      ariaLabel="Complete your booking payment"
      fetchClientSecret={fetchQuoteCheckoutClientSecret}
    />
  );
}
