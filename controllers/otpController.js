const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateToken } = require('../utils/generateToken');
const { handleAsync } = require('../utils/handleAsync');

const sendSms = require('../utils/smsService');

/**
 * Send OTP to mobile number
 */
const sendOtp = handleAsync(async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to database (upsert to replace existing OTP for same phone)
    await Otp.findOneAndDelete({ phone }); // Remove old OTP if exists
    await Otp.create({ phone, otp });

    // Send SMS via Fast2SMS
    try {
        const smsResponse = await sendSms(phone, otp);
        console.log('Fast2SMS Response:', JSON.stringify(smsResponse, null, 2));
    } catch (error) {
        console.error('Failed to send SMS:', error);
        // We continue even if SMS fails in dev mode, but in prod we might want to alert
    }

    // Keep logging for debugging in all environments for now, or restrict to dev
    console.log(`OTP for ${phone} is ${otp}`);

    res.json({
        message: 'OTP sent successfully',
        // In production, DO NOT return the OTP in the response
        debugOtp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
});

/**
 * Verify OTP and Login/Register User
 */
const verifyOtp = handleAsync(async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    // Check if OTP matches
    const validOtp = await Otp.findOne({ phone, otp });

    if (!validOtp) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP is valid - process login/registration
    let user = await User.findOne({ phone });

    if (!user) {
        // User doesn't exist - create new user
        // We need to generate placeholder data for required fields (email, name, password)
        const randomString = Math.random().toString(36).substring(7);
        const name = `User-${phone.slice(-4)}`;
        // Use a dummy email that is unique
        const email = `${phone}@mobile-login.placeholder`;

        // Generate secure random password (Uppercase + Lowercase + Number)
        const password = `M${Math.random().toString(36).slice(-8)}1!`;

        user = await User.create({
            name,
            email,
            phone,
            password,
            isActive: true,
            role: 'user'
        });
    } else {
        // User exists - check if active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is inactive' });
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save({ validateBeforeSave: false });
    }

    // Delete used OTP
    await Otp.deleteOne({ _id: validOtp._id });

    // Return token and user info
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
        message: 'Login successful'
    });
});

module.exports = {
    sendOtp,
    verifyOtp
};
