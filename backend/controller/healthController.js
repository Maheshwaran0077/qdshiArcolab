const HealthModel = require('../models/Health');

const getHealthData = async (req, res) => {
  try {
    const { month, year, dept, shift } = req.query;
    const query = { month, year: Number(year), dept: dept || 'COMMON', shift: shift || '1' };
    const record = await HealthModel.findOne(query);

    if (!record) return res.status(200).json({ days: [] });
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateHealthDay = async (req, res) => {
  try {
    const { month, year, dept, shift, date, status, keypoints, attendance } = req.body;
    if (!month || !year || !date || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const filter = { month, year: Number(year), dept: dept || 'COMMON', shift: shift || '1' };
    let record   = await HealthModel.findOne(filter);

    if (!record) {
      const initialDays = Array.from({ length: 31 }, (_, i) => ({
        date: i + 1, status: null, keypoints: '', attendance: ''
      }));
      record = new HealthModel({ ...filter, days: initialDays });
    }

    const dayIndex = record.days.findIndex(d => d.date === Number(date));
    if (dayIndex !== -1) {
      record.days[dayIndex] = { date: Number(date), status, keypoints: keypoints || '', attendance: attendance || '' };
    } else {
      return res.status(400).json({ message: `Invalid date: ${date}` });
    }

    await record.save();
    res.status(200).json({ message: 'Updated successfully', record });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const msgs = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: `Validation Error: ${msgs.join(', ')}` });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getHealthData, updateHealthDay };