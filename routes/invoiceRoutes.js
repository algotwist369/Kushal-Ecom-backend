const express = require('express');
const { downloadInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/download/:id', protect, downloadInvoice);

module.exports = router;
