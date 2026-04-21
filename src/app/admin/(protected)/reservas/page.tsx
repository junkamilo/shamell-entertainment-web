import AdminHeader from "@/components/admin/AdminHeader";

export default function ReservasPage() {
  return (
    <>
      <AdminHeader title="Reservas" />
      <main className="flex-1 p-8">
        <div className="border border-gold/10 bg-card p-8 text-center">
          <p className="font-brand text-gold text-xs tracking-widest mb-3">RESERVAS</p>
          <p className="text-foreground/40 text-xs font-body">
            Connect your database to manage bookings here.
          </p>
        </div>
      </main>
    </>
  );
}
