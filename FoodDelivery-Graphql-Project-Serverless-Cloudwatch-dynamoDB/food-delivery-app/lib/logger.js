const { createLogger, transports, format } = require("winston");
const { timestamp, combine, printf, errors, json } = format;
const logger = createLogger({
  level: "debug",
  format: combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: { service: "service" },
  transports: [
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new transports.Console(),
  ],
});
module.exports = logger;
