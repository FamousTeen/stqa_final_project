import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-white">Admin Panel</h2>
        <nav className="space-y-2 flex-1">
          <Link href="/admin/concerts" className="block py-2 px-4 hover:bg-gray-800 rounded text-gray-300 hover:text-white">
            Concerts
          </Link>
          <Link href="/admin/orders" className="block py-2 px-4 hover:bg-gray-800 rounded text-gray-300 hover:text-white">
            Orders
          </Link>
          <Link href="/admin/users" className="block py-2 px-4 hover:bg-gray-800 rounded text-gray-300 hover:text-white">
            Users
          </Link>
        </nav>
        <div className="border-t border-gray-800 pt-4">
            <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 bg-black text-white">
        {children}
      </main>
    </div>
  );
}
