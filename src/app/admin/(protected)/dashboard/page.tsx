import AdminHeader from "@/components/admin/AdminHeader";
import DashboardStats from "@/components/admin/DashboardStats";
import OrnamentDivider from "@/components/public/OrnamentDivider";

export default function DashboardPage() {
  return (
    <>
      <AdminHeader title="Dashboard" />
      <main className="flex-1 p-8">
        <DashboardStats />
        <OrnamentDivider className="my-10" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gold/10 p-6 bg-card">
            <h3 className="font-brand text-gold text-xs tracking-[0.2em] mb-4">
              RECENT BOOKINGS
            </h3>
            <p className="text-foreground/40 text-xs font-body">
              No recent bookings. Connect your database to display live data.
            </p>
          </div>
          <div className="border border-gold/10 p-6 bg-card">
            <h3 className="font-brand text-gold text-xs tracking-[0.2em] mb-4">
              UPCOMING EVENTS
            </h3>
            <p className="text-foreground/40 text-xs font-body">
              No upcoming events. Connect your calendar to display live data.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
