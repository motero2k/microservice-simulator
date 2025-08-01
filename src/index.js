import express from 'express';
import axios from 'axios';
import { NodeVM } from 'vm2';
import { transactionMiddleware } from './utils/middleware.js';
import logger from './utils/logger.js';
import oasTelemetry from '@oas-tools/oas-telemetry';

const app = express();
const port = process.env.PORT || 8080;
const serviceName = process.env.SERVICE_NAME || 'microservice-simulator';

app.use(oasTelemetry());
app.use(transactionMiddleware);

app.use(async (req, res, next) => {
  const simulationPayload = req.headers['x-simulation-payload'];

  if (!simulationPayload) {
    return res
      .status(400)
      .json({ error: 'Missing X-Simulation-Payload header' });
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(simulationPayload, 'base64').toString('utf8')
    );

    const actions = Array.isArray(decoded) ? decoded : [decoded];

    const results = await processActions(actions);
    return res.json(results);
  } catch (err) {
    logger.error('Error decoding X-Simulation-Payload:', err.message);
    return res.status(400).json({ error: 'Invalid simulation payload' });
  }
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: serviceName });
});

app.get('/api/v1/greet', (req, res) => {
  const name = req.query.name || 'World';
  res.json({ message: `Hello, ${name}!` });
});

async function processActions(actions, parentContext) {
  const context = parentContext || {};

  for (const action of actions) {
    const repeat = action.repeat || 1;
    for (let i = 0; i < repeat; i++) {
      const processAction = async () => {
        if (action.verbose) {
          logger.info(`Processing action: ${JSON.stringify(action.type)}`);
        }

        switch (action.type) {
          case 'set':
            context[action.key] = action.value;
            return { status: 'set', key: action.key, value: action.value };
          case 'code':
            return await executeCode(action.source, context);
          case 'http':
            return await dispatchHttpRequest(action, context);
          case 'wait':
            await new Promise((resolve) =>
              setTimeout(resolve, action.duration || 1000)
            );
            return { status: 'waited', duration: action.duration || 1000 };
          case 'log':
            logger.info(action.message || 'No message provided');
            return {
              status: 'logged',
              message: action.message || 'No message provided',
            };
          case 'return':
            return resolveReturn(action.data, context); // Immediately return the resolved value
          case 'multi':
            // Recursively process grouped actions
            return await processActions(action.actions, context);
          default:
            logger.warn('Unknown action type:', action.type);
            return { error: `Unknown action type: ${action.type}` };
        }
      };

      if (action.wait === false) {
        processAction()
          .then((result) => {
            if (action.type === 'return') {
              return result; // Return result immediately for non-awaited return actions
            }
          })
          .catch((err) => {
            logger.error('Error in non-awaited action:', err.message);
          });
      } else {
        try {
          const result = await processAction();
          if (action.type === 'return') {
            return result; // Stop processing further actions
          }
        } catch (err) {
          logger.error('Error processing action:', err);
          return { error: err.message }; // Return error immediately
        }
      }
    }
  }

  return []; // Return an empty array if no actions are processed
}

function resolveReturn(data, context) {
  if (typeof data === 'string') {
    return interpolate(data, context);
  }
  if (typeof data === 'object' && data !== null) {
    const result = Array.isArray(data) ? [] : {};
    for (const key in data) {
      result[key] = resolveReturn(data[key], context);
    }
    return result;
  }
  return data;
}

function interpolate(str, context) {
  return str.replace(/\$\{([^}]+)\}/g, (_, key) => context[key] ?? '');
}

async function executeCode(source, context) {
  const vm = new NodeVM({
    console: 'inherit',
    sandbox: { logger, axios, context },
    require: {
      external: false,
    },
    timeout: 3000,
  });

  return await vm.run(source);
}

export async function dispatchHttpRequest({ origin, path, method = 'GET', headers = {}, actions = [], saveToContext }, context) {
  const url = `${origin}${path}`;
  const customHeaders = {
    ...headers,
    'X-Simulation-Payload': Buffer.from(JSON.stringify(actions)).toString('base64'),
  };

  try {
    const response = await axios({
      url,
      method,
      headers: customHeaders,
      validateStatus: () => true,
    });

    const result = response.data;

    if (saveToContext) {
      if (result) {
        context[saveToContext] = result;
      } else {
        logger.warn(`No valid data found in response to save under key: ${saveToContext}`);
      }
    }

    return result;
  } catch (error) {
    logger.error(`Error during HTTP request to ${url}:`, error.message);
    throw error;
  }
}

app.listen(port, () => {
  logger.info(`🤖 microservice-simulator listening at http://localhost:${port}`);
});
