const crypto = require('crypto');

const DEFAULT_LENGTH = 8;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateCouponCode = (length = DEFAULT_LENGTH) => {
    if (!Number.isFinite(length) || length <= 0) {
        length = DEFAULT_LENGTH;
    }

    let code = '';
    for (let i = 0; i < length; i += 1) {
        const randomIndex = crypto.randomInt(0, ALPHABET.length);
        code += ALPHABET[randomIndex];
    }
    return code;
};

module.exports = generateCouponCode;

