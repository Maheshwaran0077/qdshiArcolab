const express = require('express');
const router = express.Router();
const Metric = require('../models/Metrics');


// ✅ Central Department Config (Single Source of Truth)
const DEPT_CONFIG = {
  fgmw: 'Finished Goods Warehouse',
  pmw: 'Packing Material Warehouse',
  rmw: 'Raw Material Warehouse',
  ppp: 'Primary Packing Production',
  pop: 'Post Production',
  qcmad: 'QC & Microbiology Lab',
  pro: 'Production',
  spp: 'Secondary Packing Production',
  fac: 'Facilities',
  unknown: 'Unassigned Department'
};


// ✅ Metric Type Mapping (QDSHI)
const TYPE_MAP = {
  Q: 'Quality',
  D: 'Delivery',
  S: 'Safety',
  H: 'Health',
  I: 'Improvement'
};


// ✅ Smart Label Generator
const getLabel = (letter, dept) => {
  const deptName = DEPT_CONFIG[dept] || 'General';

  // Special logic for production-type departments
  const isProductionDept = ['ppp', 'pro', 'spp'].includes(dept);

  const typeLabel =
    letter === 'D'
      ? (isProductionDept ? 'Production' : 'Dispatch')
      : TYPE_MAP[letter] || 'Metric';

  return `${deptName} ${typeLabel}`;
};



// ✅ GET Metrics (Filtered by Shift & Dept)
router.get('/', async (req, res) => {
  try {
    const { shift, dept } = req.query;

    const query = {};
    if (dept) query.dept = dept;

    const metrics = await Metric.find(query);

    if (!shift) return res.json(metrics);

    const shiftMetrics = metrics.map(m => {
      const shiftData = m.shifts?.[shift] || {};

      return {
        _id: m._id,
        letter: m.letter,
        dept: m.dept,
        label: m.label || getLabel(m.letter, m.dept),

        alerts: shiftData.alerts ?? 0,
        success: shiftData.success ?? 0,

        daysData: shiftData.daysData ?? [],
        issueLogs: shiftData.issueLogs ?? [],
        staffLogs: shiftData.staffLogs ?? [],
        activityLogs: shiftData.activityLogs ?? [],
      };
    });

    res.json(shiftMetrics);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ✅ POST Update Metrics (Universal)
router.post('/update', async (req, res) => {
  const {
    letter,
    dept,
    shift,
    daysData,
    alerts,
    success,
    issueLogs
  } = req.body;

  // 🔴 Strict Validation (important)
  if (!shift) return res.status(400).json({ error: "Shift is required" });
  if (!dept || !DEPT_CONFIG[dept])
    return res.status(400).json({ error: "Invalid department" });

  try {
    const updated = await Metric.findOneAndUpdate(
      { letter, dept },
      {
        $setOnInsert: {
          label: getLabel(letter, dept)
        },
        $set: {
          [`shifts.${shift}.daysData`]: daysData ?? [],
          [`shifts.${shift}.alerts`]: alerts ?? 0,
          [`shifts.${shift}.success`]: success ?? 0,
          [`shifts.${shift}.issueLogs`]: issueLogs ?? [],
        }
      },
      { upsert: true, new: true }
    );

    const sd = updated.shifts?.[shift] || {};

    res.json({
      _id: updated._id,
      letter: updated.letter,
      dept: updated.dept,
      label: updated.label,
      ...sd.toObject?.() || sd
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ✅ POST Staff Logs
router.post('/staff', async (req, res) => {
  const { letter, dept, shift, logs } = req.body;

  if (!shift) return res.status(400).json({ error: 'Shift is required' });
  if (!dept || !DEPT_CONFIG[dept])
    return res.status(400).json({ error: 'Invalid department' });

  try {
    const updated = await Metric.findOneAndUpdate(
      { letter, dept },
      {
        $setOnInsert: { label: getLabel(letter, dept) },
        $set: { [`shifts.${shift}.staffLogs`]: logs ?? [] }
      },
      { upsert: true, new: true }
    );

    res.json(updated.shifts?.[shift]?.staffLogs || []);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ✅ POST Activity Logs
router.post('/activity', async (req, res) => {
  const { letter, dept, shift, logs } = req.body;

  if (!shift) return res.status(400).json({ error: 'Shift is required' });
  if (!dept || !DEPT_CONFIG[dept])
    return res.status(400).json({ error: 'Invalid department' });

  try {
    const updated = await Metric.findOneAndUpdate(
      { letter, dept },
      {
        $setOnInsert: { label: getLabel(letter, dept) },
        $set: { [`shifts.${shift}.activityLogs`]: logs ?? [] }
      },
      { upsert: true, new: true }
    );

    res.json(updated.shifts?.[shift]?.activityLogs || []);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;