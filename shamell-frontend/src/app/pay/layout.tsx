export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-white text-foreground">{children}</div>
  );
}
