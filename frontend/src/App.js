import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import CircularTracker from './components/CircularTracker';
import QualityPage from './pages/Quality'; 
import SafetyPage from './pages/Safety'; 
import Health from './pages/Health'; 
import LoginPage from './pages/LoginPage';
import Delivery from './pages/Delivery';
import Idea from './pages/Idea';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HodDashboard from './pages/HodDashboard';
import ShiftPickerPage from './pages/ShiftPickerPage';
import EHS from './pages/EHS';
import Engineering from './pages/Engineering';
import HR from './pages/HR';
import ArcolabLogo from './assest/arcolabLogo.jpg';

import { DEPARTMENTS, MODULES, SPECIAL_DEPARTMENTS, ALL_DEPARTMENTS } from './departments';
export { DEPARTMENTS, MODULES, SPECIAL_DEPARTMENTS, ALL_DEPARTMENTS };

const DEPT_BG = {
  emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-200',  // FGMW
  indigo: 'from-indigo-500 to-indigo-700 shadow-indigo-200',     // PMW
  purple: 'from-purple-500 to-purple-700 shadow-purple-200',     // RMW
  amber: 'from-amber-500 to-amber-700 shadow-amber-200',         // PPP
  pink: 'from-pink-500 to-pink-700 shadow-pink-200',             // POP
  teal: 'from-teal-500 to-teal-700 shadow-teal-200',             // QCMAD
  yellow: 'from-yellow-400 to-yellow-600 shadow-yellow-200',     // PRO
  red: 'from-red-500 to-red-700 shadow-red-200',                 // SPP
  cyan: 'from-cyan-500 to-cyan-700 shadow-cyan-200',             // FAC
  lime: 'from-lime-500 to-lime-700 shadow-lime-200',             // EHS
  sky: 'from-sky-500 to-sky-700 shadow-sky-200',                 // Engineering
  orange: 'from-orange-500 to-orange-700 shadow-orange-200',     // HR
};


const VALID_DEPTS = [
  'fgmw',
  'pmw',
  'rmw',
  'ppp',
  'pop',
  'qcmad',
  'pro',
  'spp',
  'fac'
];
const VALID_MODULES = ['q', 'd', 's', 'h'];

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Featured Ideation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/i')}
          className="md:col-span-2 cursor-pointer relative overflow-hidden bg-slate-900 rounded-3xl p-8 text-white group"
        >
          <div className="relative z-10">
            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-white/10">
              New Update
            </span>
            <h2 className="text-3xl font-black mt-4 mb-2 tracking-tight">Ideation Hub</h2>
            <p className="text-slate-400 max-w-xs text-sm leading-relaxed">
              Drive excellence by sharing your innovative ideas for continuous improvement.
            </p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:opacity-20 transition-opacity">
             <span className="text-[12rem] font-black italic uppercase">I</span>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm font-bold group-hover:gap-4 transition-all">
            Start Suggesting <span className="text-xl">→</span>
          </div>
        </motion.div>

        {/* Brand & Overview Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
           <img 
            src={ArcolabLogo} 
            alt="Arcolab Logo" 
            className="w-20 h-20 object-contain rounded-2xl mb-4 shadow-md border border-slate-50"
           />
           <h3 className="text-slate-900 font-bold text-lg">System Overview</h3>
           <p className="text-slate-500 text-[10px] uppercase tracking-[0.15em] font-bold mt-1">Warehouse Portal</p>
           
           <div className="mt-6 flex gap-2">
              {['Q','D','S','H'].map(l => (
                <div key={l} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
                  {l}
                </div>
              ))}
           </div>
        </div>

        {/* Department Cards */}
        {DEPARTMENTS.map((dept, i) => (
          <motion.div
            key={dept.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            onClick={() => navigate(`/${dept.key}`)}
            className={`cursor-pointer bg-gradient-to-br ${DEPT_BG[dept.color]} rounded-3xl p-7 text-white shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden`}
          >
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <span className="text-xl font-black">{dept.short}</span>
                </div>
                <h2 className="text-xl font-black leading-tight uppercase">{dept.name}</h2>
                <p className="text-white/70 text-xs mt-2 font-medium">{dept.desc}</p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-black/10 px-2 py-1 rounded">Explore</span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
                  →
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          </motion.div>
        ))}

        {/* Separator */}
        <div className="col-span-full flex items-center gap-4 mt-2">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Additional Departments</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* EHS / Engineering / HR Cards */}
        {SPECIAL_DEPARTMENTS.map((dept, i) => (
          <motion.div
            key={dept.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (DEPARTMENTS.length + i) * 0.05 }}
            whileHover={{ y: -5 }}
            onClick={() => navigate(dept.path)}
            className={`cursor-pointer bg-gradient-to-br ${DEPT_BG[dept.color]} rounded-3xl p-7 text-white shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden`}
          >
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <span className="text-sm font-black">{dept.short}</span>
                </div>
                <h2 className="text-xl font-black leading-tight uppercase">{dept.name}</h2>
                <p className="text-white/70 text-xs mt-2 font-medium">{dept.desc}</p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-black/10 px-2 py-1 rounded">Open</span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
                  →
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          </motion.div>
        ))}
      </div>
    </main>
  );
};

