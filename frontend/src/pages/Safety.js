import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Star, Maximize2, X, ShieldAlert, AlertTriangle 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import CircularTracker from '../components/CircularTracker';
import { dashboardMetrics as initialData } from '../dashboardData'; 

const API_BASE_URL = 'http://localhost:5000/api/metrics';

const SafetyPage = ({ shift }) => {
  const navigate = useNavigate();
  
  // --- STRICT PERMISSION LOGIC ---
  const user = JSON.parse(localStorage.getItem('userInfo'));
  const isSupervisor = user?.role === 'supervisor';
  
  // Clean up department string for comparison
  const userDept = user?.department?.toUpperCase() || "";
  
  // Only allow if user is Supervisor AND department is SAFETY or S
  const isSafetySupervisor = isSupervisor && (userDept.includes('SAFETY') || userDept === 'S');
  
  // HODs can view but not update; only the Safety Supervisor sees the button
  const canUpdate = isSafetySupervisor;

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentName, setIncidentName] = useState("No Incident");
  const [peopleAffected, setPeopleAffected] = useState(0);
  const [severity, setSeverity] = useState("Low");

  const [viewDate, setViewDate] = useState(new Date()); 
  const viewMonthName = viewDate.toLocaleString('default', { month: 'long' }).toUpperCase();
  const viewYear = viewDate.getFullYear();

  const handleMonthChange = (offset) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const url = `${API_BASE_URL}?shift=${shift || '1'}`;
        const response = await fetch(url);
        const dbData = await response.json();
        if (dbData?.length > 0) {
          const merged = initialData.map(blueprint => {
            const live = dbData.find(d => d.letter === blueprint.letter);
            return live ? { ...blueprint, ...live } : blueprint;
          });
          setMetrics(merged);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchMetrics();
  }, [shift]);

  const sData = useMemo(() => {
    const found = metrics.find(m => m.letter === 'S') || initialData[2];
    let logs = found?.issueLogs || [];
    if (!Array.isArray(logs)) logs = Object.values(logs);
    return { ...found, issueLogs: logs };
  }, [metrics]);

  const filteredLogs = useMemo(() => {
    return sData.issueLogs.filter(l => {
      if (!l.rawDate) return false;
      const d = new Date(l.rawDate);
      return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewYear;
    }).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
  }, [sData.issueLogs, viewDate, viewYear]);

  const yearlyStats = useMemo(() => {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return months.map((month, index) => {
      const monthLogs = sData.issueLogs.filter(l => {
        const d = new Date(l.rawDate);
        return d.getMonth() === index && d.getFullYear() === viewYear;
      });
      return {
        name: month,
        incidents: monthLogs.filter(l => l.incident !== "No Incident").length,
        success: monthLogs.filter(l => l.incident === "No Incident").length
      };
    });
  }, [sData.issueLogs, viewYear]);

  const daysInViewMonth = useMemo(() => 
    new Date(viewYear, viewDate.getMonth() + 1, 0).getDate(), 
  [viewDate, viewYear]);

  const dynamicDaysData = useMemo(() => {
    const baseDays = Array(daysInViewMonth).fill("none");
    filteredLogs.forEach(log => {
      const d = new Date(log.rawDate);
      const idx = d.getDate() - 1;
      if (idx >= 0 && idx < baseDays.length) {
        baseDays[idx] = log.incident === "No Incident" ? "success" : "fail";
      }
    });
    return baseDays;
  }, [filteredLogs, daysInViewMonth]);

  const stats = useMemo(() => ({
    incidents: dynamicDaysData.filter(s => s === "fail").length,
    success: dynamicDaysData.filter(s => s === "success").length,
    totalAffected: filteredLogs.reduce((sum, curr) => sum + (Number(curr.affected) || 0), 0),
    highSeverity: filteredLogs.filter(l => l.severity === 'High' && l.incident !== "No Incident").length,
    midSeverity: filteredLogs.filter(l => l.severity === 'Medium' && l.incident !== "No Incident").length
  }), [dynamicDaysData, filteredLogs]);

  const handleUpdateSafety = async () => {
    // Double check permission before API call
    if (!canUpdate) return; 

    let updatedLogs = [...sData.issueLogs];
    const [y, m, d] = customDate.split('-');
    const newEntry = { 
      date: `${d}/${m}/${y}`, 
      rawDate: customDate, 
      incident: incidentName,
      affected: Number(peopleAffected),
      severity: incidentName === "No Incident" ? "None" : severity
    };

    const idx = updatedLogs.findIndex(log => log.rawDate === customDate);
    if (idx !== -1) updatedLogs[idx] = newEntry; else updatedLogs.push(newEntry);

    try {
      const res = await fetch(`${API_BASE_URL}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter: 'S', shift: shift || '1', name: 'Safety', issueLogs: updatedLogs })
      });
      if (res.ok) {
        const saved = await res.json();
        setMetrics(prev => prev.map(m => m.letter === 'S' ? saved : m));
        setIsModalOpen(false);
      }
    } catch (e) { alert("Sync failed."); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white text-orange-600 font-black uppercase tracking-widest italic">Arcolab Safety Sync...</div>;

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F0F4F8] text-[#334155] font-sans flex flex-col p-4">
       <nav className="flex justify-between items-center mb-4 px-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-[#475569] font-bold text-xs uppercase hover:text-orange-600 transition-all">
          <ChevronLeft size={20} /> BACK TO DASHBOARD
        </button>
        
        {/* ONLY SHOW UPDATE BUTTON IF IT IS THE SAFETY SUPERVISOR */}
        {canUpdate && (
          <button onClick={() => setIsModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95">
            UPDATE {viewMonthName} SAFETY LOGS
          </button>
        )}
      </nav>

      {/* Shift Header */}
      {shift && (
        <div className="px-4 mb-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              Safety — Shift {shift}
            </h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
              Arcolab Continuous Improvement System
            </p>
          </div>
        </div>
      )}

      {/* ... (rest of your layout code remains the same) ... */}
      <main className="grid grid-cols-12 gap-5 flex-1 px-4 pb-4 lg:overflow-hidden">
        {/* Left Panel */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col items-center">
          <div className="text-center mb-6">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Department</span>
            <h1 className="text-3xl font-black text-[#1E293B] uppercase tracking-tighter">Safety</h1>
          </div>

          <div className="flex items-center justify-between w-full mb-8 bg-[#FFF7ED] px-4 py-2 rounded-full border border-orange-100">
            <button onClick={() => handleMonthChange(-1)} className="text-orange-500 hover:scale-110 transition"><ChevronLeft size={20}/></button>
            <span className="text-[11px] font-black text-orange-600 tracking-widest">{viewMonthName} {viewYear}</span>
            <button onClick={() => handleMonthChange(1)} className="text-orange-500 hover:scale-110 transition"><ChevronRight size={20}/></button>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <CircularTracker letter="S" daysData={dynamicDaysData} size={240} />
          </div>

          <div className="w-full space-y-3 mt-8">
            <StatRow label="Incidents" value={stats.incidents} color="bg-red-50 text-red-600 border-red-100" />
            <StatRow label="Safe Days" value={stats.success} color="bg-emerald-50 text-emerald-600 border-emerald-100" />
            <StatRow label="Affected" value={stats.totalAffected} color="bg-slate-50 text-slate-500 border-slate-100" />
          </div>
        </div>

        {/* Center Panel */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-5 lg:overflow-hidden">
          <ChartCard title={`${viewMonthName} LOG RECORDS`}>
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
              <table className="w-full text-[11px] border-separate border-spacing-0">
                <thead className="bg-[#F8FAFC] sticky top-0 z-10 border-b">
                  <tr>
                    <th className="p-3 text-left font-black text-slate-400">DATE</th>
                    <th className="p-3 text-left font-black text-slate-400">INCIDENT TYPE</th>
                    <th className="p-3 text-center font-black text-slate-400">AFFECTED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-500">{log.date}</td>
                      <td className={`p-3 font-black uppercase flex items-center gap-2 ${log.incident === 'No Incident' ? 'text-emerald-500' : 'text-red-600'}`}>
                        {log.incident === 'No Incident' ? <ShieldAlert size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-red-500" />} 
                        {log.incident}
                      </td>
                      <td className="p-3 text-center font-black text-slate-600">
                        {log.incident === 'No Incident' ? '--' : log.affected || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title={`${viewYear} YEARLY PERFORMANCE`}>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-center border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-slate-400 font-black uppercase">
                    <th className="text-left px-2">MONTH</th>
                    {yearlyStats.map(m => <th key={m.name}>{m.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-50 rounded-lg">
                    <td className="text-left p-3 font-black text-slate-500 uppercase">Alerts</td>
                    {yearlyStats.map((m, i) => <td key={i} className={`font-bold ${m.incidents > 0 ? 'text-red-500 font-black' : 'text-slate-200'}`}>{m.incidents || '--'}</td>)}
                  </tr>
                  <tr className="bg-slate-50 rounded-lg">
                    <td className="text-left p-3 font-black text-slate-500 uppercase">Success</td>
                    {yearlyStats.map((m, i) => <td key={i} className={`font-bold ${m.success > 0 ? 'text-emerald-500' : 'text-slate-200'}`}>{m.success || '--'}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>

        {/* Right Panel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-5 lg:overflow-hidden">
          <ChartCard title="INCIDENT SEVERITY DISTRIBUTION">
            <div className="h-[220px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Safe', value: stats.success },      
                      { name: 'Mid', value: stats.midSeverity }, 
                      { name: 'High', value: stats.highSeverity }     
                    ]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value"
                  >
                    <Cell fill="#10B981" stroke="none" /> 
                    <Cell fill="#F59E0B" stroke="none" /> 
                    <Cell fill="#EF4444" stroke="none" /> 
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged</span>
                <span className="text-xl font-black text-slate-700">{filteredLogs.length}</span>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-2">
              <LegendItem color="bg-emerald-500" label="No Issue" />
              <LegendItem color="bg-amber-500" label="Mid" />
              <LegendItem color="bg-red-500" label="High" />
            </div>
          </ChartCard>

          <ChartCard title="MONTHLY INCIDENT TREND">
            <div className="h-[200px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyStats} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 700 }} />
                  <YAxis fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 700 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} />
                  <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </main>

      {/* MODAL (Protected by canUpdate check as well) */}
      {isModalOpen && canUpdate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-black text-xs tracking-widest uppercase flex items-center gap-2">
                <ShieldAlert size={18} className="text-orange-500" /> UPDATE SAFETY LOG
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                <X size={20}/>
              </button>
            </div>
            <div className="space-y-5">
              <InputField label="Date" type="date" value={customDate} onChange={(e)=>setCustomDate(e.target.value)} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Incident Type</label>
                <select value={incidentName} onChange={(e)=>setIncidentName(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm outline-none ring-orange-500 focus:ring-2 transition-all">
                  <option value="No Incident">✅ No Incident (Safe Day)</option>
                  <option value="Near Miss">⚠️ Near Miss</option>
                  <option value="Minor Injury">⚠️ Minor Injury</option>
                  <option value="Major Accident">🚨 Major Accident</option>
                  <option value="Fire Hazard">🔥 Fire Hazard</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Affected" type="number" value={peopleAffected} onChange={(e)=>setPeopleAffected(e.target.value)} placeholder="0" />
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Severity</label>
                  <select value={severity} onChange={(e)=>setSeverity(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm ring-orange-500 focus:ring-2 transition-all">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <button onClick={handleUpdateSafety} className="w-full bg-orange-600 py-5 rounded-2xl font-black text-white shadow-lg hover:bg-orange-700 transition-all uppercase text-xs mt-4 active:scale-95">
                Save Daily Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ... (Helper components stay exactly the same) ...
const StatRow = ({ label, value, color }) => (
  <div className={`flex justify-between items-center p-4 rounded-xl border font-black uppercase text-[10px] ${color}`}>
    <span className="tracking-widest opacity-70">{label}</span>
    <span className="text-xl">{value}</span>
  </div>
);

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2 h-2 rounded-full ${color}`} />
    <span className="text-[9px] font-black text-slate-500 uppercase">{label}</span>
  </div>
);

const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">{label}</label>
    <input {...props} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm outline-none ring-orange-500 focus:ring-2 transition-all" />
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden h-full">
    <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-white font-black uppercase text-[9px] tracking-widest text-slate-400">
      <div className="flex items-center gap-2"><Star size={14} className="text-orange-500" /> {title}</div>
      <Maximize2 size={12} className="text-slate-200" />
    </div>
    <div className="p-5 flex-1 flex flex-col min-h-0">{children}</div>
  </div>
);

export default SafetyPage;