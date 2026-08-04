import type { ContactInquiryPhaseProps } from "./contactInquiryPhase.types";

export default function ContactInquiryPhaseExpectations(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "expectations") return null;
  const { data, update } = props;
  return (
    <div className="space-y-5">
      <div>
        <label className="block">
          <span className="font-brand text-base tracking-[0.12em] text-gold sm:text-lg sm:tracking-[0.14em]">
            Main description <span className="text-red-300">*</span>
          </span>
          <textarea
            value={data.message}
            onChange={(e) => update("message", e.target.value)}
            rows={6}
            required
            className="mt-2 min-h-[160px] w-full resize-y border border-gold/40 bg-black/30 px-4 py-3.5 font-body text-base leading-relaxed text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-gold sm:min-h-[180px] sm:px-5 sm:py-4 sm:text-lg"
          />
        </label>
        <p className="mt-1 text-right text-sm text-foreground/40 sm:text-base">
          {data.message.length}/4000
        </p>
      </div>
    </div>
  );
}
