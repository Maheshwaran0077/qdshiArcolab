import { UserCircle } from 'lucide-react';
import logo from '../assest/arcolabLogo.jpg';
const Navbar = () => (
  <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b">
    <div className="flex items-center gap-2">
  <img src={logo} alt="Arcolab Logo" className="h-12 w-auto" />
       <span className="text-xl font-bold text-slate-800">QDSHI Tracker (Arcolab)</span>
    </div>
    <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition">
      <UserCircle size={20} />
      <span className="font-medium">Login</span>
    </button>
  </nav>
);

export default Navbar;