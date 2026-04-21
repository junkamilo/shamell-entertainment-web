import AdminHeader from "@/components/admin/AdminHeader";

export default function SettingsPage() {
  return (
    <>
      <AdminHeader title="Settings" />
      <main className="flex-1 p-8">
        <div className="border border-gold/10 bg-card p-8 text-center">
          <p className="font-brand text-gold text-xs tracking-widest mb-3">SETTINGS</p>
          <p className="text-foreground/40 text-xs font-body">
            Admin settings and configuration will appear here.
          </p>
        </div>
      </main>
    </>
  );
}
