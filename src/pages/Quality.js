import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Maximize2, Edit3, X, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import CircularTracker from '../components/CircularTracker';
import { dashboardMetrics as initialData } from '../dashboardData'; 

const QualityPage = () => {
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState(new Date().getDate());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState("None");
  
   const [metrics, setMetrics] = useState(() => {
    const saved = localStorage.getItem('production_dashboard_data');
    if (saved) return JSON.parse(saved);
    
    return initialData.map(m => ({
      ...m,
      issueLogs: m.issueLogs || {} 
    }));
  });

  useEffect(() => {
    localStorage.setItem('production_dashboard_data', JSON.stringify(metrics));
  }, [metrics]);

  const qData = useMemo(() => 
    metrics.find(m => m.letter === 'Q') || metrics[1], 
  [metrics]);

  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
  const currentYear = 2026;

  const dailyPerformance = useMemo(() => Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    issue: Math.floor(Math.random() * 5),
    action: Math.floor(Math.random() * 4),
  })), []);

  const alertLogs = useMemo(() => {
    return Object.entries(qData.issueLogs || {})
      .map(([dayIndex, reason]) => ({
        date: `${parseInt(dayIndex) + 1}/06/${currentYear}`,
        reason,
        dayNum: parseInt(dayIndex) + 1
      }))
      .sort((a, b) => a.dayNum - b.dayNum); 
  }, [qData.issueLogs, currentYear]);

   const handleUpdateStatus = () => {
    const updatedMetrics = metrics.map(m => {
      if (m.letter === 'Q') {
        const newDaysData = [...m.daysData];
        const newIssueLogs = { ...m.issueLogs };
        const dayIndex = activeDay - 1;

          if (newDaysData[dayIndex] !== "none") {
          if (selectedIssue === "None") {
            newDaysData[dayIndex] = "success";
            delete newIssueLogs[dayIndex];
          } else {
            newDaysData[dayIndex] = "fail";
            newIssueLogs[dayIndex] = selectedIssue;
          }
          
          const newAlerts = newDaysData.filter(d => d === "fail").length;
          const newSuccess = newDaysData.filter(d => d === "success").length;
          
          return { 
            ...m, 
            daysData: newDaysData, 
            alerts: newAlerts, 
            success: newSuccess, 
            issueLogs: newIssueLogs 
          };
        }
      }
      return m;
    });

    setMetrics(updatedMetrics);
    setIsModalOpen(false);
    setSelectedIssue("None");  
  };

  const barData = [
    { name: 'Alerts', value: qData.alerts || 0, color: '#ef4444' },
    { name: 'Success', value: qData.success || 0, color: '#22c55e' },
    { name: 'Holiday', value: qData.daysData.filter(s => s === "none").length, color: '#94a3b8' },
  ];

  return (
    <div className="p-4 bg-[#F1F5F9] min-h-screen font-sans relative">
      
      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><Edit3 size={18}/> Log Issue: Day {activeDay}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <div className="p-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Issue Category</label>
              <select 
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {/* <option value="None">✅ No Issue (Success)</option> */}
                <option value="No Manpower">⚠️ No Manpower</option>
                <option value="No Power">⚠️ No Power</option>
                
              </select>
              <button onClick={handleUpdateStatus} className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                Submit & Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 font-bold hover:text-blue-600 transition">
          <ArrowLeft size={20} /> Dashboard
        </button>
        <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
                Status: <span className="text-green-500 font-black">Online</span>
            </span>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-full shadow-md hover:bg-blue-700 transition-all active:scale-95">
              <Edit3 size={14} /> Update Day {activeDay}
            </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        
        {/* SIDEBAR */}
        <div className="w-full lg:w-[320px] bg-white rounded-xl shadow-md border border-slate-100 p-6 flex flex-col items-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-1">{qData.label}</h1>
          <p className="text-xs font-bold text-blue-500 mb-6 uppercase">{currentMonthName} {activeDay}, {currentYear}</p>
          <CircularTracker letter={qData.letter} daysData={qData.daysData} onDayClick={(day) => setActiveDay(day)} activeDay={activeDay} />
          
          <div className="grid grid-cols-1 gap-2 w-full mt-8">
             <div className="flex items-center justify-between bg-red-500 p-3 rounded-lg text-white shadow-sm">
                <span className="text-[10px] font-bold uppercase">Total Alerts</span>
                <span className="text-lg font-black">{qData.alerts}</span>
             </div>
             <div className="flex items-center justify-between bg-green-500 p-3 rounded-lg text-white shadow-sm">
                <span className="text-[10px] font-bold uppercase">Total Success</span>
                <span className="text-lg font-black">{qData.success}</span>
             </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <ChartWrapper title="Metric Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                  {barData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>

          <ChartWrapper title="Current Month Alert Analysis">
            <div className="flex flex-col h-[220px]">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                   <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black text-white shadow-sm ${qData.daysData[activeDay-1] === 'fail' ? 'bg-red-500' : 'bg-slate-800'}`}>
                      <span className="text-[9px] leading-none opacity-80 uppercase font-bold">Day</span>
                      <span className="text-lg leading-none mt-1">{activeDay}</span>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Status</p>
                     <p className={`text-xs font-bold ${qData.daysData[activeDay-1] === 'fail' ? 'text-red-500' : 'text-green-600'}`}>
                        {qData.daysData[activeDay-1] === 'fail' ? 'Critical Alert' : 'Target Met'}
                     </p>
                   </div>
                </div>
                <div className="bg-red-50 px-3 py-2 rounded-lg border border-red-100 text-right">
                   <p className="text-[9px] font-black text-red-400 uppercase leading-none mb-1">Mtd Alerts</p>
                   <p className="text-xl font-black text-red-600 leading-none">{qData.alerts}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg bg-slate-50 shadow-inner custom-scrollbar">
                <table className="w-full text-[10px]">
                  <thead className="bg-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-left text-slate-600 font-black uppercase">Date</th>
                      <th className="p-2 text-left text-slate-600 font-black uppercase">Alert Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertLogs.length > 0 ? alertLogs.map((log, i) => (
                      <tr key={i} className={`border-t bg-white hover:bg-red-50 transition-colors ${log.dayNum === activeDay ? 'bg-red-50/50' : ''}`}>
                        <td className="p-2 font-bold text-slate-500">{log.date}</td>
                        <td className="p-2 font-black text-red-600 flex items-center gap-2">
                          <AlertCircle size={12} className="shrink-0" /> {log.reason}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="2" className="p-8 text-center text-slate-400 italic">No alerts logged for this month.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ChartWrapper>

          <ChartWrapper title="Monthly Performance Summary">
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-50 text-slate-500 uppercase">
                  <tr>
                    <th className="p-2 min-w-[100px]">Category</th>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <th key={m} className="p-2 text-center">{m}</th>)}
                    <th className="p-2 text-red-500 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-700">
                  <tr className="border-t border-slate-50">
                    <td className="p-2 flex items-center gap-2 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> Alerts</td>
                    {Array(12).fill(0).map((_, i) => <td key={i} className="p-2 text-center text-slate-400 font-medium">{i === 5 ? qData.alerts : "--"}</td>)}
                    <td className="p-2 text-red-500 font-black text-right">{qData.alerts || 0}</td>
                  </tr>
                  <tr className="border-t border-slate-50">
                    <td className="p-2 flex items-center gap-2 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-green-500"/> Success</td>
                    {Array(12).fill(0).map((_, i) => <td key={i} className="p-2 text-center text-slate-400 font-medium">{i === 5 ? qData.success : "--"}</td>)}
                    <td className="p-2 text-green-500 font-black text-right">{qData.success || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ChartWrapper>

          <ChartWrapper title="Daily Action Trend">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" fontSize={9} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="issue" stroke="#ef4444" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="action" stroke="#4f46e5" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>

        </div>
      </div>
    </div>
  );
};

const ChartWrapper = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
      <div className="flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-widest">
        <Star size={14} className="text-blue-500" /> {title}
      </div>
      <Maximize2 size={12} className="text-slate-300 hover:text-slate-600 cursor-pointer" />
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default QualityPage;