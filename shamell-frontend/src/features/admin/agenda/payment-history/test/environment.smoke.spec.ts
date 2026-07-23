import { describe, expect, it } from "vitest";
import {
  fetchAdminPayments,
  fetchPaymentHistoryBadge,
} from "../services/fetchAdminPayments";
import { fetchAdminPaymentDetail } from "../services/fetchAdminPaymentDetail";
import {
  makePaymentDetail,
  makePaymentRow,
  makePaymentsList,
} from "./fixtures/paymentHistory.fixture";
import { FIXTURE_PAYMENT_ID } from "./fixtures/uuids.fixture";
import { createMockPaymentHistoryPageState } from "./helpers/mockPaymentHistoryPage";

describe("payment-history test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makePaymentRow().id).toBe(FIXTURE_PAYMENT_ID);
    expect(makePaymentDetail().customerPhone).toBe("555-0100");
    expect(makePaymentsList().items).toHaveLength(2);

    const page = createMockPaymentHistoryPageState({ search: "ada" });
    expect(page.search).toBe("ada");
    page.setPage(2);
    expect(page.setPage).toHaveBeenCalledWith(2);
  });

  it("serves payments list and badge via MSW", async () => {
    const list = await fetchAdminPayments("token-1", { page: 1, limit: 20 });
    expect(list.items[0]?.id).toBe(FIXTURE_PAYMENT_ID);

    const badge = await fetchPaymentHistoryBadge("token-1", 1_700_000_000_000);
    expect(badge).toBe(2);

    const detail = await fetchAdminPaymentDetail(
      "token-1",
      "BOOKING_QUOTE",
      FIXTURE_PAYMENT_ID,
    );
    expect(detail.purchaseDetails.flow).toBe("BOOKING_QUOTE");
  });
});
