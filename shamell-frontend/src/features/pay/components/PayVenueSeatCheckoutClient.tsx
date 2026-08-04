"use client";

import { fetchVenueSeatCheckoutClientSecret } from "../services/fetchVenueSeatCheckout";
import { PayTokenCheckoutClient } from "./PayTokenCheckoutClient";

type Props = { token: string };

export function PayVenueSeatCheckoutClient({ token }: Props) {
  return (
    <PayTokenCheckoutClient
      token={token}
      ariaLabel="Complete your seat reservation payment"
      fetchClientSecret={fetchVenueSeatCheckoutClientSecret}
    />
  );
}
