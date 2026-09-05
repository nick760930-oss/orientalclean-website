import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import SignOutButton from "@/components/admin/SignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-200 bg-white px-6 py-3">
        <div className="flex flex-wrap gap-4 text-sm font-medium text-brand-700">
          <Link href="/admin">儀表板</Link>
          <Link href="/admin/bookings">預約管理</Link>
          <Link href="/admin/services">服務項目</Link>
          <Link href="/admin/therapists">按摩師 / 包廂</Link>
        </div>
        <div className="flex items-center gap-3 text-sm text-brand-500">
          <span>{session.user?.email}</span>
          <SignOutButton />
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
