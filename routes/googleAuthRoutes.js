const express = require('express');
const { googleAuth } = require('../controllers/googleAuthController');

const router = express.Router();

// Google OAuth login/signup
router.post('/google', googleAuth);

module.exports = router;

