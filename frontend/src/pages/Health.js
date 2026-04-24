import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, Save, ChevronLeft, ChevronRight, Lock, CheckCircle2, ShieldAlert, Clock } from 'lucide-react';
import axios from 'axios';

const DEPT_FULL = { fg: 'Finished Good Material Warehouse', pm: 'Packing Material Warehouse', rm: 'Raw Material Warehouse' };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const Health = () => {
  const { shift, dept } = useParams();
  const navigate = useNavigate();

  const user        = JSON.parse(localStorage.getItem('userInfo')) || { role: 'supervisor' };
  const isSuperAdmin      = user.role === 'superadmin';
  const isHOD             = user.role === 'hod';
  const isSupervisor      = user.role === 'supervisor';
  const userDepts          = user?.department
    ? user.department.split(',').map(s => s.trim().toLowerCase())
    : [];
  const isHealthSupervisor = isSupervisor && (userDepts.includes(dept?.toLowerCase()) || userDepts.includes('all'));
  const canUpdate          = isHealthSupervisor || isSuperAdmin;

  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const currentMonthName = MONTHS[currentMonthIndex];

  const [notification, setNotification]       = useState({ show: false, message: '', type: '' });
  const [allMonthsData, setAllMonthsData]     = useState(() => {
    const init = {};
    MONTHS.forEach(m => {
      init[m] = Array.from({ length: 31 }, (_, i) => ({
        date: i + 1, status: null, keypoints: '', attendance: '', attendees: null, totalStrength: null,
      }));
    });
    return init;
  });

  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [selectedDay, setSelectedDay]         = useState(null);
  const [formData, setFormData]               = useState({ status: '', keypoints: '', attendees: '', totalStrength: '' });

  // Cutoff state
  const [cutoffTime, setCutoffTimeState]      = useState('17:00');
  const [overrides, setOverrides]             = useState([]);
  const [showCutoffSettings, setShowCutoffSettings] = useState(false);
  const [cutoffInput, setCutoffInput]         = useState('17:00');

  const showNotify = (msg, type = 'success') => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

  // Fetch health data
  useEffect(() => {
    const fetchMonthData = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/health', {
          params: { month: currentMonthName, year: 2026, dept: dept || 'fg', shift: shift || '1' },
        });
        if (data?.days?.length > 0) {
          setAllMonthsData(prev => ({ ...prev, [currentMonthName]: data.days }));
        } else {
          setAllMonthsData(prev => ({
            ...prev,
            [currentMonthName]: Array.from({ length: 31 }, (_, i) => ({
              date: i + 1, status: null, keypoints: '', attendance: '', attendees: null, totalStrength: null,
            })),
          }));
        }
      } catch {
        setAllMonthsData(prev => ({
          ...prev,
          [currentMonthName]: Array.from({ length: 31 }, (_, i) => ({
            date: i + 1, status: null, keypoints: '', attendance: '', attendees: null, totalStrength: null,
          })),
        }));
      }
    };
    fetchMonthData();
  }, [currentMonthName, shift, dept]);

  // Fetch cutoff settings once
  useEffect(() => {
    axios.get('http://localhost:5000/api/health/cutoff')
      .then(({ data }) => {
        setCutoffTimeState(data.cutoffTime);
        setCutoffInput(data.cutoffTime);
        setOverrides(data.overrides || []);
      })
      .catch(() => {});
  }, []);

  // --- helpers ---

  const isPastCutoff = () => {
    const [h, m] = cutoffTime.split(':').map(Number);
    const now = new Date();
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
  };

  const isCurrentDay = (dayDate) => {
    const now = new Date();
    return dayDate === now.getDate() && currentMonthName === MONTHS[now.getMonth()] && 2026 === now.getFullYear();
  };

  const hasOverrideForDay = (dayDate) =>
    overrides.some(
      o => o.date === dayDate && o.month === currentMonthName && o.year === 2026 &&
           o.dept === (dept || 'fg') && o.shift === (shift || '1'),
    );

  const calcAttendance = (attendees, totalStrength) => {
    const a = Number(attendees), t = Number(totalStrength);
    if (!a || !t || t === 0) return null;
    return Math.round((a / t) * 100);
  };

  // --- handlers ---

  const handleSave = async () => {
    if (!canUpdate) return;
    const attendancePct = formData.status !== 'holiday'
      ? calcAttendance(formData.attendees, formData.totalStrength)
      : null;
    const payload = {
      month: currentMonthName, year: 2026,
      dept: dept || 'fg', shift: shift || '1',
      date: selectedDay.date, status: formData.status,
      keypoints: formData.keypoints,
      attendance: attendancePct != null ? String(attendancePct) : '',
      attendees:     formData.attendees     !== '' ? Number(formData.attendees)     : null,
      totalStrength: formData.totalStrength !== '' ? Number(formData.totalStrength) : null,
      userRole: user.role,
    };
    try {
      await axios.post('http://localhost:5000/api/health/update', payload);
      const updated = allMonthsData[currentMonthName].map(item =>
        item.date === selectedDay.date
          ? { ...item, status: formData.status, keypoints: formData.keypoints,
              attendance: payload.attendance, attendees: payload.attendees, totalStrength: payload.totalStrength }
          : item,
      );
      setAllMonthsData({ ...allMonthsData, [currentMonthName]: updated });
      setIsModalOpen(false);
      showNotify('Entry Secured & Locked Successfully', 'success');
    } catch (err) {
      showNotify(err.response?.data?.message || 'System Error: Unable to Save', 'error');
    }
  };

  const handleSetCutoffTime = async () => {
    try {
      await axios.put('http://localhost:5000/api/health/cutoff/time', { cutoffTime: cutoffInput, userRole: user.role });
      setCutoffTimeState(cutoffInput);
      setShowCutoffSettings(false);
      showNotify(`Daily cutoff updated to ${cutoffInput}`, 'success');
    } catch (err) {
      showNotify(err.response?.data?.message || 'Failed to update cutoff time', 'error');
    }
  };

  const handleGrantOverride = async () => {
    try {
      await axios.post('http://localhost:5000/api/health/cutoff/override', {
        userRole: user.role, date: selectedDay.date, month: currentMonthName,
        year: 2026, dept: dept || 'fg', shift: shift || '1',
      });
      setOverrides(prev => [...prev, {
        date: selectedDay.date, month: currentMonthName, year: 2026,
        dept: dept || 'fg', shift: shift || '1',
      }]);
      showNotify('Override granted — supervisor can now update this entry', 'success');
    } catch (err) {
      showNotify(err.response?.data?.message || 'Failed to grant override', 'error');
    }
  };

  const handleRevokeOverride = async () => {
    try {
      await axios.delete('http://localhost:5000/api/health/cutoff/override', {
        data: {
          userRole: user.role, date: selectedDay.date, month: currentMonthName,
          year: 2026, dept: dept || 'fg', shift: shift || '1',
        },
      });
      setOverrides(prev => prev.filter(
        o => !(o.date === selectedDay.date && o.month === currentMonthName &&
               o.year === 2026 && o.dept === (dept || 'fg') && o.shift === (shift || '1')),
      ));
      showNotify('Override revoked', 'success');
    } catch (err) {
      showNotify(err.response?.data?.message || 'Failed to revoke override', 'error');
    }
  };

  const openEntryModal = (day) => {
    if (!canUpdate) {
      showNotify('Access Denied: You are not the Health Supervisor', 'error');
      return;
    }
    if (day.status && !isSuperAdmin) {
      showNotify('Security Lock: Only Super Admin can modify entries', 'error');
      return;
    }
    // Cutoff check — blocks all saves after cutoff time unless override granted
    if (isPastCutoff() && !isSuperAdmin && !hasOverrideForDay(day.date)) {
      showNotify(`Cutoff time (${cutoffTime}) has passed. Contact Super Admin for override.`, 'error');
      return;
    }
    setSelectedDay(day);
    setFormData({
      status:        day.status        || '',
      keypoints:     day.keypoints     || '',
      attendees:     day.attendees     != null ? String(day.attendees)     : '',
      totalStrength: day.totalStrength != null ? String(day.totalStrength) : '',
    });
    setIsModalOpen(true);
  };

  const isMeeting           = formData.status === 'meeting';
  const attendancePctPreview = isMeeting ? calcAttendance(formData.attendees, formData.totalStrength) : null;
  const isFormInvalid       = !formData.status ||
    (isMeeting && (!formData.attendees || !formData.totalStrength || !formData.keypoints.trim()));

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen font-sans text-slate-900">

      {/* Notification */}
      {notification.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] animate-in slide-in-from-top-8 duration-500">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl border-t border-white/10 min-w-[320px] ${
            notification.type === 'error'
              ? 'bg-slate-900/95 border-rose-500/50 text-rose-400'
              : 'bg-slate-900/95 border-emerald-500/50 text-emerald-400'
          }`}>
            <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
              {notification.type === 'error' ? <ShieldAlert size={24}/> : <CheckCircle2 size={24}/>}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-0.5">Security System</p>
              <p className="font-bold tracking-tight text-sm text-white">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-[#475569] font-bold text-xs uppercase hover:text-emerald-600 transition-all">
          <ChevronLeft size={20}/> BACK TO DASHBOARD
        </button>
      </div>

      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Health</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`h-2 w-2 rounded-full animate-pulse ${canUpdate ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
            <p className="text-slate-500 font-bold uppercase tracking-[0.15em] text-[10px]">
              {isSuperAdmin ? 'Administrative Master' : isHOD ? 'HOD Audit Mode' : isHealthSupervisor ? 'Supervisor Entry' : 'View Only Mode'}
            </p>
          </div>
        </div>
        <div className="flex items-center bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-1.5 transition-all hover:shadow-2xl">
          <button onClick={() => setCurrentMonthIndex(prev => prev === 0 ? 11 : prev - 1)} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><ChevronLeft size={20}/></button>
          <span className="px-10 font-black uppercase tracking-widest text-xs w-44 text-center">{currentMonthName}</span>
          <button onClick={() => setCurrentMonthIndex(prev => prev === 11 ? 0 : prev + 1)} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><ChevronRight size={20}/></button>
        </div>
      </header>

      {/* Cutoff bar */}
      <div className="mb-4">
        {isSuperAdmin && showCutoffSettings ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-3 shadow-sm">
            <Clock size={15} className="text-amber-500"/>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Daily Cutoff Time</span>
            <input
              type="time" value={cutoffInput}
              onChange={e => setCutoffInput(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-slate-900"
            />
            <button onClick={handleSetCutoffTime} className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-black transition-all">Save</button>
            <button onClick={() => setShowCutoffSettings(false)} className="text-slate-400 hover:text-slate-600 transition-all"><X size={16}/></button>
          </div>
        ) : (
          <button
            onClick={() => isSuperAdmin && setShowCutoffSettings(true)}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              isSuperAdmin ? 'text-slate-400 hover:text-amber-600 cursor-pointer' : 'text-slate-300 cursor-default'
            }`}
          >
            <Clock size={13}/>
            Daily Cutoff: {cutoffTime}
            {isSuperAdmin && <span className="text-slate-300 normal-case font-medium tracking-normal">(click to change)</span>}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Health — Shift {shift}</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{DEPT_FULL[dept] || dept?.toUpperCase()}</p>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-0.5">Arcolab Continuous Improvement System</p>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
        {allMonthsData[currentMonthName].map((item) => {
          const isCutoffLocked = isCurrentDay(item.date) && isPastCutoff() && !isSuperAdmin && !hasOverrideForDay(item.date);
          const hasDayOverride = isCurrentDay(item.date) && isPastCutoff() && hasOverrideForDay(item.date);
          const isLocked       = (item.status && !isSuperAdmin) || !canUpdate || isCutoffLocked;

          let colorClass = 'bg-white border-slate-100 text-slate-400';
          if (item.status === 'meeting')    colorClass = 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 border-transparent';
          if (item.status === 'no-meeting') colorClass = 'bg-rose-500 text-white shadow-lg shadow-rose-200 border-transparent';
          if (item.status === 'holiday')    colorClass = 'bg-slate-800 text-white shadow-lg shadow-slate-300 border-transparent';
          if (isCutoffLocked && !item.status) colorClass = 'bg-amber-50 border-amber-200 text-amber-500';

          const pct = item.status === 'meeting' ? calcAttendance(item.attendees, item.totalStrength) : null;

          return (
            <div
              key={item.date}
              onClick={() => openEntryModal(item)}
              className={`group relative cursor-pointer rounded-[2rem] h-40 p-5 transition-all duration-300 border-2 hover:scale-[1.03] flex flex-col justify-between ${colorClass} ${isLocked ? 'opacity-80' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-black text-2xl tracking-tighter">{item.date}</span>
                {isLocked
                  ? <Lock size={16} className="opacity-40"/>
                  : isCutoffLocked
                    ? <Clock size={16} className="text-amber-400"/>
                    : hasDayOverride
                      ? <Clock size={16} className="text-emerald-400"/>
                      : <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                }
              </div>
              <div className="overflow-hidden">
                {item.status ? (
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase leading-tight truncate tracking-wide">{item.keypoints || item.status}</p>
                    {item.status === 'meeting' && (
                      <div className="space-y-0.5">
                        {item.attendees != null && item.totalStrength != null && (
                          <p className="text-[9px] font-bold opacity-80">{item.attendees}/{item.totalStrength}</p>
                        )}
                        {pct != null && <p className="text-[10px] font-bold opacity-80 italic">{pct}%</p>}
                      </div>
                    )}
                  </div>
                ) : isCutoffLocked ? (
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Cutoff reached</p>
                ) : (
                  <div className="h-1 w-8 bg-slate-100 rounded-full group-hover:w-12 transition-all"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {isModalOpen && canUpdate && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.25)] w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-0 flex justify-between items-center">
              <div>
                <h2 className="font-black uppercase tracking-widest text-xs text-slate-400">Data Transmission</h2>
                <p className="text-2xl font-black text-slate-900">{selectedDay?.date} {currentMonthName}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-12 w-12 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors"><X size={20}/></button>
            </div>

            <div className="p-8 space-y-6">

              {/* Super admin: override management when past cutoff */}
              {isSuperAdmin && selectedDay && isPastCutoff() && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Cutoff Override</p>
                    <p className="text-xs text-amber-800 font-medium">
                      {hasOverrideForDay(selectedDay.date) ? 'Granted — supervisor can update' : 'Not granted to supervisor'}
                    </p>
                  </div>
                  <button
                    onClick={hasOverrideForDay(selectedDay.date) ? handleRevokeOverride : handleGrantOverride}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      hasOverrideForDay(selectedDay.date)
                        ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                        : 'bg-amber-600 text-white hover:bg-amber-700'
                    }`}
                  >
                    {hasOverrideForDay(selectedDay.date) ? 'Revoke' : 'Grant'}
                  </button>
                </div>
              )}

              {/* Status selector */}
              <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                {['meeting', 'no-meeting', 'holiday'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFormData({ ...formData, status: s })}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      formData.status === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {s.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Meeting fields */}
              {formData.status === 'meeting' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="number" min="0" placeholder="0"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pt-7 font-black text-xl outline-none focus:border-slate-900 transition-all"
                        value={formData.attendees}
                        onChange={e => setFormData({ ...formData, attendees: e.target.value })}
                      />
                      <label className="absolute top-3 left-4 text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">Attendees</label>
                    </div>
                    <div className="relative">
                      <input
                        type="number" min="0" placeholder="0"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pt-7 font-black text-xl outline-none focus:border-slate-900 transition-all"
                        value={formData.totalStrength}
                        onChange={e => setFormData({ ...formData, totalStrength: e.target.value })}
                      />
                      <label className="absolute top-3 left-4 text-[9px] font-black uppercase text-slate-400 tracking-[0.15em]">Total Strength</label>
                    </div>
                  </div>

                  {attendancePctPreview != null && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Attendance</span>
                      <span className="text-2xl font-black text-emerald-700">{attendancePctPreview}%</span>
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      placeholder="Input findings..."
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pt-7 h-32 font-bold text-sm outline-none focus:border-slate-900 transition-all resize-none"
                      value={formData.keypoints}
                      onChange={e => setFormData({ ...formData, keypoints: e.target.value })}
                    />
                    <label className="absolute top-3 left-4 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Observations</label>
                  </div>
                </div>
              )}

              {/* No-meeting fields */}
              {formData.status === 'no-meeting' && (
                <div className="animate-in slide-in-from-bottom-4">
                  <div className="relative">
                    <textarea
                      placeholder="Reason for no meeting..."
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pt-7 h-28 font-bold text-sm outline-none focus:border-slate-900 transition-all resize-none"
                      value={formData.keypoints}
                      onChange={e => setFormData({ ...formData, keypoints: e.target.value })}
                    />
                    <label className="absolute top-3 left-4 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Notes</label>
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={isFormInvalid}
                className={`w-full font-black py-5 rounded-[1.5rem] uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${
                  isFormInvalid
                    ? 'bg-slate-100 text-slate-300'
                    : 'bg-slate-900 text-white shadow-2xl shadow-slate-300 hover:bg-black hover:-translate-y-1'
                }`}
              >
                <Save size={16}/> {isFormInvalid ? 'Incomplete Data' : 'Secure Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Health;
