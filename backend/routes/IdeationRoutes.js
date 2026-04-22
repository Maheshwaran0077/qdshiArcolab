const express = require('express');
const router  = express.Router();

router.get('/config', (req, res) => {
  res.json({
    sheetCsvUrl: process.env.GOOGLE_SHEET_CSV_URL,
    entries: {
      empId:      process.env.FORM_ENTRY_EMPID,
      problem:    process.env.FORM_ENTRY_PROBLEM,
      solution:   process.env.FORM_ENTRY_SOLUTION,
      benefit:    process.env.FORM_ENTRY_BENEFIT,
      department: process.env.FORM_ENTRY_DEPT,
    }
  });
});

router.post('/submit', async (req, res) => {
  try {
    const { empId, problem, solution, benefits, department } = req.body;
    const entries = {
      empId:      process.env.FORM_ENTRY_EMPID,
      problem:    process.env.FORM_ENTRY_PROBLEM,
      solution:   process.env.FORM_ENTRY_SOLUTION,
      benefit:    process.env.FORM_ENTRY_BENEFIT,
      department: process.env.FORM_ENTRY_DEPT,
    };

    const params = new URLSearchParams();
    params.append(entries.empId,      empId);
    params.append(entries.problem,    problem);
    params.append(entries.solution,   solution);
    params.append(entries.department, department);
    (Array.isArray(benefits) ? benefits : [benefits]).forEach(b => params.append(entries.benefit, b));

    const response = await fetch(process.env.GOOGLE_FORM_URL, {
      method:   'POST',
      headers:  { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:     params.toString(),
      redirect: 'manual',
    });

    if ([200, 302].includes(response.status) || response.type === 'opaqueredirect') {
      return res.json({ success: true });
    }
    res.status(500).json({ success: false, message: `Form returned status ${response.status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/download', async (req, res) => {
  try {
    const response = await fetch(process.env.GOOGLE_SHEET_CSV_URL);
    if (!response.ok) {
      // If CSV export fails, redirect to the Google Sheet view
      return res.redirect('https://docs.google.com/spreadsheets/d/1lMRG2n23GSlHGymELXn7HDguAqqOELymMvu71wgq1L8/edit?usp=sharing');
    }
    const csv = await response.text();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ideation-export.csv"');
    res.send(csv);
  } catch (err) {
    // If there's an error, redirect to the Google Sheet view
    res.redirect('https://docs.google.com/spreadsheets/d/1lMRG2n23GSlHGymELXn7HDguAqqOELymMvu71wgq1L8/edit?usp=sharing');
  }
});

module.exports = router;