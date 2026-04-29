const express           = require('express');
const router            = express.Router();
const EngineeringEntry  = require('../models/EngineeringEntry');

// GET /api/engineering?date=YYYY-MM-DD&shift=1
router.get('/', async (req, res) => {
  const { date, shift } = req.query;
  if (!date || !shift) return res.status(400).json({ error: 'date and shift are required' });
  try {
    const doc = await EngineeringEntry.findOne({ date, shift });
    res.json({ entries: doc ? doc.entries : [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/engineering/save
router.post('/save', async (req, res) => {
  const { date, shift, entries } = req.body;
  if (!date || !shift || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'date, shift and entries are required' });
  }
  try {
    await EngineeringEntry.findOneAndUpdate(
      { date, shift },
      { $set: { entries } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
