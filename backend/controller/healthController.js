const HealthModel  = require('../models/Health');
const HealthCutoff = require('../models/HealthCutoff');

// --- helpers ---

const getCutoffDoc = async () => {
  let doc = await HealthCutoff.findOne();
  if (!doc) doc = await HealthCutoff.create({ cutoffTime: '17:00', overrides: [] });
  return doc;
};

const isAfterCutoff = (cutoffTime) => {
  const [cutH, cutM] = cutoffTime.split(':').map(Number);
  const now = new Date();
  return now.getHours() > cutH || (now.getHours() === cutH && now.getMinutes() >= cutM);
};

const hasOverride = (overrides, date, month, year, dept, shift) =>
  overrides.some(
    o =>
      o.date  === Number(date)  &&
      o.month === month         &&
      o.year  === Number(year)  &&
      o.dept  === dept          &&
      o.shift === shift,
  );

// --- controllers ---

const getHealthData = async (req, res) => {
  try {
    const { month, year, dept, shift } = req.query;
    const record = await HealthModel.findOne({
      month, year: Number(year), dept: dept || 'fg', shift: shift || '1',
    });
    if (!record) return res.status(200).json({ days: [] });
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateHealthDay = async (req, res) => {
  try {
    const {
      month, year, dept, shift, date,
      status, keypoints, attendance, attendees, totalStrength,
      userRole,
    } = req.body;

    if (!month || !year || !date || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const d = dept  || 'fg';
    const s = shift || '1';

    // Cutoff check: after cutoff time, non-superadmin cannot update any entry without override
    if (userRole !== 'superadmin') {
      const cutoffDoc = await getCutoffDoc();
      if (isAfterCutoff(cutoffDoc.cutoffTime) && !hasOverride(cutoffDoc.overrides, date, month, year, d, s)) {
        return res.status(403).json({
          message: `Cutoff time (${cutoffDoc.cutoffTime}) has passed. Contact Super Admin for access.`,
        });
      }
    }

    const filter = { month, year: Number(year), dept: d, shift: s };
    let record = await HealthModel.findOne(filter);

    if (!record) {
      const initialDays = Array.from({ length: 31 }, (_, i) => ({
        date: i + 1, status: null, keypoints: '',
        attendance: '', attendees: null, totalStrength: null,
      }));
      record = new HealthModel({ ...filter, days: initialDays });
    }

    const dayIndex = record.days.findIndex(day => day.date === Number(date));
    if (dayIndex === -1) return res.status(400).json({ message: `Invalid date: ${date}` });

    record.days[dayIndex] = {
      date:          Number(date),
      status,
      keypoints:     keypoints     || '',
      attendance:    attendance    || '',
      attendees:     attendees     != null ? Number(attendees)     : null,
      totalStrength: totalStrength != null ? Number(totalStrength) : null,
    };

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

const getCutoffSettings = async (req, res) => {
  try {
    const doc = await getCutoffDoc();
    res.status(200).json({ cutoffTime: doc.cutoffTime, overrides: doc.overrides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setCutoffTime = async (req, res) => {
  try {
    const { cutoffTime, userRole } = req.body;
    if (userRole !== 'superadmin') return res.status(403).json({ message: 'Super Admin only' });
    if (!/^\d{2}:\d{2}$/.test(cutoffTime)) return res.status(400).json({ message: 'Invalid time format. Use HH:MM' });
    const doc = await getCutoffDoc();
    doc.cutoffTime = cutoffTime;
    await doc.save();
    res.status(200).json({ message: 'Cutoff time updated', cutoffTime: doc.cutoffTime });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const grantOverride = async (req, res) => {
  try {
    const { userRole, date, month, year, dept, shift } = req.body;
    if (userRole !== 'superadmin') return res.status(403).json({ message: 'Super Admin only' });
    const d = dept || 'fg';
    const s = shift || '1';
    const doc = await getCutoffDoc();
    if (!hasOverride(doc.overrides, date, month, year, d, s)) {
      doc.overrides.push({ date: Number(date), month, year: Number(year), dept: d, shift: s });
      await doc.save();
    }
    res.status(200).json({ message: 'Override granted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const revokeOverride = async (req, res) => {
  try {
    const { userRole, date, month, year, dept, shift } = req.body;
    if (userRole !== 'superadmin') return res.status(403).json({ message: 'Super Admin only' });
    const d = dept || 'fg';
    const s = shift || '1';
    const doc = await getCutoffDoc();
    doc.overrides = doc.overrides.filter(
      o => !(o.date === Number(date) && o.month === month && o.year === Number(year) && o.dept === d && o.shift === s),
    );
    await doc.save();
    res.status(200).json({ message: 'Override revoked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getHealthData, updateHealthDay, getCutoffSettings, setCutoffTime, grantOverride, revokeOverride };
