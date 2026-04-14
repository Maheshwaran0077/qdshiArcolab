import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { UserCircle, LogOut, LayoutDashboard, Settings2, ChevronDown } from 'lucide-react';
import logo from '../assest/arcolabLogo.jpg';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showShiftMenu, setShowShiftMenu] = useState(false);
  
  // 1. Get the user data from localStorage
  const user = JSON.parse(localStorage.getItem('userInfo'));

  // Determine current shift from URL
  const getCurrentShift = () => {
    if (location.pathname.startsWith('/shift1')) return '1';
    if (location.pathname.startsWith('/shift2')) return '2';
    if (location.pathname.startsWith('/shift3')) return '3';
    return null;
  };

  const currentShift = getCurrentShift();

  const handleLogout = () => {
    // 2. Clear local storage and redirect to login
    localStorage.removeItem('userInfo');
    // Trigger a storage event so App.js knows we logged out
    window.dispatchEvent(new Event("storage"));
    navigate('/login');
  };

  const navigateToShift = (shift) => {
    const currentPath = location.pathname;
    let newPath;
    if (shift === 'main') {
      newPath = currentPath.replace(/^\/shift[123]/, '') || '/';
    } else if (currentPath.startsWith('/shift')) {
      newPath = currentPath.replace(/^\/shift[123]/, `/shift${shift}`);
    } else {
      newPath = `/shift${shift}${currentPath === '/' ? '' : currentPath}`;
    }
    navigate(newPath);
    setShowShiftMenu(false);
  };

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <img src={logo} alt="Arcolab Logo" className="h-12 w-auto" />
          <span className="text-xl font-bold text-slate-800">QDSHI Tracker (Arcolab)</span>
        </Link>

        {/* Shift Selector */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowShiftMenu(!showShiftMenu)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-bold text-sm transition uppercase tracking-tighter"
            >
              {currentShift ? `Shift ${currentShift}` : 'Main Dashboard'}
              <ChevronDown size={16} />
            </button>

            {showShiftMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[140px]">
                <button
                  onClick={() => navigateToShift('main')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 first:rounded-t-lg transition"
                >
                  Main Dashboard
                </button>
                <button
                  onClick={() => navigateToShift('1')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 transition"
                >
                  Shift 1
                </button>
                <button
                  onClick={() => navigateToShift('2')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 transition"
                >
                  Shift 2
                </button>
                <button
                  onClick={() => navigateToShift('3')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 last:rounded-b-lg transition"
                >
                  Shift 3
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* 3. Show Admin Panel ONLY for Super Admin */}
            {user.role === 'superadmin' && (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition uppercase tracking-tighter"
              >
                <LayoutDashboard size={18} />
                Admin Panel
              </Link>
            )}

            {/* NEW: Show Manage Supervisors ONLY for HOD */}
            {user.role === 'hod' && (
              <Link 
                to="/hod-dashboard" 
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-bold text-sm transition uppercase tracking-tighter"
              >
                <Settings2 size={18} />
                Manage Supervisors
              </Link>
            )}

            {/* 4. Show User Name and Logout button */}
            <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
                <p className="text-sm font-black text-slate-800">{user.name}</p>
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-full transition font-bold text-sm"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </>
        ) : (
          /* 5. Show Login if no user is found */
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition"
          >
            <UserCircle size={20} />
            <span className="font-medium">Login</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;