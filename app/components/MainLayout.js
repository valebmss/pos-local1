// components/MainLayout.js
import Link from 'next/link';
import { useUser } from '@/context/UserContext';

export default function MainLayout({ children }) {
  const { user } = useUser();

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-8">Dashboard</h2>
        <nav className="flex flex-col space-y-4">
          <Link href="/ventas" className="hover:bg-gray-700 p-3 rounded transition">Ventas</Link>
          <Link href="/inventario" className="hover:bg-gray-700 p-3 rounded transition">Inventario</Link>
          <Link href="/provedores" className="hover:bg-gray-700 p-3 rounded transition">Proveedores</Link>
          <Link href="/reports" className="hover:bg-gray-700 p-3 rounded transition">Reportes</Link>
          <Link href="/logout" className="hover:bg-red-700 p-3 rounded transition">Cerrar sesión</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            Bienvenido, {user?.nombre || "Usuario"}
          </h1>
          <span className="text-gray-600">ID de usuario: {user?.usuario_id || "N/A"}</span>
        </header>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
