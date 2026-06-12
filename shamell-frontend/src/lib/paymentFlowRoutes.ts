/** Paths where Stripe checkout or payment return UI is shown — hide site chrome (WhatsApp, etc.). */
export function isPaymentFlowRoute(pathname: string): boolean {
  const path = pathname.split("?")[0]?.trim() || "/";

  if (path.startsWith("/pay/")) return true;

  if (path === "/on-coming-events/return") return true;

  if (/^\/on-coming-events\/[^/]+\/return$/.test(path)) return true;
  if (/^\/on-coming-events\/[^/]+\/classes\/return$/.test(path)) return true;
  if (/^\/on-coming-events\/[^/]+\/classes\/package-return$/.test(path)) return true;
  if (/^\/on-coming-events\/[^/]+\/seats\/return$/.test(path)) return true;

  return false;
}
