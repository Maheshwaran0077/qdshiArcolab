const express = require('express');
const router = express.Router();
const Metric = require('../models/Metrics');

// Professional Label Helper
const getLabel = (letter, dept) => {
  const deptMap = { 
    fg: 'Finished Good', 
    pm: 'Packing Material', 
    rm: 'Raw Material', 
    pp: 'Primary Packing' 
  };
  const dName = deptMap[dept] || 'General';
  
  const typeMap = { 
    Q: 'Quality', 
    D: dept === 'pp' ? 'Production' : 'Dispatch', 
    S: 'Safety', 
    H: 'Health', 
    I: 'Innovation' 
  };
  return `${dName} ${typeMap[letter] || 'Metric'}`;
};

// GET Metrics (Filtered by Shift & Dept)
router.get('/', async (req, res) => {
  try {
    const { shift, dept } = req.query;
    const query = dept ? { dept } : {};
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

// POST Update Metrics (Universal for all depts)
router.post('/update', async (req, res) => {
  const { letter, dept = 'fg', shift, daysData, alerts, success, issueLogs } = req.body;
  if (!shift) return res.status(400).json({ error: "Shift is required" });

  try {
    const updated = await Metric.findOneAndUpdate(
      { letter, dept },
      { 
        $setOnInsert: { label: getLabel(letter, dept) },
        $set: {
          [`shifts.${shift}.daysData`]: daysData ?? [],
          [`shifts.${shift}.alerts`]: alerts ?? 0,
          [`shifts.${shift}.success`]: success ?? 0,
          [`shifts.${shift}.issueLogs`]: issueLogs ?? [],
        }
      },
      { upsert: true, new: true }
    );

    const sd = updated.shifts[shift];
    res.json({
      _id: updated._id,
      letter: updated.letter,
      dept: updated.dept,
      label: updated.label,
      ...sd.toObject() // Return current shift data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Staff Logs
router.post('/staff', async (req, res) => {
  const { letter, dept = 'fg', shift, logs } = req.body;
  if (!shift) return res.status(400).json({ error: 'shift is required' });
  
  try {
    const updated = await Metric.findOneAndUpdate(
      { letter, dept },
      { $set: { [`shifts.${shift}.staffLogs`]: logs ?? [] } },
      { upsert: true, new: true }
    );
    res.json(updated.shifts[shift].staffLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Activity Logs
router.post('/activity', async (req, res) => {
  const { letter, dept = 'fg', shift, logs } = req.body;
  if (!shift) return res.status(400).json({ error: 'shift is required' });
  
  try {
    const updated = await Metric.findOneAndUpdate(
      { letter, dept },
      { $set: { [`shifts.${shift}.activityLogs`]: logs ?? [] } },
      { upsert: true, new: true }
    );
    res.json(updated.shifts[shift].activityLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;