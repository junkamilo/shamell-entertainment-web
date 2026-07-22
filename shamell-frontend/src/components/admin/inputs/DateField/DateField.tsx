"use client";

export type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function DateField({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: DateFieldProps) {
  return (
    <label className="block">
      <span className="font-brand text-[10px] tracking-widest text-gold/70">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-gold/20 bg-black/25 px-3 py-2 text-sm text-foreground outline-none focus:border-gold/40 disabled:opacity-50"
      />
    </label>
  );
}
