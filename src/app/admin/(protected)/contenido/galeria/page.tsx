import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminGaleriaPage() {
  return (
    <>
      <AdminHeader title="Galería" />
      <main className="flex-1 p-8">
        <div className="border border-gold/10 bg-card p-8 text-center">
          <p className="font-brand text-gold text-xs tracking-widest mb-3">GALLERY MANAGER</p>
          <p className="text-foreground/40 text-xs font-body">
            Connect Cloudflare R2 to upload and manage gallery images here.
          </p>
        </div>
      </main>
    </>
  );
}
