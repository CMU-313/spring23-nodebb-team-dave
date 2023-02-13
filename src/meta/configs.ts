
import nconf = require('nconf');
import path = require('path');
import winston = require('winston');

import { CookieOptions } from 'express';
import db = require('../database');
import pubsub = require('../pubsub');
import plugins = require('../plugins');
import utils = require('../utils');
import Meta = require('./index');
import cacheBuster = require('./cacheBuster');
import defaults = require('../../install/data/defaults.json');

Meta.config = {};

interface ConfigCookie {
  get(): CookieOptions;
}

// disabled linter because dictionary is able to hold any type for value
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument,
@typescript-eslint/no-explicit-any */
// called after data is loaded from db
export function deserialize(config: object): { [id: string]: any } {
    const deserialized: { [id: string]: any } = {};
    Object.keys(config).forEach((key) => {
        const defaultType = typeof defaults[key];
        const type = typeof config[key];
        const number = parseFloat(config[key]);

        if (defaultType === 'string' && type === 'number') {
            deserialized[key] = String(config[key]);
        } else if (defaultType === 'number' && type === 'string') {
            if (!isNaN(number) && isFinite(config[key])) {
                deserialized[key] = number;
            } else {
                deserialized[key] = defaults[key];
            }
        } else if (config[key] === 'true') {
            deserialized[key] = true;
        } else if (config[key] === 'false') {
            deserialized[key] = false;
        } else if (config[key] === null) {
            deserialized[key] = defaults[key];
        } else if (defaultType === 'undefined' && !isNaN(number) && isFinite(config[key])) {
            deserialized[key] = number;
        } else if (Array.isArray(defaults[key]) && !Array.isArray(config[key])) {
            try {
                deserialized[key] = JSON.parse(config[key] || '[]');
            } catch (err: unknown) {
                if (err instanceof Error) {
                    winston.error(err.stack);
                    deserialized[key] = defaults[key];
                }
            }
        } else {
            deserialized[key] = config[key];
        }
    });
    return deserialized;
}

