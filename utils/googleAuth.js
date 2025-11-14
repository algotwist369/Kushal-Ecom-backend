const { OAuth2Client } = require('google-auth-library');

let client;

const getClient = () => {
    if (!client) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            throw new Error('Google OAuth client ID not configured');
        }
        client = new OAuth2Client(clientId);
    }
    return client;
};

const verifyGoogleToken = async (credential) => {
    if (!credential) {
        throw new Error('Google credential is required');
    }

    const ticket = await getClient().verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        throw new Error('Unable to retrieve Google account information');
    }

    return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture
    };
};

module.exports = { verifyGoogleToken };

