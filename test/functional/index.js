import { readFile } from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  try {
    // Read and parse infrastructure configuration
    const infraPath = path.join(__dirname, 'instances.json');
    const infra = JSON.parse(await readFile(infraPath, 'utf-8'));

    // Start infrastructure services
    for (const instance of infra) {
      const child = spawn('node', [path.join(__dirname, '..', '..', 'src', 'index.js')], {
        env: { ...process.env, ...instance },
        stdio: 'inherit',
      });

      child.on('error', (err) => {
        console.error(`Failed to start service ${instance.name}:`, err.message);
      });
    }

    // Read and parse requests configuration
    const requestsPath = path.join(__dirname, 'requests.json');
    const requests = JSON.parse(await readFile(requestsPath, 'utf-8'));

    // Execute requests with delays
    for (const { target, startDelaySeconds, body } of requests) {
      setTimeout(async () => {
        try {
          console.log(`🔵 Making request to ${target} after ${startDelaySeconds} seconds`);
          const response = await fetch(target + "/api/v1/execute", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
        } catch (error) {
          console.error(`Error making request to ${target}:`, error.message);
        }
      }, startDelaySeconds * 1000);
    }
  } catch (error) {
    console.error('There was an error:', error.message);
  }
}

main();