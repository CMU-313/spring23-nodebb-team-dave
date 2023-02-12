// Referenced @vasteymnathan’s TypeScript translation from P1: [https://github.com/CMU-313/NodeBB/pull/160]
import winston = require('winston');
import os = require('os');
import nconf = require('nconf');

import pubsub = require('../pubsub');
import slugify = require('../slugify');


import * as configs from './configs';
import * as themes from './themes';
import * as js from './js';
import * as css from './css';
import * as settings from './settings';
import * as logs from './logs';
import * as errors from './errors';
import * as tags from './tags';
import * as dependencies from './dependencies';
import * as templates from './templates';
import * as blacklist from './blacklist';
import * as languages from './languages';

const reloadRequired = false;

var config: {[key: string]: any}; // change this
export { config };

export const Meta = {
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
}

/* Assorted */
export async function userOrGroupExists(slug) {
    if (!slug) {
        throw new Error('[[error:invalid-data]]');
    }
    const user = require('../user');
    const groups = require('../groups');
    slug = slugify(slug);
    const [userExists, groupExists] = await Promise.all([
        user.existsBySlug(slug),
        groups.existsBySlug(slug),
    ]);
    return userExists || groupExists;
}

if (nconf.get('isPrimary')) {
    pubsub.on('meta:restart', (data) => {
        if (data.hostname !== os.hostname()) {
            restart();
        }
    });
}

export function restart() {
    pubsub.publish('meta:restart', { hostname: os.hostname() });
    restart_help();
}

function restart_help() {
    if (process.send) {
        process.send({
            action: 'restart',
        });
    } else {
        winston.error('[meta.restart] Could not restart, are you sure NodeBB was started with `./nodebb start`?');
    }
}

export function getSessionTTLSeconds() {
    const ttlDays = 60 * 60 * 24 * config.loginDays;
    const ttlSeconds = config.loginSeconds;
    const ttl = ttlSeconds || ttlDays || 1209600; // Default to 14 days
    return ttl;
}
