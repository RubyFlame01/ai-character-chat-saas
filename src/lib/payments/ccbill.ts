import { createHash, randomUUID } from "node:crypto";
import { env } from "@/lib/config";
import type { PaymentProvider } from "@/lib/payments/types";

// CCBill FlexForms hosted checkout. Adult-friendly processor; no card data
// touches this server. Requires CCBILL_ACCOUNT, CCBILL_SUBACCOUNT,
// CCBILL_FLEXFORM_ID and CCBILL_SALT (the "Dynamic Pricing" salt from the
// CCBill admin). Fulfillment happens in /api/payments/ccbill-webhook.
const FLEXFORM_BASE_URL = "https://api.ccbill.com/wap-frontflex/flexforms";

// Monthly subscription that rebills until cancelled.
const RECURRING_PERIOD_DAYS = 30;
const NUM_REBILLS = 99;

function formatPrice(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}

// Recurring digest per CCBill spec:
// md5(initialPrice + initialPeriod + recurringPrice + recurringPeriod + numRebills + currencyCode + salt)
function formDigest(price: string, currencyCode: string, salt: string) {
  return createHash("md5")
    .update(
      `${price}${RECURRING_PERIOD_DAYS}${price}${RECURRING_PERIOD_DAYS}${NUM_REBILLS}${currencyCode}${salt}`,
    )
    .digest("hex");
}

export const ccbillPaymentProvider: PaymentProvider = {
  name: "ccbill",
  async createCheckout(input) {
    const { ccbillAccount, ccbillSubaccount, ccbillFlexFormId, ccbillSalt, ccbillCurrencyCode } = env;
    if (!ccbillAccount || !ccbillSubaccount || !ccbillFlexFormId || !ccbillSalt) {
      throw new Error("CCBill is not configured. Set CCBILL_ACCOUNT, CCBILL_SUBACCOUNT, CCBILL_FLEXFORM_ID and CCBILL_SALT.");
    }

    const orderId = `ccbill_${input.planId}_${randomUUID()}`;
    const price = formatPrice(input.amountCents);

    const params = new URLSearchParams({
      clientAccnum: ccbillAccount,
      clientSubacc: ccbillSubaccount,
      initialPrice: price,
      initialPeriod: String(RECURRING_PERIOD_DAYS),
      recurringPrice: price,
      recurringPeriod: String(RECURRING_PERIOD_DAYS),
      numRebills: String(NUM_REBILLS),
      currencyCode: ccbillCurrencyCode,
      formDigest: formDigest(price, ccbillCurrencyCode, ccbillSalt),
      // Custom fields are echoed back in webhook events for fulfillment.
      orderId,
      userId: input.userId,
      planId: input.planId,
    });

    return {
      provider: "ccbill",
      orderId,
      checkoutUrl: `${FLEXFORM_BASE_URL}/${ccbillFlexFormId}?${params.toString()}`,
    };
  },
};
