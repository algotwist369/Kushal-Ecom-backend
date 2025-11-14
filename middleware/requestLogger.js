const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const { randomUUID } = require('crypto');

const ensureLogDirectory = () => {
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    return logsDir;
};

const createLogStream = (fileName) => {
    const logsDir = ensureLogDirectory();
    const filePath = path.join(logsDir, fileName);
    return fs.createWriteStream(filePath, { flags: 'a' });
};

morgan.token('request-id', (req) => req.id || '-');

const addRequestId = (req, res, next) => {
    req.id = req.id || randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
};

const accessLogger = morgan(
    ':remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :request-id',
    {
        stream: createLogStream('access.log')
    }
);

const consoleLogger = (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${
            res.statusCode
        } (${durationMs.toFixed(2)} ms) id=${req.id}`;
        console.log(logMessage);
    });
    next();
};

const errorLogStream = createLogStream('error.log');

const errorLogger = (err, req, res, next) => {
    const logEntry = JSON.stringify(
        {
            timestamp: new Date().toISOString(),
            id: req.id,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            message: err.message,
            stack: err.stack
        },
        null,
        2
    );

    errorLogStream.write(`${logEntry}\n`);

    if (process.env.NODE_ENV !== 'production') {
        console.error('Request error:', logEntry);
    }

    next(err);
};

module.exports = {
    addRequestId,
    accessLogger,
    errorLogger,
    consoleLogger
};

