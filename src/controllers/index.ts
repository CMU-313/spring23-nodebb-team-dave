'use strict';

import nconf = require('nconf');
import validator = require('validator');

import meta = require('../meta');
import user = require('../user');
import plugins = require('../plugins');
import privileges = require('../privileges');
import helpers = require('./helpers');

// import Controllers = module.exports;
import * as ping from './ping'
import * as home from './home'
import * as topics from './topics'
import * as posts from './posts'
import * as career from './career'
import * as categories from './categories'
import * as category from './category'
import * as unread from './unread'
import * as recent from './recent'
import * as popular from './popular'
import * as top from './top'
import * as tags from './tags'
import * as search from './search'
import * as users from './users'
import * as groups from './groups'
import * as accounts from './accounts'
import * as authentication from './authentication'
import * as api from './api'
import * as admin from './admin'
import * as globalMods from './globalmods'
import * as mods from './mods'
import * as sitemap from './sitemap'
import * as osd from './osd'
import * as error404 from './404'
import * as errors from './errors'
import * as composer from './composer'
import * as write from './write'
import { Breadcrumbs } from '../types/';

interface LoginObject {
  label: string,
  html: string,
  styleName: string
}

interface AuthenticationObject {
  name : string,
  url: string,
  callbackURL: string,
  icon: string,
  scope: string,
  prompt: string
}

interface Login {
  loginFormEntry: LoginObject[],
  alternate_logins: boolean,
  authentication: AuthenticationObject[],
  allowRegistration: boolean,
  allowLoginWith: string,
  title: string,
  allowPasswordReset: boolean,
  allowLocalLogin: boolean,
  breadcrumbs: Breadcrumbs,
  username: unknown,
  error: unknown
}

export const Controllers = {
    ping,
    home,
    topics,
    posts,
    career,
    categories,
    category,
    unread,
    recent,
    popular,
    top,
    tags,
    search,
    user,
    users,
    groups,
    accounts,
    authentication,
    api,
    admin,
    globalMods,
    mods,
    sitemap,
    osd,
    "404": error404,
    errors,
    composer,
    write
}

export async function reset(req, res) {
    if (meta.config['password:disableEdit']) {
        return helpers.notAllowed(req, res);
    }

    res.locals.metaTags = {
        ...res.locals.metaTags,
        name: 'robots',
        content: 'noindex',
    };

    const renderReset = function (code, valid) {
        res.render('reset_code', {
            valid: valid,
            displayExpiryNotice: req.session.passwordExpired,
            code: code,
            minimumPasswordLength: meta.config.minimumPasswordLength,
            minimumPasswordStrength: meta.config.minimumPasswordStrength,
            breadcrumbs: helpers.buildBreadcrumbs([
                {
                    text: '[[reset_password:reset_password]]',
                    url: '/reset',
                },
                {
                    text: '[[reset_password:update_password]]',
                },
            ]),
            title: '[[pages:reset]]',
        });
        delete req.session.passwordExpired;
    };

    if (req.params.code) {
        req.session.reset_code = req.params.code;
    }

    if (req.session.reset_code) {
        // Validate and save to local variable before removing from session
        const valid = await user.reset.validate(req.session.reset_code);
        renderReset(req.session.reset_code, valid);
        delete req.session.reset_code;
    } else {
        res.render('reset', {
            code: null,
            breadcrumbs: helpers.buildBreadcrumbs([{
                text: '[[reset_password:reset_password]]',
            }]),
            title: '[[pages:reset]]',
        });
    }
};

