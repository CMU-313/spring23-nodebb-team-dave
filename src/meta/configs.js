"use strict";
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
exports.cookie = exports.registerHooks = exports.remove = exports.setOnEmpty = exports.setMultiple = exports.set = exports.get = exports.init = exports.list = exports.getFields = exports.serialize = exports.deserialize = void 0;
const nconf = require("nconf");
const path = require("path");
const winston = require("winston");
const db = require("../database");
const pubsub = require("../pubsub");
const plugins = require("../plugins");
const utils = require("../utils");
const Meta = require("./index");
const cacheBuster = require("./cacheBuster");
const defaults = require("../../install/data/defaults.json");
Meta.config = {};
// disabled linter because dictionary is able to hold any type for value
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument,
@typescript-eslint/no-explicit-any */
// called after data is loaded from db
function deserialize(config) {
    const deserialized = {};
    Object.keys(config).forEach((key) => {
        const defaultType = typeof defaults[key];
        const type = typeof config[key];
        const number = parseFloat(config[key]);
        if (defaultType === 'string' && type === 'number') {
            deserialized[key] = String(config[key]);
        }
        else if (defaultType === 'number' && type === 'string') {
            if (!isNaN(number) && isFinite(config[key])) {
                deserialized[key] = number;
            }
            else {
                deserialized[key] = defaults[key];
            }
        }
        else if (config[key] === 'true') {
            deserialized[key] = true;
        }
        else if (config[key] === 'false') {
            deserialized[key] = false;
        }
        else if (config[key] === null) {
            deserialized[key] = defaults[key];
        }
        else if (defaultType === 'undefined' && !isNaN(number) && isFinite(config[key])) {
            deserialized[key] = number;
        }
        else if (Array.isArray(defaults[key]) && !Array.isArray(config[key])) {
            try {
                deserialized[key] = JSON.parse(config[key] || '[]');
            }
            catch (err) {
                if (err instanceof Error) {
                    winston.error(err.stack);
                    deserialized[key] = defaults[key];
                }
            }
        }
        else {
            deserialized[key] = config[key];
        }
    });
    return deserialized;
}
exports.deserialize = deserialize;
// called before data is saved to db
function serialize(config) {
    const serialized = {};
    Object.keys(config).forEach((key) => {
        const defaultType = typeof defaults[key];
        const type = typeof config[key];
        const number = parseFloat(config[key]);
        if (defaultType === 'string' && type === 'number') {
            serialized[key] = String(config[key]);
        }
        else if (defaultType === 'number' && type === 'string') {
            if (!isNaN(number) && isFinite(config[key])) {
                serialized[key] = number;
            }
            else {
                serialized[key] = defaults[key];
            }
        }
        else if (config[key] === null) {
            serialized[key] = defaults[key];
        }
        else if (defaultType === 'undefined' && !isNaN(number) && isFinite(config[key])) {
            serialized[key] = number;
        }
        else if (Array.isArray(defaults[key]) && Array.isArray(config[key])) {
            serialized[key] = JSON.stringify(config[key]);
        }
        else {
            serialized[key] = config[key];
        }
    });
    return serialized;
}
exports.serialize = serialize;
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument,
@typescript-eslint/no-explicit-any */
function getFields(fields) {
    return __awaiter(this, void 0, void 0, function* () {
        let values;
        if (fields.length) {
            values = yield db.getObjectFields('config', fields);
        }
        else {
            values = yield db.getObject('config');
        }
        values = Object.assign(Object.assign({}, defaults), (values ? deserialize(values) : {}));
        if (!fields.length) {
            values.version = nconf.get('version');
            values.registry = nconf.get('registry');
        }
        return values;
    });
}
exports.getFields = getFields;
function list() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getFields([]);
    });
}
exports.list = list;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield list();
        const buster = yield cacheBuster.read();
        config['cache-buster'] = `v=${buster || Date.now()}`;
        Meta.config = config;
    });
}
exports.init = init;
function get(field) {
    return __awaiter(this, void 0, void 0, function* () {
        const values = yield getFields([field]);
        return (values.hasOwnProperty(field) && values[field] !== undefined) ? values[field] : null;
    });
}
exports.get = get;
function set(field, value) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!field) {
            throw new Error('[[error:invalid-data]]');
        }
        yield setMultiple({
            [field]: value,
        });
    });
}
exports.set = set;
function setMultiple(data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield processConfig(data);
        data = serialize(data);
        yield db.setObject('config', data);
        updateConfig(deserialize(data));
    });
}
exports.setMultiple = setMultiple;
function setOnEmpty(values) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield db.getObject('config');
        values = serialize(values);
        const config = Object.assign(Object.assign({}, values), (data ? serialize(data) : {}));
        yield db.setObject('config', config);
    });
}
exports.setOnEmpty = setOnEmpty;
function remove(field) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.deleteObjectField('config', field);
    });
}
exports.remove = remove;
function registerHooks() {
    plugins.hooks.register('core', {
        hook: 'filter:settings.set',
        method: ({ plugin, settings, quiet }) => __awaiter(this, void 0, void 0, function* () {
            if (plugin === 'core.api' && Array.isArray(settings.tokens)) {
                // Generate tokens if not present already
                settings.tokens.forEach((set) => {
                    if (set.token === '') {
                        set.token = utils.generateUUID();
                    }
                    if (isNaN(parseInt(set.uid, 10))) {
                        set.uid = 0;
                    }
                });
            }
            return { plugin, settings, quiet };
        }),
    });
    plugins.hooks.register('core', {
        hook: 'filter:settings.get',
        method: ({ plugin, values }) => __awaiter(this, void 0, void 0, function* () {
            if (plugin === 'core.api' && Array.isArray(values.tokens)) {
                values.tokens = values.tokens.map((tokenObj) => {
                    tokenObj.uid = parseInt(tokenObj.uid, 10);
                    if (tokenObj.timestamp) {
                        tokenObj.timestampISO = new Date(parseInt(tokenObj.timestamp, 10)).toISOString();
                    }
                    return tokenObj;
                });
            }
            return { plugin, values };
        }),
    });
}
exports.registerHooks = registerHooks;
exports.cookie = {
    get: () => {
        const cookie = {};
        if (nconf.get('cookieDomain') || Meta.config.cookieDomain) {
            cookie.domain = nconf.get('cookieDomain') || Meta.config.cookieDomain;
        }
        if (nconf.get('secure')) {
            cookie.secure = true;
        }
        const relativePath = nconf.get('relative_path');
        if (relativePath !== '') {
            cookie.path = relativePath;
        }
        // Ideally configurable from ACP, but cannot be "Strict" as then top-level access will treat it as guest.
        cookie.sameSite = 'lax';
        return cookie;
    },
};
function processConfig(data) {
    return __awaiter(this, void 0, void 0, function* () {
        ensureInteger(data, 'maximumUsernameLength', 1);
        ensureInteger(data, 'minimumUsernameLength', 1);
        ensureInteger(data, 'minimumPasswordLength', 1);
        ensureInteger(data, 'maximumAboutMeLength', 0);
        if (data['minimumUsernameLength'] > data['maximumUsernameLength']) {
            throw new Error('[[error:invalid-data]]');
        }
        yield Promise.all([
            saveRenderedCss(data),
            getLogoSize(data),
        ]);
    });
}
function ensureInteger(data, field, min) {
    if (data.hasOwnProperty(field)) {
        data[field] = parseInt(data[field], 10);
        if (!(data[field] >= min)) {
            throw new Error('[[error:invalid-data]]');
        }
    }
}
function saveRenderedCss(data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!data['customCSS']) {
            return;
        }
        const less = require('less');
        const lessObject = yield less.render(data['customCSS'], {
            compress: true,
            javascriptEnabled: false,
        });
        data['renderedCustomCSS'] = lessObject.css;
    });
}
function getLogoSize(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const image = require('../image');
        if (!data['brand:logo']) {
            return;
        }
        let size;
        try {
            size = yield image.size(path.join(nconf.get('upload_path'), 'system', 'site-logo-x50.png'));
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                // For whatever reason the x50 logo wasn't generated, gracefully error out
                winston.warn('[logo] The email-safe logo doesn\'t seem to have been created, please re-upload your site logo.');
                size = {
                    height: 0,
                    width: 0,
                };
            }
            else {
                throw err;
            }
        }
        data['brand:emailLogo'] = nconf.get('url') + path.join(nconf.get('upload_url'), 'system', 'site-logo-x50.png');
        data['brand:emailLogo:height'] = size.height;
        data['brand:emailLogo:width'] = size.width;
    });
}
function updateConfig(config) {
    updateLocalConfig(config);
    pubsub.publish('config:update', config);
}
function updateLocalConfig(config) {
    Object.assign(Meta.config, config);
}
pubsub.on('config:update', (config) => {
    if (typeof config === 'object' && Meta.config) {
        updateLocalConfig(config);
    }
});