// ─────────────────────────────────────────────
// DEPT PAGE
// ─────────────────────────────────────────────
const DeptPage = () => {
  const { dept } = useParams();
  const navigate = useNavigate();
  const deptInfo = DEPARTMENTS.find(d => d.key === dept) || { name: dept?.toUpperCase(), short: dept?.toUpperCase(), color: 'slate' };
  const gradBg = DEPT_BG[deptInfo.color] || 'from-slate-700 to-slate-900';

  const [trackerSize, setTrackerSize] = useState(window.innerWidth < 640 ? 150 : 200);

  useEffect(() => {
    const handleResize = () => setTrackerSize(window.innerWidth < 640 ? 150 : 200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const emptyDays = Array(30).fill('none');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header with Floating Logo */}
      <div className={`bg-gradient-to-b ${gradBg} pt-20 pb-32 px-6 relative overflow-hidden`}>
        
        {/* Semi-transparent watermark logo */}
        <img 
          src={ArcolabLogo} 
          alt="" 
          className="absolute top-10 right-10 w-42 h-42 object-contain opacity-10 grayscale brightness-200 pointer-events-none"
        />

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <button 
            onClick={() => navigate('/')}
            className="mb-6 px-4 py-1.5 bg-white/10 hover:bg-white/20 transition-colors rounded-full text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-4">
            {deptInfo.name}
          </h1>
          <p className="text-white/60 text-sm font-medium max-w-md mx-auto">
            Daily operational performance and safety metrics.
          </p>
        </motion.div>
      </div>

      {/* Trackers Section */}
      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {MODULES.map((mod, i) => (
            <motion.div
              key={mod.key}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              onClick={() => navigate(`/${dept}/${mod.key}`)}
              className="group cursor-pointer"
            >
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col items-center">
                <div className="relative group-hover:scale-105 transition-transform duration-500">
                  <CircularTracker letter={mod.letter} daysData={emptyDays} size={trackerSize} />
                </div>
                <div className="mt-8 text-center w-full">
                  <span className={`text-xs font-black uppercase tracking-widest ${mod.text}`}>
                    {mod.label} Module
                  </span>
                  <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full group-hover:bg-slate-900 group-hover:text-white transition-all">
                    CONFIGURE SHIFT <span>→</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Route Helpers
const DeptRoute = ({ user }) => {
  const { dept } = useParams();
  if (!user) return <Navigate to="/login" />;
  if (!VALID_DEPTS.includes(dept)) return <Navigate to="/" />;
  return <DeptPage />;
};

const ShiftPickerRoute = ({ user }) => {
  const { dept, module } = useParams();
  if (!user) return <Navigate to="/login" />;
  if (!VALID_DEPTS.includes(dept) || !VALID_MODULES.includes(module)) return <Navigate to="/" />;
  return <ShiftPickerPage dept={dept} module={module} />;
};

const ModuleRoute = ({ user }) => {
  const { shift, dept, module } = useParams();
  if (!user) return <Navigate to="/login" />;
  if (!['1','2','3'].includes(shift) || !VALID_DEPTS.includes(dept) || !VALID_MODULES.includes(module)) {
    return <Navigate to="/" />;
  }
  if (module === 'q') return <QualityPage />;
  if (module === 'd') return <Delivery />;
  if (module === 's') return <SafetyPage />;
  if (module === 'h') return <Health />;
  return <Navigate to="/" />;      
}; 

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')));

  useEffect(() => {
    const sync = () => setUser(JSON.parse(localStorage.getItem('userInfo')));
    window.addEventListener('storage', sync);
    window.addEventListener('loginStateChange', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('loginStateChange', sync);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
        {user && <Navbar />}
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/" element={!user ? <Navigate to="/login" /> : <Dashboard />} />
          <Route path="/admin" element={user?.role === 'superadmin' ? <SuperAdminDashboard /> : <Navigate to="/" />} />
          <Route path="/hod-dashboard" element={user?.role === 'hod' ? <HodDashboard /> : <Navigate to="/" />} />
          <Route path="/i" element={user ? <Idea /> : <Navigate to="/login" />} />
          <Route path="/ehs" element={user ? <EHS /> : <Navigate to="/login" />} />
          <Route path="/engineering" element={user ? <Engineering /> : <Navigate to="/login" />} />
          <Route path="/hr" element={user ? <HR /> : <Navigate to="/login" />} />
          <Route path="/:dept" element={<DeptRoute user={user} />} />
          <Route path="/:dept/:module" element={<ShiftPickerRoute user={user} />} />
          <Route path="/shift/:shift/:dept/:module" element={<ModuleRoute user={user} />} />
          <Route path="*" element={<Navigate to={user ? '/' : '/login'} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;