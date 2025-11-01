const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create write streams for different log types
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
    path.join(logsDir, 'error.log'),
    { flags: 'a' }
);

// Custom token for request ID
morgan.token('reqId', (req) => req.id || 'unknown');

// Custom format for access logs
const accessLogFormat = ':reqId :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Access logger
const accessLogger = morgan(accessLogFormat, {
    stream: accessLogStream,
    skip: (req, res) => res.statusCode < 400
});

// Error logger
const errorLogger = morgan(accessLogFormat, {
    stream: errorLogStream,
    skip: (req, res) => res.statusCode < 400
});

// Console logger for development
const consoleLogger = morgan('dev');

// Request ID middleware
const addRequestId = (req, res, next) => {
    req.id = Math.random().toString(36).substr(2, 9);
    res.setHeader('X-Request-ID', req.id);
    next();
};

module.exports = {
    accessLogger,
    errorLogger,
    consoleLogger,
    addRequestId
};