// called before data is saved to db
export function serialize(config: object): { [id: string]: any } {
    const serialized: { [id: string]: any } = {};
    Object.keys(config).forEach((key) => {
        const defaultType = typeof defaults[key];
        const type = typeof config[key];
        const number = parseFloat(config[key]);

        if (defaultType === 'string' && type === 'number') {
            serialized[key] = String(config[key]);
        } else if (defaultType === 'number' && type === 'string') {
            if (!isNaN(number) && isFinite(config[key])) {
                serialized[key] = number;
            } else {
                serialized[key] = defaults[key];
            }
        } else if (config[key] === null) {
            serialized[key] = defaults[key];
        } else if (defaultType === 'undefined' && !isNaN(number) && isFinite(config[key])) {
            serialized[key] = number;
        } else if (Array.isArray(defaults[key]) && Array.isArray(config[key])) {
            serialized[key] = JSON.stringify(config[key]);
        } else {
            serialized[key] = config[key];
        }
    });
    return serialized;
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument,
@typescript-eslint/no-explicit-any */
export async function getFields(fields: string[]): Promise<{ [key: string]: any }> {
    let values: any;
    if (fields.length) {
        values = await db.getObjectFields('config', fields);
    } else {
        values = await db.getObject('config');
    }

    values = { ...defaults, ...(values ? deserialize(values) : {}) };

    if (!fields.length) {
        values.version = nconf.get('version');
        values.registry = nconf.get('registry');
    }
    return values;
}

export async function list(): Promise<{ [key: string]: any }> {
    return await getFields([]);
}

export async function init(): Promise<void> {
    const config: { [key: string]: any } = await list();
    const buster = await cacheBuster.read();
    config['cache-buster'] = `v=${buster || Date.now()}`;
    Meta.config = config;
}

export async function get(field: string): Promise<any> {
    const values = await getFields([field]);
    return (values.hasOwnProperty(field) && values[field] !== undefined) ? values[field] : null;
}

export async function set(field: string, value: any): Promise<void> {
    if (!field) {
        throw new Error('[[error:invalid-data]]');
    }

    await setMultiple({
        [field]: value,
    });
}

export async function setMultiple(data: object): Promise<void> {
    await processConfig(data);
    data = serialize(data);
    await db.setObject('config', data);
    updateConfig(deserialize(data));
}

export async function setOnEmpty(values: object): Promise<void> {
    const data = await db.getObject('config');
    values = serialize(values);
    const config = { ...values, ...(data ? serialize(data) : {}) };
    await db.setObject('config', config);
}

export async function remove(field: string): Promise<void> {
    await db.deleteObjectField('config', field);
}

export function registerHooks() {
    plugins.hooks.register('core', {
        hook: 'filter:settings.set',
        method: async ({ plugin, settings, quiet }) => {
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
        },
    });

    plugins.hooks.register('core', {
        hook: 'filter:settings.get',
        method: async ({ plugin, values }) => {
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
        },
    });
}

export const cookie: ConfigCookie = {
    get: () => {
        const cookie: CookieOptions = {};

        if (nconf.get('cookieDomain') || Meta.config.cookieDomain) {
            cookie.domain = nconf.get('cookieDomain') || Meta.config.cookieDomain;
        }

        if (nconf.get('secure')) {
            cookie.secure = true;
        }

        const relativePath: string = nconf.get('relative_path') as string;
        if (relativePath !== '') {
            cookie.path = relativePath;
        }

        // Ideally configurable from ACP, but cannot be "Strict" as then top-level access will treat it as guest.
        cookie.sameSite = 'lax';

        return cookie;
    },
};

function ensureInteger(data: object, field: string, min: number): void {
    if (data.hasOwnProperty(field)) {
        data[field] = parseInt(data[field], 10);
        if (!(data[field] >= min)) {
            throw new Error('[[error:invalid-data]]');
        }
    }
}

async function processConfig(data: object): Promise<void> {
    ensureInteger(data, 'maximumUsernameLength', 1);
    ensureInteger(data, 'minimumUsernameLength', 1);
    ensureInteger(data, 'minimumPasswordLength', 1);
    ensureInteger(data, 'maximumAboutMeLength', 0);
    if (data['minimumUsernameLength'] > data['maximumUsernameLength']) {
        throw new Error('[[error:invalid-data]]');
    }

    await Promise.all([
        saveRenderedCss(data),
        getLogoSize(data),
    ]);
}

async function saveRenderedCss(data: object): Promise<void> {
    if (!data['customCSS']) {
        return;
    }
    const less = require('less');
    const lessObject = await less.render(data['customCSS'], {
        compress: true,
        javascriptEnabled: false,
    });
    data['renderedCustomCSS'] = lessObject.css;
}

async function getLogoSize(data: { [key: string]: any }): Promise<void> {
    const image = require('../image');
    if (!data['brand:logo']) {
        return;
    }
    let size;
    try {
        size = await image.size(path.join(nconf.get('upload_path'), 'system', 'site-logo-x50.png'));
    } catch (err) {
        if (err.code === 'ENOENT') {
            // For whatever reason the x50 logo wasn't generated, gracefully error out
            winston.warn('[logo] The email-safe logo doesn\'t seem to have been created, please re-upload your site logo.');
            size = {
                height: 0,
                width: 0,
            };
        } else {
            throw err;
        }
    }
    data['brand:emailLogo'] = nconf.get('url') + path.join(nconf.get('upload_url'), 'system', 'site-logo-x50.png');
    data['brand:emailLogo:height'] = size.height;
    data['brand:emailLogo:width'] = size.width;
}

function updateConfig(config): void {
    updateLocalConfig(config);
    pubsub.publish('config:update', config);
}

function updateLocalConfig(config): void {
    Object.assign(Meta.config, config);
}

pubsub.on('config:update', (config: object) => {
    if (typeof config === 'object' && Meta.config) {
        updateLocalConfig(config);
    }
});
