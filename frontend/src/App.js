import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import { dashboardMetrics as initialData, getInitialStatusArray } from './dashboardData';
import QualityPage from './pages/Quality';
import SafetyPage from './pages/Safety';
import Health from './pages/Health';
import LoginPage from './pages/LoginPage';
import Delivery from "./pages/Delivery"
import Idea from "./pages/Idea"
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HodDashboard from './pages/HodDashboard';
import ShiftPickerPage from './pages/ShiftPickerPage';
 
const API_BASE_URL = 'http://localhost:5000/api/metrics';

const Dashboard = ({ shift }) => {
  const [metrics, setMetrics] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const defaultMonthArray = getInitialStatusArray();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const url = shift ? `${API_BASE_URL}?shift=${shift}` : API_BASE_URL;
        const response = await fetch(url);
        const dbData = await response.json();
        if (dbData && dbData.length > 0) {
          const merged = initialData.map(blueprint => {
            const liveRecord = dbData.find(d => d.letter === blueprint.letter);
            return liveRecord ? { ...blueprint, ...liveRecord } : blueprint;
          });
          setMetrics(merged);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [shift]);

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-emerald-600 animate-pulse uppercase tracking-widest">Syncing Arcolab Data...</div>;

  return (
    <main className="max-w-[1400px] mx-auto p-6 lg:p-10">
      
      {/* Shift Header */}
      {shift && (
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            Shift {shift} Dashboard
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
            Arcolab Continuous Improvement - Shift {shift}
          </p>
        </div>
      )}

      {/* NEW: HOD Navigation Section */}
    

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {metrics.map((item) => (
          <MetricCard  
            key={item.id} 
            data={item} 
            monthData={item.daysData?.length > 0 ? item.daysData : defaultMonthArray} 
          />
        ))} 
      </div>
    </main>
  );
};

function App() {
const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')));
  useEffect(() => {
    const handleAuth = () => setUser(JSON.parse(localStorage.getItem('userInfo')));
    window.addEventListener('storage', handleAuth);
    window.addEventListener('loginStateChange', handleAuth); 
    return () => {
        window.removeEventListener('storage', handleAuth);
        window.removeEventListener('loginStateChange', handleAuth);
    };
  }, []);

  return (
   <Router>
      <div className="min-h-screen bg-emerald-50/20 font-sans">
        {user && <Navbar user={user} />}
        
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />

          {/* Home Dashboard */}
          <Route path="/" element={!user ? <Navigate to="/login" /> : <Dashboard />} />

          {/* Admin & HOD Panels - Restricted by Role */}
          <Route path="/admin" element={user?.role === 'superadmin' ? <SuperAdminDashboard /> : <Navigate to="/" />} />
          <Route path="/hod-dashboard" element={user?.role === 'hod' ? <HodDashboard /> : <Navigate to="/" />} />

          {/* Shift pickers — clicking Q/D/S/H from home shows shift selector */}
          <Route path="/q" element={user ? <ShiftPickerPage dept="q" /> : <Navigate to="/login" />} />
          <Route path="/d" element={user ? <ShiftPickerPage dept="d" /> : <Navigate to="/login" />} />
          <Route path="/s" element={user ? <ShiftPickerPage dept="s" /> : <Navigate to="/login" />} />
          <Route path="/h" element={user ? <ShiftPickerPage dept="h" /> : <Navigate to="/login" />} />

          {/* Idea — no shifts */}
          <Route path="/i" element={user ? <Idea /> : <Navigate to="/login" />} />

          {/* Shift 1 Routes */}
          <Route path="/shift1" element={user ? <Dashboard shift="1" /> : <Navigate to="/login" />} />
          <Route path="/shift1/q" element={user ? <QualityPage shift="1" /> : <Navigate to="/login" />} />
          <Route path="/shift1/d" element={user ? <Delivery shift="1" /> : <Navigate to="/login" />} />
          <Route path="/shift1/s" element={user ? <SafetyPage shift="1" /> : <Navigate to="/login" />} />
          <Route path="/shift1/h" element={user ? <Health shift="1" /> : <Navigate to="/login" />} />
          <Route path="/shift1/i" element={user ? <Idea shift="1" /> : <Navigate to="/login" />} />

          {/* Shift 2 Routes */}
          <Route path="/shift2" element={user ? <Dashboard shift="2" /> : <Navigate to="/login" />} />
          <Route path="/shift2/q" element={user ? <QualityPage shift="2" /> : <Navigate to="/login" />} />
          <Route path="/shift2/d" element={user ? <Delivery shift="2" /> : <Navigate to="/login" />} />
          <Route path="/shift2/s" element={user ? <SafetyPage shift="2" /> : <Navigate to="/login" />} />
          <Route path="/shift2/h" element={user ? <Health shift="2" /> : <Navigate to="/login" />} />
          <Route path="/shift2/i" element={user ? <Idea shift="2" /> : <Navigate to="/login" />} />

          {/* Shift 3 Routes */}
          <Route path="/shift3" element={user ? <Dashboard shift="3" /> : <Navigate to="/login" />} />
          <Route path="/shift3/q" element={user ? <QualityPage shift="3" /> : <Navigate to="/login" />} />
          <Route path="/shift3/d" element={user ? <Delivery shift="3" /> : <Navigate to="/login" />} />
          <Route path="/shift3/s" element={user ? <SafetyPage shift="3" /> : <Navigate to="/login" />} />
          <Route path="/shift3/h" element={user ? <Health shift="3" /> : <Navigate to="/login" />} />
          <Route path="/shift3/i" element={user ? <Idea shift="3" /> : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

 