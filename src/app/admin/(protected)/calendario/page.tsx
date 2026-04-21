import AdminHeader from "@/components/admin/AdminHeader";

export default function CalendarioPage() {
  return (
    <>
      <AdminHeader title="Calendario" />
      <main className="flex-1 p-8">
        <div className="border border-gold/10 bg-card p-8 text-center">
          <p className="font-brand text-gold text-xs tracking-widest mb-3">AVAILABILITY CALENDAR</p>
          <p className="text-foreground/40 text-xs font-body">
            Connect your calendar service to manage availability here.
          </p>
        </div>
      </main>
    </>
  );
}
