import { UserCircle } from 'lucide-react';

const Navbar = () => (
  <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold">L</div>
      <span className="text-xl font-bold text-slate-800">QDSHI Tracker (Arcolab)</span>
    </div>
    <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition">
      <UserCircle size={20} />
      <span className="font-medium">Login</span>
    </button>
  </nav>
);

export default Navbar;