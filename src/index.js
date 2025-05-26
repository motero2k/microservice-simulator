import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { NodeVM } from 'vm2';
import { transactionMiddleware } from './utils/middleware.js';
import logger from './utils/logger.js';
import oasTelemetry from '@oas-tools/oas-telemetry';

const app = express();
const port = process.env.PORT || 8080;
const serviceName = process.env.SERVICE_NAME || 'microservice-simulator';

app.use(oasTelemetry())
app.use(bodyParser.json());
app.use(transactionMiddleware);


app.post('/api/v1/execute', async (req, res) => {
  const actions = req.body;

  if (!Array.isArray(actions)) {
    logger.error('Invalid request body: must be an array of actions');
    return res.status(400).json({ error: 'Request body must be an array of actions' });
  }

  try {
    const results = await processActions(actions);
    res.json({ results });
  } catch (err) {
    logger.error('Error processing actions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: serviceName});
}
);

app.get('/api/v1/greet', (req, res) => {
  const name = req.query.name || 'World';
  res.json({ message: `Hello, ${name}!` });
}
);

async function processActions(actions) {
    const results = [];

    for (const action of actions) {
      const repeat = action.repeat || 1;
      for (let i = 0; i < repeat; i++) {
        const processAction = async () => {
          if (action.verbose) {
            logger.info(`Processing action: ${JSON.stringify(action.type)}`);
          }

          switch (action.type) {
            case 'code':
              return await executeCode(action.source);
            case 'http':
              return await forwardRequest(action);
            case 'wait':
              await new Promise(resolve => setTimeout(resolve, action.duration || 1000));
              return { status: 'waited', duration: action.duration || 1000 };
            case 'log':
              logger.info(action.message || 'No message provided');
              return { status: 'logged', message: action.message || 'No message provided' };
            case 'return':
              return action.data || null;
            default:
              logger.warn('Unknown action type:', action.type);
              return { error: `Unknown action type: ${action.type}` };
          }
        };

        if (action.await === false) {
          processAction().then(result => {
            if (action.type === 'return') {
              results.push(result);
            }
          }).catch(err => {
            logger.error('Error in non-awaited action:', err.message);
            results.push({ error: err.message });
          });
        } else {
          try {
            const result = await processAction();
            if (action.type === 'return') {
              results.push(result);
            }
          } catch (err) {
            logger.error('Error processing action:', err.message);
            results.push({ error: err.message });
          }
        }
      }
    }

    return results;
  }

async function executeCode(source) {
    const vm = new NodeVM({
      console: 'inherit',
      sandbox: { logger, fetch },
      require: {
        external: false
      },
      timeout: 3000
    });

    return await vm.run(`
        module.exports = (async function() {
            ${source}
        })();
    `);
  }

async function forwardRequest({ url, method = 'POST', headers = {}, body }) {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));
    return data.results || data;
  }

app.listen(port, () => {
  logger.info(`🤖 microservice-simulator listening at http://localhost:${port}`);
  });
