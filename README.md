# Microservice Simulator

The **Microservice Simulator** is designed to simulate a **distributed architecture** by running multiple instances that interact with each other. It works alongside other instances of itself, allowing you to define and execute **workflows** involving HTTP requests, delays, logging, and code execution. These workflows can simulate complex microservice interactions, making it a powerful tool for testing telemetry frameworks.

## Key Features

- **Multi-Instance Architecture**: Designed to work with multiple instances of the simulator, enabling the simulation of distributed systems.
- **Dynamic Workflow Simulation**: Define workflows with actions like HTTP requests, code execution, delays, and logging.
- **Chained and Asynchronous Actions**: A single request can trigger subsequent requests or execute custom code, with support for both synchronous and asynchronous execution.
- **Configurable via JSON**: Workflows and instances are fully configurable using JSON files.

## How It Works

The simulator processes a series of actions defined in JSON files. Each action can perform tasks such as:

- Sending HTTP requests to other instances or services.
- Executing custom JavaScript code in a secure sandbox.
- Introducing delays to simulate real-world scenarios.
- Logging messages for debugging or monitoring.
- Returning custom data for further processing.

By deploying multiple instances of the simulator, you can create complex, distributed workflows that mimic real-world microservice interactions.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:

   ```bash
   git clone https://www.github.com/motero2k/microservice-simulator.git
   cd microservice-simulator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

### Running the Simulator

1. Start multiple instances of the simulator using the configuration in `instances.json`:

   ```bash
   npm run demo
   ```

2. The simulator loads its configuration from `test/functional/instances.json` and `test/functional/requests.json`, then executes the workflows defined in those files.

## Configuration

### `instances.json`

The `instances.json` file defines the configuration for each instance of the simulator. Each instance runs on a different port and can have its own environment variables. For example:

```json
[
    { "SERVICE_NAME": "Reporter (M1)", "PORT": 3000, "LOG_LEVEL": "INFO", "OASTLM_MODULE_DISABLED": false },
    { "SERVICE_NAME": "AuthService (M2)", "PORT": 3001, "LOG_LEVEL": "DEBUG", "OASTLM_MODULE_DISABLED": false },
    { "SERVICE_NAME": "RegistryService (M3)", "PORT": 3002, "LOG_LEVEL": "INFO", "OASTLM_MODULE_DISABLED": false },
    { "SERVICE_NAME": "CollectorService (M4)", "PORT": 3003, "LOG_LEVEL": "DEBUG", "OASTLM_MODULE_DISABLED": false },
    { "SERVICE_NAME": "EmailService (M5)", "PORT": 3004, "LOG_LEVEL": "INFO", "OASTLM_MODULE_DISABLED": false }
]
```

Each instance can simulate a different microservice, allowing you to test interactions between them.

### `requests.json`

The `requests.json` file defines the workflows to be executed by the simulator. Here's an example:

```json
[
    {
    "name": "Simple Request",
    "description": "A simple request to demonstrate basic functionality.",
    "target": "http://localhost:3000",
    "startDelaySeconds": 8,
    "body": [
        {
        "type": "log",
        "message": "Starting the request"
        },
        {
        "type": "wait",
        "duration": 500
        },
        {
        "type": "http",
        "url": "http://localhost:3001/api/v1/execute",
        "body": [
            {
            "type": "log",
            "message": "Processing the request"
            },
            {
            "type": "return",
            "data": { "status": "success" }
            }
        ]
        }
    ]
    }
]
```

### Key Actions

- **log**: Logs a message.
- **wait**: Introduces a delay (in milliseconds).
- **http**: Sends an HTTP request to a specified URL. In the body of the request, more actions can be defined.
- **code**: Executes custom JavaScript code.
- **return**: Returns custom data for further processing.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the ISC License.
