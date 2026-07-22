import { fieldLabelClass } from "../../shared/lib/agendaFormStyles";
import { inputClass } from "../../book-class/lib/bookClassDisplay";
import type { BoxOfficePaymentMethod } from "../types/boxOfficeFixed.types";

type Props = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: BoxOfficePaymentMethod;
  cashConfirmed: boolean;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onPaymentMethodChange: (v: BoxOfficePaymentMethod) => void;
  onCashConfirmedChange: (v: boolean) => void;
};

export function BoxOfficeGuestPaymentFields({
  customerName,
  customerEmail,
  customerPhone,
  paymentMethod,
  cashConfirmed,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onPaymentMethodChange,
  onCashConfirmedChange,
}: Props) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className={fieldLabelClass}>FULL NAME</span>
        <input
          value={customerName}
          onChange={(e) => onNameChange(e.target.value)}
          className={inputClass}
          autoComplete="name"
          required
        />
      </label>
      <label className="block">
        <span className={fieldLabelClass}>EMAIL</span>
        <input
          type="email"
          value={customerEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          className={inputClass}
          autoComplete="email"
          required
        />
      </label>
      <label className="block">
        <span className={fieldLabelClass}>PHONE (OPTIONAL)</span>
        <input
          type="tel"
          value={customerPhone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={inputClass}
          autoComplete="tel"
        />
      </label>

      <fieldset className="space-y-2">
        <legend className={fieldLabelClass}>PAYMENT METHOD</legend>
        <label className="flex items-center gap-2 text-sm text-foreground/85">
          <input
            type="radio"
            name="box-office-payment"
            checked={paymentMethod === "stripe"}
            onChange={() => onPaymentMethodChange("stripe")}
          />
          Stripe (email payment link to guest)
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground/85">
          <input
            type="radio"
            name="box-office-payment"
            checked={paymentMethod === "cash"}
            onChange={() => onPaymentMethodChange("cash")}
          />
          Cash (reserve immediately)
        </label>
      </fieldset>

      {paymentMethod === "cash" ? (
        <label className="flex items-start gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            className="mt-1"
            checked={cashConfirmed}
            onChange={(e) => onCashConfirmedChange(e.target.checked)}
          />
          <span>I confirm cash payment was received from the guest.</span>
        </label>
      ) : null}
    </div>
  );
}
