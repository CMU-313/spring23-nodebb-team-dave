"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reset = exports.removeAllListeners = exports.on = exports.publish = void 0;
const events_1 = __importDefault(require("events"));
const nconf_1 = __importDefault(require("nconf"));
let real;
let noCluster;
let singleHost;
class PubSub extends events_1.default {
}
function get() {
    if (real) {
        return real;
    }
    let pubsub;
    if (!nconf_1.default.get('isCluster')) {
        if (noCluster) {
            real = noCluster;
            return real;
        }
        noCluster = new PubSub();
        noCluster.publish = noCluster.emit.bind(noCluster);
        pubsub = noCluster;
    }
    else if (nconf_1.default.get('singleHostCluster')) {
        if (singleHost) {
            real = singleHost;
            return real;
        }
        singleHost = new PubSub();
        if (!process.send) {
            singleHost.publish = singleHost.emit.bind(singleHost);
        }
        else {
            singleHost.publish = function (event, data) {
                var _a;
                (_a = process.send) === null || _a === void 0 ? void 0 : _a.call(process, {
                    action: 'pubsub',
                    event,
                    data
                });
            };
            process.on('message', (message) => {
                if (message && typeof message === 'object' && message.action === 'pubsub') {
                    singleHost.emit(message.event, message.data);
                }
            });
        }
        pubsub = singleHost;
    }
    else if (nconf_1.default.get('redis')) {
        // The next line calls a module that has not been updated to TS yet
        // My code should be able to be extended to the following file though!
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        pubsub = require('./database/redis/pubsub');
    }
    else {
        throw new Error('[[error:redis-required-for-pubsub]]');
    }
    real = pubsub;
    return pubsub;
}
function publish(event, data) {
    get().publish(event, data);
}
exports.publish = publish;
// The on() function in EventEmitter class defines the callback with type (...args: any[]) => void)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function on(event, callback) {
    get().on(event, callback);
}
exports.on = on;
function removeAllListeners(event) {
    get().removeAllListeners(event);
}
exports.removeAllListeners = removeAllListeners;
function reset() {
    real = null;
}
exports.reset = reset;
