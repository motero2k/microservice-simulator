// --- Step builder functions ---

function log({ message, ...rest }) {
    return { type: 'log', message, ...rest };
}

function wait({ duration, ...rest }) {
    return { type: 'wait', duration, ...rest };
}

function code(source, opts = {}) {
    // Accepts function or string or object with { source, ...opts }
    let src;
    if (typeof source === "function") {
        src = "(" + source.toString() + ")();";
    } else if (typeof source === "string") {
        src = source;
    } else if (typeof source === "object" && source !== null && "source" in source) {
        src = source.source;
        opts = { ...opts, ...source };
        delete opts.source;
    } else {
        throw new Error("Invalid argument for code()");
    }
    return { type: 'code', source: src, ...opts };
}

function returnData(data, opts = {}) {
    // Accepts value or { data, ...opts }
    if (arguments.length === 1 && (typeof data !== "object" || data === null || Array.isArray(data))) {
        return { type: 'return', data };
    } else if (typeof data === "object" && data !== null && !Array.isArray(data) && "data" in data) {
        return { type: 'return', ...data };
    } else {
        return { type: 'return', data, ...opts };
    }
}

function setContext({ key, value, ...rest }) {
    return { type: 'set', key, value, ...rest };
}

function multi({ actions = [], repeat = 1, wait = true }) {
    return { type: 'multi', actions, repeat, wait };
}

function httpRequest({
    name,
    description,
    origin,
    microservice,
    path,
    startDelaySeconds = 0,
    saveToContext,
    repeat = 1,
    wait = true,
    ...rest
}) {
    let resolvedOrigin, resolvedPath, _microservice;
    if (microservice?.PORT) {
        resolvedOrigin = `http://localhost:${microservice.PORT}`;
        resolvedPath = path || '';
        _microservice = microservice;
    } else if (origin) {
        resolvedOrigin = origin;
        resolvedPath = path || '';
    } else {
        throw new Error('Either an origin (protocol + host + port) or a valid microservice object must be provided');
    }
    return {
        type: 'http',
        name,
        description,
        origin: resolvedOrigin,
        path: resolvedPath,
        startDelaySeconds,
        saveToContext,
        repeat,
        wait,
        _microservice,
        ...rest,
        actions: rest.actions || []
    };
}

// --- Microservice helper ---

function Microservice({ SERVICE_NAME, PORT, LOG_LEVEL = "INFO", OASTLM_MODULE_DISABLED = false }) {
    return { SERVICE_NAME, PORT, LOG_LEVEL, OASTLM_MODULE_DISABLED };
}

// --- Logger/context for code steps ---

const logger = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    debug: console.debug,
    error: console.error
};
const context = {};

// --- Export API ---

export {
    httpRequest, Microservice, logger, context,
    multi, log, wait, code, returnData, setContext
};