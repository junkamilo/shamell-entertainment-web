import AdminSidebar from "@/components/admin/AdminSidebar";

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
