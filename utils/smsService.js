const https = require('https');
require('dotenv').config();
 
const sendSms = (phone, otp) => {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.FAST2SMS_API_KEY;

        if (!apiKey) {
            console.error('FAST2SMS_API_KEY is missing in environment variables');
            // Check if we should fail or just log in dev
            if (process.env.NODE_ENV === 'production') {
                return reject(new Error('SMS service configuration missing'));
            } else {
                console.log('Skipping SMS send (missing API key)');
                return resolve({ message: 'SMS simulation successful (missing key)' });
            }
        }

        const postData = JSON.stringify({
            "route": "otp",
            "variables_values": otp,
            "numbers": phone,
        });

        const options = {
            "method": "POST",
            "hostname": "www.fast2sms.com",
            "port": null,
            "path": "/dev/bulkV2",
            "headers": {
                "authorization": apiKey,
                "Content-Type": "application/json",
                "Content-Length": postData.length
            }
        };

        const req = https.request(options, function (res) {
            const chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                const body = Buffer.concat(chunks);
                const responseString = body.toString();

                try {
                    const jsonResponse = JSON.parse(responseString);
                    resolve(jsonResponse);
                } catch (e) {
                    // Fallback if not JSON
                    resolve({ raw: responseString });
                }
            });
        });

        req.on('error', (e) => {
            console.error('Fast2SMS Error:', e);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
};

module.exports = sendSms;
