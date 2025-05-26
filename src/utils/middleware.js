import { v4 as uuidv4 } from 'uuid';
import { runWithTransaction } from './transaction.js';

export const transactionMiddleware = (req, res, next) => {
  const transactionId = req.headers['x-transaction-id'] || uuidv4();

  runWithTransaction(transactionId, () => {
    next();
  });
};
