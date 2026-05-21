import type { HTMLAttributes } from "react";

type ContactInquiryFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
  min?: number;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  inputClassName?: string;
  labelClassName?: string;
  hintClassName?: string;
};

export default function ContactInquiryField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  hint,
  min,
  inputMode,
  inputClassName,
  labelClassName,
  hintClassName,
}: ContactInquiryFieldProps) {
  return (
    <div>
      <label className="block" htmlFor={name}>
        <span
          className={labelClassName ?? "font-brand text-gold text-sm tracking-[0.14em]"}
        >
          {label}
          {required ? <span className="text-red-300"> *</span> : null}
        </span>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          min={min !== undefined ? min : undefined}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-base text-foreground outline-none focus:border-gold ${inputClassName ?? ""}`}
        />
      </label>
      {hint ? (
        <p
          className={
            hintClassName ?? "mt-1 text-xs text-foreground/45 font-body sm:text-sm"
          }
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
