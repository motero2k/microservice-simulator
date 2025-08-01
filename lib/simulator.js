import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dispatchHttpRequest } from '../src/index.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const collectMicroservices = (step) => {
  const microserviceSet = new Set();
  if (step && step.type === 'http' && step._microservice) {
    microserviceSet.add(step._microservice);
  }
  if (Array.isArray(step.actions)) {
    step.actions.forEach(substep => {
      const subMicroservices = collectMicroservices(substep);
      subMicroservices.forEach(ms => microserviceSet.add(ms));
    });
  }
  return microserviceSet;
};

export async function runSimulation(requests) {
  const microserviceSet = new Set();
  requests.forEach(req => {
    if (req && req.type === 'http') {
      const microservices = collectMicroservices(req);
      microservices.forEach(ms => microserviceSet.add(ms));
    }
  });

  console.log(`Starting microservices: ${Array.from(microserviceSet).map(ms => ms.SERVICE_NAME).join(', ')}`);
  for (const instance of microserviceSet) {
    const child = spawn('node', [path.join(__dirname, '..', 'src', 'index.js')], {
      env: { ...process.env, ...instance },
      stdio: 'inherit',
    });
    child.on('error', err => {
      console.error(`Failed to start service ${instance.SERVICE_NAME}:`, err.message);
    });
  }

  for (const { origin, path, startDelaySeconds, actions } of requests) {
    setTimeout(async () => {
      try {
        console.log(`🔵 Making request to ${origin}${path} after ${startDelaySeconds} seconds`);
        const response = await dispatchHttpRequest({
          origin,
          path,
          method: 'POST',
          actions
        });
        console.log(`🔵 Response from ${origin}${path}:`, response);
      } catch (error) {
        console.error(`Error making request to ${origin}${path}:`, error.message);
      }
    }, startDelaySeconds * 1000);
  }
}