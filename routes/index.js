const express = require('express');
const router = express.Router();

// Importo le route definite in altri file
const authRoutes = require('./auth');

// Collego le route definite in altri file
router.use('/auth', authRoutes);

module.exports = router;
