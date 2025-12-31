const sendSms = require('../utils/smsService');

// Mock environment variable
process.env.FAST2SMS_API_KEY = 'dummy_key_for_testing';

const main = async () => {
    console.log('Testing sendSms with dummy key...');
    try {
        const response = await sendSms('9999999999', '123456');
        console.log('Response:', response);
    } catch (error) {
        console.log('Expected Error (since key is dummy):', error.message);
        // Fast2SMS returns 200 OK even for auth errors usually, with a message.
        // If it throws network error, we log that too.
    }
};

main();