export async function login(req, res) {
    let data: Login;
    data.loginFormEntry = [];
    const loginStrategies = require('../routes/authentication').getLoginStrategies();
    const registrationType = meta.config.registrationType || 'normal';
    const allowLoginWith = (meta.config.allowLoginWith || 'username-email');

    let errorText;
    if (req.query.error === 'csrf-invalid') {
        errorText = '[[error:csrf-invalid]]';
    } else if (req.query.error) {
        errorText = validator.escape(String(req.query.error));
    }

    if (req.headers['x-return-to']) {
        req.session.returnTo = req.headers['x-return-to'];
    }

    // Occasionally, x-return-to is passed a full url.
    req.session.returnTo = req.session.returnTo && req.session.returnTo.replace(nconf.get('base_url'), '').replace(nconf.get('relative_path'), '');

    data.alternate_logins = loginStrategies.length > 0;
    data.authentication = loginStrategies;
    data.allowRegistration = registrationType === 'normal';
    data.allowLoginWith = `[[login:${allowLoginWith}]]`;
    data.breadcrumbs = helpers.buildBreadcrumbs([{
        text: '[[global:login]]',
    }]);
    data.error = req.flash('error')[0] || errorText;
    data.title = '[[pages:login]]';
    data.allowPasswordReset = !meta.config['password:disableEdit'];

    const hasLoginPrivilege = await privileges.global.canGroup('local:login', 'registered-users');
    data.allowLocalLogin = hasLoginPrivilege || parseInt(req.query.local, 10) === 1;

    if (!data.allowLocalLogin && !data.allowRegistration && data.alternate_logins && data.authentication.length === 1) {
        return helpers.redirect(res, { external: data.authentication[0].url });
    }

    // Re-auth challenge, pre-fill username
    if (req.loggedIn) {
        const userData = await user.getUserFields(req.uid, ['username']);
        data.username = userData.username;
        data.alternate_logins = false;
    }
    res.render('login', data);
};

export async function register(req, res, next) {
    const registrationType = meta.config.registrationType || 'normal';

    if (registrationType === 'disabled') {
        return setImmediate(next);
    }

    let errorText;
    const returnTo = (req.headers['x-return-to'] || '').replace(nconf.get('base_url') + nconf.get('relative_path'), '');
    if (req.query.error === 'csrf-invalid') {
        errorText = '[[error:csrf-invalid]]';
    }
    try {
        if (registrationType === 'invite-only' || registrationType === 'admin-invite-only') {
            try {
                await user.verifyInvitation(req.query);
            } catch (e) {
                return res.render('400', {
                    error: e.message,
                });
            }
        }

        if (returnTo) {
            req.session.returnTo = returnTo;
        }

        const loginStrategies = require('../routes/authentication').getLoginStrategies();
        res.render('register', {
            'register_window:spansize': loginStrategies.length ? 'col-md-6' : 'col-md-12',
            alternate_logins: !!loginStrategies.length,
            authentication: loginStrategies,

            minimumUsernameLength: meta.config.minimumUsernameLength,
            maximumUsernameLength: meta.config.maximumUsernameLength,
            minimumPasswordLength: meta.config.minimumPasswordLength,
            minimumPasswordStrength: meta.config.minimumPasswordStrength,
            breadcrumbs: helpers.buildBreadcrumbs([{
                text: '[[register:register]]',
            }]),
            regFormEntry: [
                {
                    label: 'Account Type',
                    styleName: 'account-type',
                    html: `
                        <select class="form-control" name="account-type" aria-label="Account Type">
                            <option value="student" selected>Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="teaching_assistant">Teaching Assistant</option>
                        </select>
                    `,
                },
            ],
            error: req.flash('error')[0] || errorText,
            title: '[[pages:register]]',
        });
    } catch (err) {
        next(err);
    }
};

export async function registerInterstitial(req, res, next) {
    if (!req.session.hasOwnProperty('registration')) {
        return res.redirect(`${nconf.get('relative_path')}/register`);
    }
    try {
        const data = await plugins.hooks.fire('filter:register.interstitial', {
            req,
            userData: req.session.registration,
            interstitials: [],
        });

        if (!data.interstitials.length) {
            // No interstitials, redirect to home
            const returnTo = req.session.returnTo || req.session.registration.returnTo;
            delete req.session.registration;
            return helpers.redirect(res, returnTo || '/');
        }

        const errors = req.flash('errors');
        const renders = data.interstitials.map(
            interstitial => req.app.renderAsync(interstitial.template, { ...interstitial.data || {}, errors })
        );
        const sections = await Promise.all(renders);

        res.render('registerComplete', {
            title: '[[pages:registration-complete]]',
            register: data.userData.register,
            sections,
            errors,
        });
    } catch (err) {
        next(err);
    }
};

export async function confirmEmail(req, res, next) {
    try {
        await user.email.confirmByCode(req.params.code, req.session.id);
    } catch (e) {
        if (e.message === '[[error:invalid-data]]') {
            return next();
        }

        throw e;
    }

    res.render('confirm', {
        title: '[[pages:confirm]]',
    });
};

