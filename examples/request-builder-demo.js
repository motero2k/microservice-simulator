import {
    httpRequest, logger, context, Microservice,
    multi, log, wait, code, returnData, setContext
} from "../lib/request-builder.js";
import { runSimulation } from "../lib/simulator.js";

const reporterService = Microservice({ SERVICE_NAME: "Reporter", PORT: 3000, LOG_LEVEL: "INFO", OASTLM_MODULE_DISABLED: false });
const authService = Microservice({ SERVICE_NAME: "AuthService", PORT: 3001, LOG_LEVEL: "DEBUG", OASTLM_MODULE_DISABLED: false });
const registryService = Microservice({ SERVICE_NAME: "RegistryService", PORT: 3002, LOG_LEVEL: "INFO", OASTLM_MODULE_DISABLED: false });
const collectorService = Microservice({ SERVICE_NAME: "CollectorService", PORT: 3003, LOG_LEVEL: "DEBUG", OASTLM_MODULE_DISABLED: false });
const emailService = Microservice({ SERVICE_NAME: "EmailService", PORT: 3004, LOG_LEVEL: "INFO", OASTLM_MODULE_DISABLED: false });
const userService = Microservice({ SERVICE_NAME: "UserService", PORT: 3005, LOG_LEVEL: "INFO", OASTLM_MODULE_DISABLED: false });

const slaReq = httpRequest({
    name: "SLA Request",
    description: "Request to generate SLA report",
    microservice: reporterService,
    path: "/api/v4/contracts/tpa-2cb2ff/createPointsFromPeriods",
    body: {
        periods: [
            {
                from: "2025-07-01T00:00:00.000Z",
                to: "2025-07-30T23:59:59.999Z"
            }
        ]
    },
    startDelaySeconds: 3,
    actions: [
        log({ message: "User initiated SLA report generation" }),
        wait({ duration: 200 }),
        httpRequest({
            microservice: authService,
            saveToContext: "authResponse",
            path: "/api/v1/authenticate",
            actions: [
                log({ message: "Authenticating user credentials" }),
                setContext({ key: "authLevel", value: 3 }),
                code(() => {
                    context.authLevel += 1;
                    logger.info(`Authorization level set to: ${context.authLevel}`);
                }),
                log({ message: "Authorization level updated" }),
                httpRequest({
                    microservice: userService,
                    saveToContext: "userInfo",
                    path: "/api/v1/user-info",
                    opts: { method: 'GET' },
                    actions: [
                        log({ message: "Fetching user information" }),
                        returnData({ userId: 123, name: "John Doe" })
                    ]
                }),
                code(() => {
                    logger.info("User authenticated with id:", context.userInfo.userId);
                }),
                log({ message: "User authorization completed" }),
                returnData({ message: "User authorized" })
            ]
        }),
        code(() => {
            logger.info(`Authorization response returned:`, context.authResponse);

            const dataExists = false;
            if (dataExists) {
                logger.warn("Existing data detected, skipping registry update");
                context.skipRegistry = true;
            } else {
                logger.info("No existing data found, proceeding with registry update");
                context.skipRegistry = false;
            }
        }),
        httpRequest({
            microservice: registryService,
            saveToContext: "registryResponse",
            path: "/api/v6/states/tpa-2cb2ff/guarantees?from=2025-07-01T00:00:00.000Z&to=2025-07-30T23:59:59.999Z&newPeriodsFromGuarantees=false",
            actions: [
                log({ message: "Requesting SLA guarantees from registry" }),
                httpRequest({
                    microservice: collectorService,
                    saveToContext: "collectorResponse",
                    path: "/api/v2/computations",
                    method: 'POST',
                    body: { config: "someconfig", scope: "class-01", window: "static,weekly,from and to" },
                    actions: [
                        log({ message: "Initiating SLA data collection" }),
                        wait({ duration: 500 }),
                        log({ message: "Background computation started" }),
                        returnData({
                            code: 200,
                            message: "OK",
                            computation: "/api/v2/computations/dd0fa5"
                        })
                    ]
                }),
                code(() => {
                    logger.info(`Collector response returned:`, context.collectorResponse);
                }),
                log({ message: "Polling for SLA data results" }),
                multi({
                    actions: [
                        httpRequest({
                            microservice: collectorService,
                            saveToContext: "pollingResponse",
                            path: "/api/v2/computations",
                            method: 'POST',
                            body: { config: "someconfig", scope: "class-01", window: "static,weekly,from and to" },
                            actions: [
                                log({ message: "Computation results not ready yet, please retry" }),
                                returnData({ code: 202, message: "Not ready yet." })
                            ]
                        }),
                        log({ message: "Not ready yet, retrying..." })
                    ],
                    repeat: 3
                }),
                httpRequest({
                    microservice: collectorService,
                    saveToContext: "finalCollectorResponse",
                    path: "/api/v2/computations",
                    method: 'POST',
                    body: { config: "someconfig", scope: "class-01", window: "static,weekly,from and to" },
                    actions: [
                        log({ message: "SLA data collection completed" }),
                        returnData({
                            code: 200,
                            message: "OK",
                            data: [
                                { guarantee: "guarantee1", value: 95 },
                                { guarantee: "guarantee2", value: 98 }
                            ]
                        })
                    ]
                }),
                code(() => {
                    logger.info(`Final collector response returned:`, context.finalCollectorResponse);
                }),
                log({ message: "Generating final SLA report" }),
                httpRequest({
                    microservice: emailService,
                    saveToContext: "emailResponse",
                    path: "/api/v1/send-email",
                    actions: [
                        log({ message: "Sending SLA report to user" }),
                        log({ message: "Email sent successfully" }),
                        returnData({ message: "Email sent successfully" })
                    ]
                }),
                code(() => {
                    logger.info(`Email response returned:`, context.emailResponse);
                })
            ]
        }),
        log({ message: "Final report generated and delivered to user" }),
        returnData({ message: "SLA report generation completed successfully" })
    ]
});

const requests = [slaReq];

runSimulation(requests);