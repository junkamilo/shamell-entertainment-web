import { PAY_ROOT_PATH } from "@/lib/pay/payRoutes";

/** Paths where Stripe checkout or payment return UI is shown — hide site chrome (WhatsApp, etc.). */
export function isPaymentFlowRoute(pathname: string): boolean {
  const path = pathname.split("?")[0]?.trim() || "/";

  if (path === PAY_ROOT_PATH || path.startsWith(`${PAY_ROOT_PATH}/`)) return true;

  if (path === "/upcoming-events/return") return true;

  if (/^\/upcoming-events\/[^/]+\/return$/.test(path)) return true;
  if (/^\/upcoming-events\/[^/]+\/classes\/return$/.test(path)) return true;
  if (/^\/upcoming-events\/[^/]+\/classes\/package-return$/.test(path)) return true;
  if (/^\/upcoming-events\/[^/]+\/seats\/return$/.test(path)) return true;

  return false;
}
