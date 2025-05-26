import dotenv from 'dotenv';
import { getTransactionId } from './transaction.js';

dotenv.config();

const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'];
const currentLogLevel = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
const serviceName = process.env.SERVICE_NAME || 'ms-sim';

function log(level, ...messages) {
  if (LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(currentLogLevel)) {
    const timestamp = new Date().toISOString();
    const transactionId = getTransactionId() || 'N/A';
    const shortTransactionId = transactionId.split('-')[0];
    console.log(`${timestamp} [${serviceName}] [${level}] [${shortTransactionId}]:`, ...messages);
  }
}

export default {
  debug: (...messages) => log('DEBUG', ...messages),
  info: (...messages) => log('INFO', ...messages),
  warn: (...messages) => log('WARN', ...messages),
  error: (...messages) => log('ERROR', ...messages),
  currentLogLevel
};
