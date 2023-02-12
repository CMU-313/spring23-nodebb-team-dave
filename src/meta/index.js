"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Meta = void 0;
// Referenced @vasteymnathan’s TypeScript translation from P1: [https://github.com/CMU-313/NodeBB/pull/160]
const winston = require("winston");
const os = require("os");
const nconf = require("nconf");
const pubsub = require("../pubsub");
const slugify = require("../slugify");
const configs = __importStar(require("./configs"));
const themes = __importStar(require("./themes"));
const js = __importStar(require("./js"));
const css = __importStar(require("./css"));
const settings = __importStar(require("./settings"));
const logs = __importStar(require("./logs"));
const errors = __importStar(require("./errors"));
const tags = __importStar(require("./tags"));
const dependencies = __importStar(require("./dependencies"));
const templates = __importStar(require("./templates"));
const blacklist = __importStar(require("./blacklist"));
const languages = __importStar(require("./languages"));
const reloadRequired = false;
exports.Meta = {
    configs,
    themes,
    js,
    css,
    settings,
    logs,
    errors,
    tags,
    dependencies,
    templates,
    blacklist,
    languages,
    reloadRequired,
};
/* Assorted */
exports.Meta.userOrGroupExists = function (slug) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!slug) {
            throw new Error('[[error:invalid-data]]');
        }
        const user = require('../user');
        const groups = require('../groups');
        slug = slugify(slug);
        const [userExists, groupExists] = yield Promise.all([
            user.existsBySlug(slug),
            groups.existsBySlug(slug),
        ]);
        return userExists || groupExists;
    });
};
if (nconf.get('isPrimary')) {
    pubsub.on('meta:restart', (data) => {
        if (data.hostname !== os.hostname()) {
            restart();
        }
    });
}
exports.Meta.restart = function () {
    pubsub.publish('meta:restart', { hostname: os.hostname() });
    restart();
};
function restart() {
    if (process.send) {
        process.send({
            action: 'restart',
        });
    }
    else {
        winston.error('[meta.restart] Could not restart, are you sure NodeBB was started with `./nodebb start`?');
    }
}
exports.Meta.getSessionTTLSeconds = function () {
    const ttlDays = 60 * 60 * 24 * exports.Meta.config.loginDays;
    const ttlSeconds = exports.Meta.config.loginSeconds;
    const ttl = ttlSeconds || ttlDays || 1209600; // Default to 14 days
    return ttl;
};
require('../promisify')(exports.Meta);
