const express = require('express');
const router  = express.Router();
const {
  getHealthData,
  updateHealthDay,
  getCutoffSettings,
  setCutoffTime,
  grantOverride,
  revokeOverride,
} = require('../controller/healthController');

router.get('/',                 getHealthData);
router.post('/update',          updateHealthDay);
router.get('/cutoff',           getCutoffSettings);
router.put('/cutoff/time',      setCutoffTime);
router.post('/cutoff/override', grantOverride);
router.delete('/cutoff/override', revokeOverride);

module.exports = router;
