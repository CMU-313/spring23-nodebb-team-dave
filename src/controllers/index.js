'use strict';
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
exports.termsOfUse = exports.outgoing = exports.manifest = exports.robots = exports.confirmEmail = exports.registerInterstitial = exports.register = exports.login = exports.reset = exports.Controllers = void 0;
const nconf = require("nconf");
const validator = require("validator");
const meta = require("../meta");
const user = require("../user");
const plugins = require("../plugins");
const privileges = require("../privileges");
const helpers = require("./helpers");
// import Controllers = module.exports;
const ping = __importStar(require("./ping"));
const home = __importStar(require("./home"));
const topics = __importStar(require("./topics"));
const posts = __importStar(require("./posts"));
const career = __importStar(require("./career"));
const categories = __importStar(require("./categories"));
const category = __importStar(require("./category"));
const unread = __importStar(require("./unread"));
const recent = __importStar(require("./recent"));
const popular = __importStar(require("./popular"));
const top = __importStar(require("./top"));
const tags = __importStar(require("./tags"));
const search = __importStar(require("./search"));
const users = __importStar(require("./users"));
const groups = __importStar(require("./groups"));
const accounts = __importStar(require("./accounts"));
const authentication = __importStar(require("./authentication"));
const api = __importStar(require("./api"));
const admin = __importStar(require("./admin"));
const globalMods = __importStar(require("./globalmods"));
const mods = __importStar(require("./mods"));
const sitemap = __importStar(require("./sitemap"));
const osd = __importStar(require("./osd"));
const error404 = __importStar(require("./404"));
const errors = __importStar(require("./errors"));
const composer = __importStar(require("./composer"));
const write = __importStar(require("./write"));
exports.Controllers = {
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
};
function reset(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (meta.config['password:disableEdit']) {
            return helpers.notAllowed(req, res);
        }
        res.locals.metaTags = Object.assign(Object.assign({}, res.locals.metaTags), { name: 'robots', content: 'noindex' });
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
            const valid = yield user.reset.validate(req.session.reset_code);
            renderReset(req.session.reset_code, valid);
            delete req.session.reset_code;
        }
        else {
            res.render('reset', {
                code: null,
                breadcrumbs: helpers.buildBreadcrumbs([{
                        text: '[[reset_password:reset_password]]',
                    }]),
                title: '[[pages:reset]]',
            });
        }
    });
}
exports.reset = reset;
;
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let data;
        data.loginFormEntry = [];
        const loginStrategies = require('../routes/authentication').getLoginStrategies();
        const registrationType = meta.config.registrationType || 'normal';
        const allowLoginWith = (meta.config.allowLoginWith || 'username-email');
        let errorText;
        if (req.query.error === 'csrf-invalid') {
            errorText = '[[error:csrf-invalid]]';
        }
        else if (req.query.error) {
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
        const hasLoginPrivilege = yield privileges.global.canGroup('local:login', 'registered-users');
        data.allowLocalLogin = hasLoginPrivilege || parseInt(req.query.local, 10) === 1;
        if (!data.allowLocalLogin && !data.allowRegistration && data.alternate_logins && data.authentication.length === 1) {
            return helpers.redirect(res, { external: data.authentication[0].url });
        }
        // Re-auth challenge, pre-fill username
        if (req.loggedIn) {
            const userData = yield user.getUserFields(req.uid, ['username']);
            data.username = userData.username;
            data.alternate_logins = false;
        }
        res.render('login', data);
    });
}
exports.login = login;
;
function register(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
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
                    yield user.verifyInvitation(req.query);
                }
                catch (e) {
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
        }
        catch (err) {
            next(err);
        }
    });
}
exports.register = register;
;
function registerInterstitial(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.hasOwnProperty('registration')) {
            return res.redirect(`${nconf.get('relative_path')}/register`);
        }
        try {
            const data = yield plugins.hooks.fire('filter:register.interstitial', {
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
            const renders = data.interstitials.map(interstitial => req.app.renderAsync(interstitial.template, Object.assign(Object.assign({}, interstitial.data || {}), { errors })));
            const sections = yield Promise.all(renders);
            res.render('registerComplete', {
                title: '[[pages:registration-complete]]',
                register: data.userData.register,
                sections,
                errors,
            });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.registerInterstitial = registerInterstitial;
;
function confirmEmail(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield user.email.confirmByCode(req.params.code, req.session.id);
        }
        catch (e) {
            if (e.message === '[[error:invalid-data]]') {
                return next();
            }
            throw e;
        }
        res.render('confirm', {
            title: '[[pages:confirm]]',
        });
    });
}
exports.confirmEmail = confirmEmail;
;
function robots(req, res) {
    res.set('Content-Type', 'text/plain');
    if (meta.config['robots:txt']) {
        res.send(meta.config['robots:txt']);
    }
    else {
        res.send(`${'User-agent: *\n' +
            'Disallow: '}${nconf.get('relative_path')}/admin/\n` +
            `Disallow: ${nconf.get('relative_path')}/reset/\n` +
            `Disallow: ${nconf.get('relative_path')}/compose\n` +
            `Sitemap: ${nconf.get('url')}/sitemap.xml`);
    }
}
exports.robots = robots;
;
function manifest(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
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
        }
        else if (meta.config['brand:touchIcon']) {
            manifest.icons.push({
                src: `${nconf.get('relative_path')}/assets/uploads/system/touchicon-orig.png`,
                type: 'image/png',
                purpose: 'maskable',
            });
        }
        const data = yield plugins.hooks.fire('filter:manifest.build', {
            req: req,
            res: res,
            manifest: manifest,
        });
        res.status(200).json(data.manifest);
    });
}
exports.manifest = manifest;
;
function outgoing(req, res, next) {
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
}
exports.outgoing = outgoing;
;
function termsOfUse(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!meta.config.termsOfUse) {
            return next();
        }
        const termsOfUse = yield plugins.hooks.fire('filter:parse.post', {
            postData: {
                content: meta.config.termsOfUse || '',
            },
        });
        res.render('tos', {
            termsOfUse: termsOfUse.postData.content,
        });
    });
}
exports.termsOfUse = termsOfUse;
;
