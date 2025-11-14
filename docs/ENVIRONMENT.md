# Backend Environment Setup Checklist

Before running the server, copy these values into your local `.env` file (the file already exists locally and is git-ignored). Replace every placeholder with real secrets.

| Variable | Purpose | Suggested Value / Notes |
|----------|---------|-------------------------|
| `NODE_ENV` | Enables dev / prod branches in middleware and logging | `development` for local |
| `PORT` | Express listen port | `5000` (or any free port) |
| `MONGODB_URI` | Connection string for MongoDB | e.g. `mongodb://127.0.0.1:27017/prolific-healing-herbs` |
| `JWT_SECRET` | Secret used to sign auth tokens | **Required**: long random string |
| `JWT_EXPIRES_IN` | Token lifetime | `30d` (default if omitted) |
| `FRONTEND_URL` | Public SPA URL for CORS + links | e.g. `http://localhost:5173` |
| `ADMIN_URL` | Admin UI origin | Same as frontend in dev |
| `CLIENT_URL` | Additional allowed UI origin | Optional |
| `ALLOWED_ORIGINS` | Extra comma-separated origins | Optional |
| `BACKEND_URL` | Absolute URL to this API (for asset links) | `http://localhost:5000` |
| `ADMIN_EMAIL` | Notification recipient when users sign up | Your admin inbox |
| `SMTP_HOST` | Mail server hostname | e.g. `smtp.sendgrid.net` |
| `SMTP_PORT` | Mail server port | `587` (STARTTLS) or `465` (SSL) |
| `SMTP_SECURE` | `true` if using port 465 | `false` for STARTTLS |
| `SMTP_USER` | SMTP username / API key | Provided by your mail vendor |
| `SMTP_PASS` | SMTP password | Provided by your mail vendor |
| `SMTP_FROM` | From header used in emails | `"Prolific Healing Herbs <no-reply@yourdomain.com>"` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Required for Google sign-in |
| `RAZORPAY_KEY_ID` | Razorpay public key | Needed to offer online payments |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | Keep this secret |
| `RATE_LIMIT_GENERAL_MAX` | Optional overrides for rate limiter | Defaults: 500 / 50 / 20 |
| `RATE_LIMIT_AUTH_MAX` |  |  |
| `RATE_LIMIT_PAYMENT_MAX` |  |  |
| `UPLOAD_MAX_FILE_SIZE` | Multer max upload size (bytes) | Defaults to 5 MB if omitted |

## Quick Start

1. Duplicate the sample below into `backend/.env`.
2. Substitute the placeholders with your actual credentials.
3. Restart the backend so changes take effect.

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/prolific-healing-herbs

JWT_SECRET=replace_with_long_random_string
JWT_EXPIRES_IN=30d

FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5173
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
BACKEND_URL=http://localhost:5000

ADMIN_EMAIL=admin@ayurvedicstore.com

SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM="Prolific Healing Herbs <no-reply@yourdomain.com>"

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

RAZORPAY_KEY_ID=your_razorpay_public_key
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

RATE_LIMIT_GENERAL_MAX=500
RATE_LIMIT_AUTH_MAX=50
RATE_LIMIT_PAYMENT_MAX=20

UPLOAD_MAX_FILE_SIZE=5242880
```

