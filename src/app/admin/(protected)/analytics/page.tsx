import AdminHeader from "@/components/admin/AdminHeader";

export default function AnalyticsPage() {
  return (
    <>
      <AdminHeader title="Analytics" />
      <main className="flex-1 p-8">
        <div className="border border-gold/10 bg-card p-8 text-center">
          <p className="font-brand text-gold text-xs tracking-widest mb-3">ANALYTICS</p>
          <p className="text-foreground/40 text-xs font-body">
            Connect your analytics service to display performance metrics here.
          </p>
        </div>
      </main>
    </>
  );
}