export function robots(req, res) {
    res.set('Content-Type', 'text/plain');

    if (meta.config['robots:txt']) {
        res.send(meta.config['robots:txt']);
    } else {
        res.send(`${'User-agent: *\n' +
            'Disallow: '}${nconf.get('relative_path')}/admin/\n` +
            `Disallow: ${nconf.get('relative_path')}/reset/\n` +
            `Disallow: ${nconf.get('relative_path')}/compose\n` +
            `Sitemap: ${nconf.get('url')}/sitemap.xml`);
    }
};

export async function manifest(req, res) {
    const manifest = {
        name: meta.config.title || 'NodeBB',
        short_name: meta.config['title:short'] || meta.config.title || 'NodeBB',
        start_url: nconf.get('url'),
        display: 'standalone',
        orientation: 'portrait',
        theme_color: meta.config.themeColor || '#ffffff',
        background_color: meta.config.backgroundColor || '#ffffff',
        icons: [],
    };

    if (meta.config['brand:touchIcon']) {
        manifest.icons.push({
            src: `${nconf.get('relative_path')}/assets/uploads/system/touchicon-36.png`,
            sizes: '36x36',
            type: 'image/png',
            density: 0.75,
        }, {
            src: `${nconf.get('relative_path')}/assets/uploads/system/touchicon-48.png`,
            sizes: '48x48',
            type: 'image/png',
            density: 1.0,
        }, {
            src: `${nconf.get('relative_path')}/assets/uploads/system/touchicon-72.png`,
            sizes: '72x72',
            type: 'image/png',
            density: 1.5,
        }, {
            src: `${nconf.get('relative_path')}/assets/uploads/system/touchicon-96.png`,
            sizes: '96x96',
            type: 'image/png',
            density: 2.0,
        }, {
            src: `${nconf.get('relative_path')}/assets/uploads/system/touchicon-144.png`,
            sizes: '144x144',
            type: 'image/png',
            density: 3.0,
        }, {
            src: `${nconf.get('relative_path')}/assets/uploads/system/touchicon-192.png`,
            sizes: '192x192',
            type: 'image/png',
            density: 4.0,
        }, {
            src: `${nconf.get('relative_path')}/assets/uploads/system/touchicon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            density: 10.0,
        });
    }


    if (meta.config['brand:maskableIcon']) {
        manifest.icons.push({
            src: `${nconf.get('relative_path')}/assets/uploads/system/maskableicon-orig.png`,
            type: 'image/png',
            purpose: 'maskable',
        });
    } else if (meta.config['brand:touchIcon']) {
        manifest.icons.push({
            src: `${nconf.get('relative_path')}/assets/uploads/system/touchicon-orig.png`,
            type: 'image/png',
            purpose: 'maskable',
        });
    }

    const data = await plugins.hooks.fire('filter:manifest.build', {
        req: req,
        res: res,
        manifest: manifest,
    });
    res.status(200).json(data.manifest);
};

export function outgoing(req, res, next) {
    const url = req.query.url || '';
    const allowedProtocols = [
        'http', 'https', 'ftp', 'ftps', 'mailto', 'news', 'irc', 'gopher',
        'nntp', 'feed', 'telnet', 'mms', 'rtsp', 'svn', 'tel', 'fax', 'xmpp', 'webcal',
    ];
    const parsed = require('url').parse(url);

    if (!url || !parsed.protocol || !allowedProtocols.includes(parsed.protocol.slice(0, -1))) {
        return next();
    }

    res.render('outgoing', {
        outgoing: validator.escape(String(url)),
        title: meta.config.title,
        breadcrumbs: helpers.buildBreadcrumbs([{
            text: '[[notifications:outgoing_link]]',
        }]),
    });
};

export async function termsOfUse(req, res, next) {
    if (!meta.config.termsOfUse) {
        return next();
    }
    const termsOfUse = await plugins.hooks.fire('filter:parse.post', {
        postData: {
            content: meta.config.termsOfUse || '',
        },
    });
    res.render('tos', {
        termsOfUse: termsOfUse.postData.content,
    });
};
