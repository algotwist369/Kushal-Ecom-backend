const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (to, subject, html) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
    });
};

module.exports = sendEmail;
