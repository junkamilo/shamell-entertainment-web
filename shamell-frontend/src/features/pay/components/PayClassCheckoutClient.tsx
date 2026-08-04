"use client";

import { fetchClassPayCheckoutClientSecret } from "../services/fetchClassPayCheckout";
import { PayTokenCheckoutClient } from "./PayTokenCheckoutClient";

type Props = { token: string };

export function PayClassCheckoutClient({ token }: Props) {
  return (
    <PayTokenCheckoutClient
      token={token}
      ariaLabel="Complete your class payment"
      fetchClientSecret={fetchClassPayCheckoutClientSecret}
    />
  );
}
