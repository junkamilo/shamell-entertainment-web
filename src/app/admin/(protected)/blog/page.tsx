import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";

export default function AdminBlogPage() {
  return (
    <>
      <AdminHeader title="Blog" />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-foreground/50 text-xs font-body">Manage your journal posts.</p>
          <Link href="/admin/blog/crear" className="btn-outline-gold font-brand text-xs">
            + NEW POST
          </Link>
        </div>
        <div className="border border-gold/10 bg-card p-8 text-center">
          <p className="text-foreground/40 text-xs font-body">
            No posts yet. Connect your database to manage blog content here.
          </p>
        </div>
      </main>
    </>
  );
}
