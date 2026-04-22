// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// 1. Add updateSupervisor to your imports
const { 
  loginUser, 
  registerUser,  
  getSupervisors,
  updateSupervisor
} = require('../controller/userController'); 
 
// --- AUTH ROUTES ---
router.post('/login', loginUser);
router.post('/register', registerUser);

// --- DATA ROUTES ---
// Fetch supervisors for a specific department
router.get('/supervisors/:dept', getSupervisors);

// Update supervisor details (Name, Shift, or Password)
router.put('/update/:id', updateSupervisor); 

module.exports = router;