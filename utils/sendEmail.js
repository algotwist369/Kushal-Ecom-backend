const nodemailer = require('nodemailer');

let transporter;
let transporterInitialized = false;

const buildTransporter = () => {
    if (transporterInitialized) {
        return transporter;
    }

    transporterInitialized = true;

    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
    const secure =
        process.env.SMTP_SECURE !== undefined
            ? process.env.SMTP_SECURE === 'true'
            : port === 465;

    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (!host || !user || !pass) {
        console.warn('⚠️ SMTP credentials missing. Emails will be logged instead of sent.');
        transporter = null;
        return transporter;
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass
        }
    });

    return transporter;
};

const normalizePayload = (args) => {
    if (typeof args[0] === 'object') {
        return { ...args[0] };
    }

    const [to, subject, html, overrides = {}] = args;
    return {
        to,
        subject,
        html,
        ...overrides
    };
};

const sendEmail = async (...args) => {
    const payload = normalizePayload(args);

    if (!payload.to) {
        throw new Error('Email recipient (to) is required');
    }

    // Validate email address to prevent email injection
    const validator = require('validator');
    if (!validator.isEmail(payload.to)) {
        throw new Error('Invalid email address format');
    }

    const mailOptions = {
        from:
            payload.from ||
            process.env.SMTP_FROM ||
            `Prolific Healing Herbs <${process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@prolific-healing-herbs.com'}>`,
        to: payload.to,
        subject: payload.subject || '',
        html: payload.html || '',
        text: payload.text,
        attachments: payload.attachments
    };

    const activeTransporter = buildTransporter();

    if (!activeTransporter) {
        console.log('📨 Email (mock send):', {
            to: mailOptions.to,
            subject: mailOptions.subject
        });
        return { mocked: true };
    }

    return activeTransporter.sendMail(mailOptions);
};

module.exports = sendEmail;

