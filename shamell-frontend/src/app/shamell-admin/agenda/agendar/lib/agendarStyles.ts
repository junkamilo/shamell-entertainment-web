export const logisticsPickerTriggerClass =
  "shamell-glass-trigger flex min-h-[52px] w-full min-w-0 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-base text-foreground outline-none";

export const fieldLabelClass = "font-brand text-xs tracking-[0.2em] text-gold";

const shamellNativeFieldBase =
  "mt-1 w-full min-h-[44px] rounded-lg border border-gold/20 bg-black/30 px-3 py-2 font-body text-sm text-foreground outline-none transition focus:border-gold/45 focus:ring-1 focus:ring-gold/25 disabled:cursor-not-allowed disabled:opacity-50";

/** Native `<input type="time">` with gold clock icon (admin-theme). */
export const shamellTimeInputClass = `shamell-time-input ${shamellNativeFieldBase}`;

/** Native `<input type="date">` with gold calendar icon (admin-theme). */
export const shamellDateInputClass = `shamell-date-input ${shamellNativeFieldBase}`;

/** Native `<input type="datetime-local">` with gold picker icon (admin-theme). */
export const shamellDateTimeInputClass = `shamell-datetime-input ${shamellNativeFieldBase}`;

export const submitButtonClass =
  "inline-flex min-h-11 w-full max-w-md items-center justify-center rounded-full border border-gold/40 bg-gold/12 px-7 py-3 font-brand text-xs tracking-[0.16em] text-gold transition hover:bg-gold/22 disabled:opacity-50 sm:w-auto";

export const submitButtonClassMobile =
  "inline-flex min-h-12 w-full max-w-md items-center justify-center rounded-full border border-gold/40 bg-gold/12 px-7 py-3.5 font-brand text-sm tracking-[0.14em] text-gold transition hover:bg-gold/22 disabled:opacity-50";

export const AGENDAR_FORM_ID = "shamell-agendar-booking-form";
