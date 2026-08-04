import Link from "next/link";

export type AppStatusScreenProps = {
  title: string;
  message: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function AppStatusScreen({
  title,
  message,
  primaryAction,
  secondaryHref = "/",
  secondaryLabel = "Home",
}: AppStatusScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <h1 className="font-display text-2xl text-gold">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-foreground/70">{message}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {primaryAction ? (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="rounded-lg border border-gold/35 px-5 py-2.5 font-brand text-xs tracking-[0.14em] text-gold uppercase hover:bg-gold/10"
          >
            {primaryAction.label}
          </button>
        ) : null}
        <Link
          href={secondaryHref}
          className="rounded-lg border border-gold/20 px-5 py-2.5 font-brand text-xs tracking-[0.14em] text-foreground/75 uppercase hover:text-gold"
        >
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
