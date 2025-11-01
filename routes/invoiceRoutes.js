const express = require('express');
const { downloadInvoice } = require('../controllers/invoiceController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Download invoice - user can download their own, admin can download any
router.get('/download/:id', protect, downloadInvoice);

module.exports = router;
