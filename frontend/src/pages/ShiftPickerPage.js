import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SHIFT_COLORS = {
  '1': { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', shadow: 'shadow-emerald-200', label: 'Morning Shift' },
  '2': { bg: 'bg-blue-600',    hover: 'hover:bg-blue-700',    shadow: 'shadow-blue-200',    label: 'Afternoon Shift' },
  '3': { bg: 'bg-violet-600',  hover: 'hover:bg-violet-700',  shadow: 'shadow-violet-200',  label: 'Night Shift' },
};

const DEPT_LABELS = {
  q: 'Quality',
  d: 'Delivery',
  s: 'Safety',
  h: 'Health',
};

const ShiftPickerPage = ({ dept }) => {
  const navigate = useNavigate();
  const deptLabel = DEPT_LABELS[dept] || dept.toUpperCase();

  return (
    <div className="min-h-screen bg-emerald-50/20 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Arcolab QDSHI Tracker</p>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{deptLabel}</h1>
        <p className="text-slate-500 text-sm font-medium mt-2">Select a shift to view its data</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-xl">
        {['1', '2', '3'].map((shift, i) => {
          const color = SHIFT_COLORS[shift];
          return (
            <motion.button
              key={shift}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              onClick={() => navigate(`/shift${shift}/${dept}`)}
              className={`flex-1 ${color.bg} ${color.hover} text-white rounded-2xl py-10 flex flex-col items-center gap-3 shadow-xl ${color.shadow} transition-all active:scale-95`}
            >
              <span className="text-5xl font-black">{shift}</span>
              <span className="text-xs font-bold uppercase tracking-widest">{color.label}</span>
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={() => navigate('/')}
        className="mt-10 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 transition"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
};

export default ShiftPickerPage;
