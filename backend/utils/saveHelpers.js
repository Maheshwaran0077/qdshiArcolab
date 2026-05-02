const TimeLock        = require('../models/TimeLock');
const AuditLog        = require('../models/AuditLog');
const HodNotification = require('../models/HodNotification');
const User            = require('../models/User');

const MODULE_NAMES = { Q: 'Quality', D: 'Delivery', S: 'Safety', H: 'Health' };

// Returns { allowed: true } or { allowed: false, message }
const checkTimeLock = async (dept, shift) => {
  try {
    const lock = await TimeLock.findOne({ dept, shift, enabled: true });
    if (!lock) return { allowed: true };

    const now = new Date();
    const h   = String(now.getHours()).padStart(2, '0');
    const m   = String(now.getMinutes()).padStart(2, '0');
    const cur = `${h}:${m}`;

    if (cur >= lock.startTime && cur <= lock.endTime) return { allowed: true };

    return {
      allowed: false,
      message: `Outside edit window for ${dept.toUpperCase()} Shift ${shift} (${lock.startTime}–${lock.endTime}). Current time: ${cur}`,
    };
  } catch {
    return { allowed: true }; // fail open so saves still work if DB is down
  }
};

const createAuditLog = async ({ date, empId, empName, dept, shift, module, deptType }) => {
  try {
    await AuditLog.create({
      date, empId, empName, dept, shift,
      module: module || null,
      deptType: deptType || 'special',
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('AuditLog error:', err.message);
  }
};

// Finds the HOD whose department field contains `dept` (handles comma-separated assignments)
// and creates a notification with full details.
const notifyHod = async ({ empId, empName, dept, shift, module, deptType, date }) => {
  try {
    // Regex matches "fgmw" inside "fgmw", "fgmw,pmw", "pmw,fgmw", etc.
    const deptRegex = new RegExp(`(^|,)\\s*${dept}\\s*(,|$)`, 'i');
    const hod = await User.findOne({ role: 'hod', department: { $regex: deptRegex } });
    if (!hod) return;

    const now       = new Date();
    const dateStr   = date || now.toISOString().split('T')[0];
    const timeStr   = now.toTimeString().slice(0, 5); // HH:MM
    const modName   = module ? `${module} — ${MODULE_NAMES[module] || module}` : 'Update';

    const msg = [
      `Emp: ${empName} (${empId})`,
      `Dept: ${dept.toUpperCase()}`,
      `Shift: ${shift}`,
      `Module: ${modName}`,
      `Date: ${dateStr}`,
      `Time: ${timeStr}`,
    ].join(' | ');

    await HodNotification.create({
      hodDept:   dept,
      empId,
      empName,
      dept,
      shift,
      module:    module    || null,
      deptType:  deptType  || 'qdsh',
      message:   msg,
      timestamp: now,
      read:      false,
    });
  } catch (err) {
    console.error('HodNotification error:', err.message);
  }
};

module.exports = { checkTimeLock, createAuditLog, notifyHod };
