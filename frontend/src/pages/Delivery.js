import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Truck, Activity, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import CircularTracker from '../components/CircularTracker';
import { dashboardMetrics as initialData } from '../dashboardData';

const API_BASE = 'http://localhost:5000/api/metrics';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DeliveryPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const user = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const activeShift = params.shift || user?.shift || '1';

  // --- CORE STATE ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(initialData);
  const [lastBackupTime, setLastBackupTime] = useState(new Date());

  // --- MODAL / INPUT STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedCount, setPlannedCount] = useState('');
  const [dispatchedCount, setDispatchedCount] = useState('');
  const [breakdowns, setBreakdowns] = useState('');
  const [pbrDelay, setPbrDelay] = useState('');
  const [qcDelay, setQcDelay] = useState('');

  // --- VIEW STATE ---
  const [viewDate, setViewDate] = useState(new Date());
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  // --- NEW LOGS STATE (Fixed ESLint "not defined" errors) ---
  const [staffLogs, setStaffLogs] = useState([
    { id: 'EMP001', name: 'Maheshwaran', action: 'System Login', time: '10:30 PM' }
  ]);
  const [activityLogs, setActivityLogs] = useState([
    { id: 'ACT402', name: 'Quality Check', action: 'Approved', time: '11:05 PM' }
  ]);
  const [tableSyncing, setTableSyncing] = useState({ staff: false, activity: false });

  // --- HELPER FUNCTIONS ---
  const addRow = (type) => {
    const newRow = {
      id: `ID-${Math.floor(Math.random() * 900 + 100)}`,
      name: "New Entry",
      action: "Pending",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    if (type === 'staff') setStaffLogs([newRow, ...staffLogs]);
    else setActivityLogs([newRow, ...activityLogs]);
  };

  const getRelativeTime = (past) => {
    const diffInSeconds = Math.floor((currentTime - past) / 1000);
    if (diffInSeconds < 10) return "Just now";
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  };

  // --- API HANDLERS ---
  const handleUpdateStaff = async () => {
    setTableSyncing(prev => ({ ...prev, staff: true }));
    try {
      const res = await fetch(`${API_BASE}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shift: activeShift, logs: staffLogs }),
      });
      if (res.ok) setLastBackupTime(new Date());
    } catch (e) { console.error("Staff sync failed", e); }
    finally { setTableSyncing(prev => ({ ...prev, staff: false })); }
  };

  const handleUpdateActivity = async () => {
    setTableSyncing(prev => ({ ...prev, activity: true }));
    try {
      const res = await fetch(`${API_BASE}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shift: activeShift, logs: activityLogs }),
      });
      if (res.ok) setLastBackupTime(new Date());
    } catch (e) { console.error("Activity sync failed", e); }
    finally { setTableSyncing(prev => ({ ...prev, activity: false })); }
  };

  const handleUpdateStatus = async () => {
    if (!plannedCount || !dispatchedCount) return alert("Please enter counts");
    const [y, m, d] = customDate.split('-');
    const newEntry = {
      date: `${d}/${m}/${y}`, rawDate: customDate,
      planned: Number(plannedCount), dispatched: Number(dispatchedCount),
      breakdowns: Number(breakdowns || 0), pbrDelay: Number(pbrDelay || 0), qcDelay: Number(qcDelay || 0)
    };
    let updatedLogs = [...dData.issueLogs];
    const idx = updatedLogs.findIndex(l => l.rawDate === customDate);
    if (idx !== -1) updatedLogs[idx] = newEntry; else updatedLogs.push(newEntry);

    try {
      const res = await fetch(`${API_BASE}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dData, shift: activeShift, issueLogs: updatedLogs }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMetrics(prev => prev.map(m => m.letter === 'D' ? saved : m));
        setIsModalOpen(false);
        setPlannedCount(''); setDispatchedCount(''); setBreakdowns(''); setPbrDelay(''); setQcDelay('');
      }
    } catch (e) { alert('Sync failed.'); }
  };

  // --- EFFECTS ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_BASE}?shift=${activeShift}`);
        const dbData = await res.json();
        if (dbData?.length > 0) {
          setMetrics(initialData.map(b => dbData.find(d => d.letter === b.letter) || b));
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch_();
  }, [activeShift]);

  // --- MEMOIZED DATA ---
  const dData = useMemo(() => {
    const found = metrics.find(m => m.letter === 'D') || metrics[1];
    return { ...found, issueLogs: Array.isArray(found.issueLogs) ? found.issueLogs : [] };
  }, [metrics]);

  const allYearLogs = useMemo(() => {
    return MONTHS.map((monthName, index) => {
      const logs = dData.issueLogs
        .filter(l => {
          const d = new Date(l.rawDate);
          return d.getMonth() === index && d.getFullYear() === viewYear;
        })
        .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
      return { monthName, monthIndex: index, logs };
    });
  }, [dData.issueLogs, viewYear]);

  const dynamicDaysData = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days = Array(daysInMonth).fill('none');
    dData.issueLogs.forEach(log => {
      const d = new Date(log.rawDate);
      if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) {
        const idx = d.getDate() - 1;
        const fail = (Number(log.dispatched) / Number(log.planned)) * 100 < 90 || Number(log.breakdowns) > 0;
        if (idx >= 0) days[idx] = fail ? 'fail' : 'success';
      }
    });
    return days;
  }, [dData.issueLogs, viewMonth, viewYear]);

  const stats = useMemo(() => ({
    alerts: dynamicDaysData.filter(s => s === 'fail').length,
    success: dynamicDaysData.filter(s => s === 'success').length,
    open: dynamicDaysData.filter(s => s === 'none').length
  }), [dynamicDaysData]);

  const annualTrend = useMemo(() =>
    allYearLogs.map(m => {
      const passCount = m.logs.filter(l => {
        const planned = Number(l.planned) || 0;
        const dispatched = Number(l.dispatched) || 0;
        return planned > 0 && (dispatched / planned * 100) >= 90;
      }).length;
      const failCount = m.logs.length - passCount;
      return { name: m.monthName.slice(0, 3), pass: passCount, fail: failCount };
    }), [allYearLogs]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-emerald-500 animate-pulse">LOADING ANALYTICS...</div>;

  return (
    <div className="h-screen overflow-hidden bg-[#F1F5F9] font-sans flex flex-col">
      <nav className="flex justify-between items-center px-8 py-4 bg-white border-b border-emerald-100 shrink-0">
        <button onClick={() => navigate('/')} className="group flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-tighter hover:text-emerald-600 transition-all">
          <ChevronLeft size={18} /> Back to Dashboard
        </button>
        <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          Update Metrics
        </button>
      </nav>

      <main className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-y-auto no-scrollbar pb-20">
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-[2rem] p-5 flex flex-col items-center shadow-sm border border-slate-200 shrink-0">
            <div className="flex items-center justify-between w-full mb-4 bg-emerald-50 p-2 rounded-2xl">
              <button onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))} className="hover:text-emerald-600"><ChevronLeft size={16} /></button>
              <span className="text-[9px] font-black text-emerald-900 tracking-widest uppercase">{MONTHS[viewMonth]}</span>
              <button onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))} className="hover:text-emerald-600"><ChevronRight size={16} /></button>
            </div>
            <CircularTracker letter="D" daysData={dynamicDaysData} size={160} />
            <div className="grid grid-cols-3 gap-2 w-full mt-4">
              <StatBox val={stats.alerts} label="Fail" color="red" />
              <StatBox val={stats.success} label="Pass" color="emerald" />
              <StatBox val={stats.open} label="Open" color="slate" />
            </div>
          </div>
          <ChartCard title="Monthly Statistics">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={[{ n: 'Fail', v: stats.alerts }, { n: 'Pass', v: stats.success }, { n: 'Open', v: stats.open }]}>
                <XAxis dataKey="n" fontSize={8} axisLine={false} tickLine={false} />
                <Bar dataKey="v" radius={[6, 6, 0, 0]} barSize={25}>
                  <Cell fill="#FDA4AF" /><Cell fill="#6EE7B7" /><Cell fill="#E2E8F0" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* CENTER COLUMN */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[350px]">
            <SectionHeader icon={<Star size={14} className="text-emerald-500" />} title="Dispatch Archives" />
            <div className="px-6 py-2 bg-slate-50 grid grid-cols-3 text-[8px] font-black text-slate-400 uppercase">
              <span>Date</span><span className="text-center">Target</span><span className="text-right">Sent</span>
            </div>
            <InfiniteScrollList data={allYearLogs} type="dispatch" />
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[250px]">
            <SectionHeader icon={<Clock size={14} className="text-orange-500" />} title="Minor Metrics Logs" />
            <div className="px-6 py-2 bg-slate-50 grid grid-cols-4 text-[8px] font-black text-slate-400 uppercase">
              <span>Date</span><span className="text-center">Break Down</span><span className="text-center">PBR (m)</span><span className="text-right">QC (m)</span>
            </div>
            <InfiniteScrollList data={allYearLogs} type="minor" />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="bg-emerald-600 rounded-[2.5rem] p-6 flex flex-col items-center shadow-xl text-white relative overflow-hidden shrink-0">
            <div className="flex items-center gap-2 mb-4 bg-white/20 px-4 py-1.5 rounded-full relative z-10">
              <TrendingUp size={12} className="text-emerald-200" />
              <span className="text-[9px] font-black tracking-widest uppercase">Efficiency</span>
            </div>
            <h4 className="text-4xl font-black z-10">{stats.success + stats.alerts > 0 ? ((stats.success / (stats.success + stats.alerts)) * 100).toFixed(1) : 0}%</h4>
            <p className="text-[8px] font-black text-emerald-100 uppercase mt-1 opacity-70">Shift {activeShift} Average</p>
          </div>

          <ChartCard title="Annual Performance Trend">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={annualTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold' }} />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="pass" stroke="#10B981" fillOpacity={0.3} fill="#10B981" strokeWidth={3} />
                  <Area type="monotone" dataKey="fail" stroke="#F43F5E" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Status</h5>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[11px] font-black text-slate-700 uppercase">Operational</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-black text-slate-800 leading-none mb-1">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{currentTime.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })}</p>
              </div>
            </div>
            <div className="space-y-4">
              <TipItem icon={<Clock size={14} className="text-amber-500" />} text="PBR Indent Delays > 30m impact shift efficiency." />
              <TipItem icon={<Activity size={14} className="text-emerald-500" />} text="90% minimum dispatch required for green status." />
              <TipItem icon={<Activity size={14} className="text-slate-400" />} text={`Last backup synchronized ${getRelativeTime(lastBackupTime)}.`} />
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: SYNC TABLES */}
        <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-4 h-[350px]">
          {/* Staff Table */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-emerald-50/30">
              <h3 className="font-black text-[10px] text-emerald-800 tracking-widest uppercase flex items-center gap-2">
                <Activity size={14} className="text-emerald-500" /> Staff Logs
              </h3>
              <div className="flex gap-2">
                <button onClick={() => addRow('staff')} className="p-1.5 bg-white border border-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-50"><TrendingUp size={12} /></button>
                <button 
                  onClick={handleUpdateStaff}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${tableSyncing.staff ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                  {tableSyncing.staff ? 'Saving...' : 'Update Staff'}
                </button>
              </div>
            </div>
            <TableContent data={staffLogs} type="staff" />
          </div>

          {/* Activity Table */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-blue-50/30">
              <h3 className="font-black text-[10px] text-blue-800 tracking-widest uppercase flex items-center gap-2">
                <Star size={14} className="text-blue-500" /> Activity Logs
              </h3>
              <div className="flex gap-2">
                <button onClick={() => addRow('activity')} className="p-1.5 bg-white border border-blue-100 text-blue-600 rounded-lg hover:bg-blue-50"><TrendingUp size={12} /></button>
                <button 
                  onClick={handleUpdateActivity}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${tableSyncing.activity ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {tableSyncing.activity ? 'Saving...' : 'Update Activity'}
                </button>
              </div>
            </div>
            <TableContent data={activityLogs} type="activity" />
          </div>
        </div>
      </main>

      {/* MODAL REMAINING THE SAME */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-[380px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="font-black text-lg text-slate-800 uppercase text-center mb-6">Metrics Sync</h2>
            <div className="space-y-4">
              <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 font-bold text-slate-600 outline-none border-2 border-transparent focus:border-emerald-500" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Target" value={plannedCount} onChange={e => setPlannedCount(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 font-bold outline-none" />
                <input type="number" placeholder="Sent" value={dispatchedCount} onChange={e => setDispatchedCount(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 font-bold outline-none" />
              </div>
              <input type="number" placeholder="Breakdowns" value={breakdowns} onChange={e => setBreakdowns(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 font-bold outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="PBR (min)" value={pbrDelay} onChange={e => setPbrDelay(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 font-bold outline-none" />
                <input type="number" placeholder="QC (min)" value={qcDelay} onChange={e => setQcDelay(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 font-bold outline-none" />
              </div>
              <button onClick={handleUpdateStatus} className="w-full bg-emerald-600 py-4 rounded-xl font-black text-white text-[11px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl transition-all">Synchronize All</button>
              <button onClick={() => setIsModalOpen(false)} className="w-full text-[10px] font-bold text-slate-400 uppercase text-center">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// HELPERS (UNMODIFIED EXCEPT FOR PROP PASSING)
const SectionHeader = ({ icon, title }) => (
  <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50 shrink-0">
    {icon}
    <h3 className="font-black text-[10px] text-slate-700 tracking-widest uppercase">{title}</h3>
  </div>
);

const TableContent = ({ data, type }) => (
  <div className="flex flex-col flex-1 overflow-hidden">
    <div className="px-6 py-2 bg-slate-50 grid grid-cols-4 text-[8px] font-black text-slate-400 uppercase">
      <span>ID / Ref</span><span>Name / Type</span><span>Action</span><span className="text-right">Time</span>
    </div>
    <div className="flex-1 overflow-y-auto px-6 divide-y divide-slate-50">
      {data.map((log, i) => (
        <div key={i} className="grid grid-cols-4 py-3 items-center hover:bg-slate-50/50">
          <span className={`text-[10px] font-bold ${type === 'staff' ? 'text-emerald-600' : 'text-blue-600'}`}>{log.id}</span>
          <span className="text-[11px] font-bold text-slate-700">{log.name}</span>
          <span className="text-[10px] font-medium text-slate-400 uppercase">{log.action}</span>
          <span className="text-right text-[10px] font-black text-slate-500">{log.time}</span>
        </div>
      ))}
    </div>
  </div>
);

const InfiniteScrollList = ({ data, type }) => {
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scroll = () => {
      el.scrollTop += 0.5;
      if (el.scrollTop >= el.scrollHeight / 2) el.scrollTop = 0;
      requestAnimationFrame(scroll);
    };
    const animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, []);
  const content = (
    <>
      {data.map(({ monthName, logs }) => logs.length > 0 && (
        <div key={monthName}>
          <div className="sticky top-0 z-10 bg-white/95 px-6 py-1.5 border-b border-slate-50">
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">{monthName}</span>
          </div>
          <div className="divide-y divide-slate-50 px-6">
            {logs.map((log, i) => (
              <div key={i} className={`grid ${type === 'dispatch' ? 'grid-cols-3' : 'grid-cols-4'} py-3 items-center text-[10px]`}>
                <div className="font-bold text-slate-500">{log.date.split('/')[0]}/{log.date.split('/')[1]}</div>
                {type === 'dispatch' ? (
                  <>
                    <div className="text-center font-medium text-slate-400">{log.planned}</div>
                    <div className={`text-right font-black ${(log.dispatched / log.planned) >= 0.9 ? 'text-emerald-500' : 'text-rose-500'}`}>{log.dispatched}</div>
                  </>
                ) : (
                  <>
                    <div className={`text-center font-bold ${log.breakdowns > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{log.breakdowns}</div>
                    <div className={`text-center font-bold ${log.pbrDelay > 30 ? 'text-amber-500' : 'text-slate-400'}`}>{log.pbrDelay}m</div>
                    <div className="text-right font-bold text-slate-400">{log.qcDelay}m</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
  return <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">{content}{content}</div>;
};

const StatBox = ({ val, label, color }) => (
  <div className="text-center p-2 rounded-xl bg-white border border-slate-100 shadow-sm">
    <div className={`text-sm font-black ${color === 'emerald' ? 'text-emerald-500' : color === 'red' ? 'text-rose-500' : 'text-slate-400'}`}>{val}</div>
    <div className="text-[7px] font-black uppercase text-slate-300 tracking-tighter">{label}</div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0 p-4">
    <h4 className="font-black text-[8px] text-slate-400 tracking-widest uppercase mb-4">{title}</h4>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

const TipItem = ({ icon, text }) => ( 
  <div className="flex items-start gap-3">
    <div className="mt-0.5">{icon}</div>
    <p className="text-[10px] font-bold text-slate-500 leading-tight">{text}</p>
  </div>
);

export default DeliveryPage;