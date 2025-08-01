# Microservice Simulator

The **Microservice Simulator** lets you simulate a distributed Node.js microservice architecture by running multiple service instances and orchestrating complex workflows between them. You define and execute workflows involving HTTP requests, delays, logging, and code execution using a developer-friendly JavaScript API, making it a powerful tool for testing and prototyping microservice interactions.

## Key Features

- **Multi-Instance Simulation**: Easily spin up multiple simulated microservices, each with its own configuration.
- **Flexible Workflow Builder**: Compose workflows using a modern JavaScript API.
- **Chained and Asynchronous Actions**: Workflows can trigger nested requests, custom code, and more.
- **Code-First Configuration**: Define all workflows and microservice setups programmatically.

## How It Works

You define workflows as arrays of actions (steps), which can include:

- Sending HTTP requests to other simulated microservices.
- Executing custom JavaScript code (with access to a shared context and logger).
- Introducing delays to simulate real-world timing.
- Logging messages for debugging or monitoring.
- Returning custom data for further processing.

Each microservice instance runs as a separate Node.js process, and workflows can trigger requests between them.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/motero2k/microservice-simulator.git
   cd microservice-simulator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

### Running the Simulator

You can run the demo scenario (see [`examples/request-builder-demo.js`](./examples/request-builder-demo.js)):

```bash
node examples/request-builder-demo.js
```

Or, to start a microservice instance directly:

```bash
npm start
```

Or, for development with auto-reload:

```bash
npm run dev
```

### Project Structure

- `src/` - Main simulator server code.
- `lib/request-builder.js` - Functional API for building workflows.
- `lib/simulator.js` - Orchestrates running workflows and microservices.
- `examples/request-builder-demo.js` - Example workflow using the builder API.

## Defining Workflows

You define workflows using the JavaScript builder API:

```js
import {
  httpRequest, Microservice, log, wait, code, returnData, setContext, multi
} from "./lib/request-builder.js";

const myService = Microservice({ SERVICE_NAME: "MyService", PORT: 3000 });

const workflow = httpRequest({ //first action should be httpRequest to one of the microservices
  microservice: myService,
  path: "/api/do-something",
  actions: [
    log({ message: "Starting workflow" }),
    wait({ duration: 500 }),
    code(() => { /* custom JS code */ }),
    returnData({ status: "done" })
  ]
});

runSimulation(workflow).then(result => {
  console.log("Workflow completed with result:", result);
}).catch(err => {
  console.error("Workflow failed:", err);
});
```

### Key Actions

- **log**: Logs a message.
- **wait**: Introduces a delay (in milliseconds).
- **http**: Sends an HTTP request to a specified microservice or origin. Nested actions can be defined.
- **code**: Executes custom JavaScript code (with access to `logger` and `context`).
- **return**: Returns custom data for further processing.
- **set**: Sets a value in the shared context.
- **multi**: Runs multiple actions, optionally with repeat/wait.

## Example

See [`examples/request-builder-demo.js`](./examples/request-builder-demo.js) for a full workflow example using the builder API.

## Scripts

- `npm start` - Start a microservice instance (`src/index.js`).
- `npm run dev` - Start with auto-reload (development).
- `npm run demo` - Run the example workflow.

## Configuration

### Microservice Instances

Define microservice instances in code using the `Microservice` helper:

```js
const myService = Microservice({ SERVICE_NAME: "MyService", PORT: 3000 });
```

### Workflows

Workflows are defined in code using the builder API (see above).  
**JSON configuration is no longer supported or recommended.**

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the ISC License.
