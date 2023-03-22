/* eslint-disable no-console */

'use strict';

// 'use strict';
/* eslint-disable */
const __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.monitorConfig = exports.io = exports.io_close = exports.io_one = exports.prepare_io_string = exports.init = exports.setup = exports.setup_one = exports.setup_one_log = exports.close = exports.open = exports.express_open = exports.expressLogger = void 0;
const express_1 = __importDefault(require('express'));
/*
 * Logger module: ability to dynamically turn on/off logging for http requests & socket.io events
 */
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const util = require('util');
const morgan = require('morgan');
const file_1 = __importDefault(require('./file'));
const meta_1 = __importDefault(require('./meta'));

const opts = {
    /*
     * state used by Logger
     */
    express: {
        app: (0, express_1.default)(),
        set: 0,
        ofn: null,
    },
    streams: {
        log: { f: process.stdout },
    },
};
/* -- Logger -- */
function expressLogger(req, res, next) {
    /*
        * The new express.logger
        *
        * This hijack allows us to turn logger on/off dynamically within express
        */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (meta_1.default.config.loggerStatus > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return opts.express.ofn(req, res, next);
    }
    return next();
}
exports.expressLogger = expressLogger;
function express_open() {
    if (opts.express.set !== 1) {
        opts.express.set = 1;
        opts.express.app.use(expressLogger);
    }
    /*
        * Always initialize "ofn" (original function) with the original logger function
        */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    opts.express.ofn = morgan('combined', { stream: opts.streams.log.f });
}
exports.express_open = express_open;
function open(value) {
    /* Open the streams to log to: either a path or stdout */
    let stream;
    if (value) {
        if (file_1.default.existsSync(value)) {
            const stats = fs.statSync(value);
            if (stats) {
                if (stats.isDirectory()) {
                    stream = fs.createWriteStream(path.join(value, 'nodebb.log'), { flags: 'a' });
                } else {
                    stream = fs.createWriteStream(value, { flags: 'a' });
                }
            }
        } else {
            stream = fs.createWriteStream(value, { flags: 'a' });
        }
        if (stream) {
            stream.on('error', (err) => {
                winston.error(err.stack);
            });
        }
    } else {
        stream = process.stdout;
    }
    return stream;
}
exports.open = open;
function close(stream) {
    if (stream.f !== process.stdout && stream.f) {
        let stream;
        stream.end();
    }
    stream.f = null;
}
exports.close = close;
function setup_one_log(value) {
    /*
        * If logging is currently enabled, create a stream.
        * Otherwise, close the current stream
        */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (meta_1.default.config.loggerStatus > 0 || meta_1.default.config.loggerIOStatus) {
        const stream = open(value);
        if (stream) {
            opts.streams.log.f = stream;
        } else {
            opts.streams.log.f = process.stdout;
        }
    } else {
        close(opts.streams.log);
    }
}
exports.setup_one_log = setup_one_log;
function setup_one(key, value) {
    /*
        * 1. Open the logger stream: stdout or file
        * 2. Re-initialize the express logger hijack
        */
    if (key === 'loggerPath') {
        setup_one_log(value);
        express_open();
    }
}
exports.setup_one = setup_one;
function setup() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    setup_one('loggerPath', meta_1.default.config.loggerPath);
}
exports.setup = setup;
function init(app) {
    opts.express.app = app;
    /* Open log file stream & initialize express logging if meta.config.logger* variables are set */
    setup();
}
exports.init = init;
function prepare_io_string(_type, _uid, _args) {
    /*
        * This prepares the output string for intercepted socket.io events
        *
        * The format is: io: <uid> <event> <args>
        */
    try {
        return `io: ${_uid} ${_type} ${util.inspect(Array.prototype.slice.call(_args), { depth: 3 })}\n`;
    } catch (err) {
        winston.info('Logger.prepare_io_string: Failed', err);
        return 'error';
    }
}
exports.prepare_io_string = prepare_io_string;
function io_one(socket, uid) {
    /*
        * This function replaces a socket's .emit/.on functions in order to intercept events
        */
    function override(method, name, errorMsg) {
        return (...args) => {
            if (opts.streams.log.f) {
                opts.streams.log.f.write(prepare_io_string(name, uid, args));
            }
            try {
                method.apply(socket, args);
            } catch (err) {
                winston.info(errorMsg, err);
            }
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (socket && meta_1.default.config.loggerIOStatus > 0) {
        // courtesy of: http://stackoverflow.com/a/9674248
        socket.oEmit = socket.emit;
        const { emit } = socket;
        socket.emit = override(emit, 'emit', 'Logger.io_one: emit.apply: Failed');
        socket.$onvent = socket.onevent;
        const $onevent = socket.onevent;
        socket.onevent = override($onevent, 'on', 'Logger.io_one: $emit.apply: Failed');
    }
}
exports.io_one = io_one;
function io_close(socket) {
    /*
        * Restore all hijacked sockets to their original emit/on functions
        */
    if (!socket || !socket.io || !socket.io.sockets || !socket.io.sockets.sockets) {
        return;
    }
    const clientsMap = socket.io.sockets.sockets;
    for (const [, client] of clientsMap) {
        if (client.oEmit && client.oEmit !== client.emit) {
            client.emit = client.oEmit;
        }
        if (client.$onevent && client.$onevent !== client.onevent) {
            client.onevent = client.$onevent;
        }
    }
}
exports.io_close = io_close;
function io(socket) {
    /*
        * Go through all of the currently established sockets & hook their .emit/.on
        */
    if (!socket || !socket.io || !socket.io.sockets || !socket.io.sockets.sockets) {
        return;
    }
    const clientsMap = socket.io.sockets.sockets;
    for (const [, socketObj] of clientsMap) {
        io_one(socketObj, socketObj.uid);
    }
}
exports.io = io;
function monitorConfig(socket, data) {
    /*
        * This monitor's when a user clicks "save" in the Logger section of the admin panel
        */
    setup_one(data.key, data.value);
    io_close(socket);
    io(socket);
}
exports.monitorConfig = monitorConfig;
/* eslint-disable */
