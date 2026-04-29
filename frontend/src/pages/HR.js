import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HR_ROWS = [
  { category: 'Manpower Training & Competence', kpiMetric: 'Total Trainings' },
  { category: 'Manpower Training & Competence', kpiMetric: 'Safety Trainings' },
  { category: 'Hiring Progress',                kpiMetric: 'Open Positions' },
  { category: 'Hiring Progress',                kpiMetric: 'Closed Positions' },
  { category: 'Employee Induction Support',     kpiMetric: 'Safety Induction' },
  { category: 'Attendance Error Elimination',   kpiMetric: 'Attendance Issues' },
  { category: 'OEC – Health & Wellness',        kpiMetric: 'Health Checkups' },
  { category: 'L&D Control Engagement',         kpiMetric: 'Training Completion Ratio' },
  { category: 'Safety Compliance',              kpiMetric: 'Safety Observations Closed' },
  { category: 'Safety Compliance',              kpiMetric: 'Safety Observations Open' },
  { category: 'Legal Compliance',               kpiMetric: 'Compliance Audits' },
  { category: 'Legal Compliance',               kpiMetric: 'External Audits' },
];

const COLS = [
  { key: 'plan',       label: 'Plan' },
  { key: 'actual',     label: 'Actual' },
  { key: 'percentage', label: '%' },
  { key: 'statusRag',  label: 'Status (RAG)', isRag: true },
  { key: 'remarks',    label: 'Remarks / Action Plan', wide: true },
];

const DEFAULT_ENTRY = {
  plan: '', actual: '', percentage: '', statusRag: '', remarks: '',
};

const computeSpans = (rows) => {
  const result = [];
  let i = 0;
  while (i < rows.length) {
    const cat = rows[i].category;
    let count = 0;
    while (i + count < rows.length && rows[i + count].category === cat) count++;
    for (let j = 0; j < count; j++) {
      result.push({ showCat: j === 0, catSpan: j === 0 ? count : 0 });
    }
    i += count;
  }
  return result;
};

const SPANS = computeSpans(HR_ROWS);

const ragStyle = (rag) => {
  if (rag === 'Green') return 'bg-green-50 text-green-700 border-green-300';
  if (rag === 'Amber') return 'bg-amber-50 text-amber-700 border-amber-300';
  if (rag === 'Red')   return 'bg-red-50 text-red-700 border-red-300';
  return 'bg-white text-slate-600 border-slate-200';
};

export default function HR() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [shift, setShift]     = useState('1');
  const [date, setDate]       = useState(today);
  const [entries, setEntries] = useState(HR_ROWS.map(() => ({ ...DEFAULT_ENTRY })));
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/hr?date=${date}&shift=${shift}`);
      const data = await res.json();
      const saved = data.entries || [];
      setEntries(HR_ROWS.map((_, i) => {
        const found = saved.find(e => e.rowIndex === i);
        return found ? { ...DEFAULT_ENTRY, ...found } : { ...DEFAULT_ENTRY };
      }));
    } catch {
      setEntries(HR_ROWS.map(() => ({ ...DEFAULT_ENTRY })));
    }
  }, [date, shift]);

  useEffect(() => { load(); }, [load]);

  const change = (i, field, value) => {
    setEntries(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`${API}/api/hr/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date, shift,
          entries: entries.map((e, i) => ({ rowIndex: i, ...e })),
        }),
      });
      if (!res.ok) throw new Error();
      setSaveMsg('Saved successfully');
    } catch {
      setSaveMsg('Failed to save');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-500 to-orange-700 pt-20 pb-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-end justify-end pr-10 pb-4 pointer-events-none">
          <span className="text-[10rem] font-black text-white/5 leading-none">HR</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <button
            onClick={() => navigate('/')}
            className="mb-6 px-4 py-1.5 bg-white/10 hover:bg-white/20 transition-colors rounded-full text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-4">
            Human Resources
          </h1>
          <p className="text-white/60 text-sm font-medium">
            Workforce metrics — Training, hiring, attendance & compliance
          </p>
        </motion.div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 -mt-16 relative z-20 pb-12">
        {/* Controls card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-5 mb-6"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {['1', '2', '3'].map(s => (
                <button
                  key={s}
                  onClick={() => setShift(s)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    shift === s
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Shift {s}
                </button>
              ))}
            </div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 focus:outline-none focus:border-orange-400"
            />
            {saveMsg && (
              <span className={`text-sm font-semibold ${saveMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMsg}
              </span>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="ml-auto px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-200 transition-all disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" style={{ minWidth: 700 }}>
              <thead>
                <tr className="bg-orange-600 text-white text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5 text-left font-bold w-52">Category</th>
                  <th className="px-4 py-3.5 text-left font-bold w-60">KPI / Metrics</th>
                  {COLS.map(col => (
                    <th key={col.key} className={`px-3 py-3.5 text-left font-bold ${col.wide ? 'w-56' : 'w-24'}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HR_ROWS.map((row, i) => {
                  const span = SPANS[i];
                  return (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                      {span.showCat && (
                        <td
                          rowSpan={span.catSpan}
                          className="px-4 py-3 text-xs font-semibold text-orange-800 bg-orange-50 border-r border-orange-100 align-middle leading-tight"
                        >
                          {row.category}
                        </td>
                      )}
                      <td className="px-4 py-2 text-xs text-slate-600 border-r border-slate-100">{row.kpiMetric}</td>
                      {COLS.map(col => (
                        <td key={col.key} className="px-2 py-1.5">
                          {col.isRag ? (
                            <select
                              value={entries[i][col.key] || ''}
                              onChange={e => change(i, col.key, e.target.value)}
                              className={`w-full rounded-lg px-2 py-1.5 text-xs border focus:outline-none focus:ring-1 focus:ring-orange-400 ${ragStyle(entries[i][col.key])}`}
                            >
                              <option value="">-</option>
                              <option value="Green">✅ Green</option>
                              <option value="Amber">⚠️ Amber</option>
                              <option value="Red">🔴 Red</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={entries[i][col.key] || ''}
                              onChange={e => change(i, col.key, e.target.value)}
                              placeholder="-"
                              className="w-full rounded-lg px-2 py-1.5 text-xs border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-400"
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom save */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-200 transition-all disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
