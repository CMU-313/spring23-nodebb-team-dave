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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDiff = exports.restoreDiff = exports.loadDiff = exports.getDiffs = exports.unendorse = exports.endorse = exports.unbookmark = exports.bookmark = exports.unvote = exports.vote = exports.move = exports.delete = exports._delete = exports.restore = exports.purge = exports.edit = exports.get = void 0;
const posts_1 = __importDefault(require("../../posts"));
const privileges_1 = __importDefault(require("../../privileges"));
const api_1 = __importDefault(require("../../api"));
const helpers = __importStar(require("../helpers"));
const apiHelpers = __importStar(require("../../api/helpers"));
function get(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helpers.formatApiResponse(200, res, yield api_1.default.posts.get(req, { pid: req.params.pid }));
    });
}
exports.get = get;
function edit(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const editResult = yield api_1.default.posts.edit(req, Object.assign(Object.assign({}, req.body), { pid: req.params.pid, uid: req.uid, req: apiHelpers.buildReqObject(req) }));
        yield helpers.formatApiResponse(200, res, editResult);
    });
}
exports.edit = edit;
function purge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield api_1.default.posts.purge(req, { pid: req.params.pid });
        yield helpers.formatApiResponse(200, res);
    });
}
exports.purge = purge;
function restore(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield api_1.default.posts.restore(req, { pid: req.params.pid });
        yield helpers.formatApiResponse(200, res);
    });
}
exports.restore = restore;
function _delete(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield api_1.default.posts.delete(req, { pid: req.params.pid });
        yield helpers.formatApiResponse(200, res);
    });
}
exports._delete = _delete;
exports.delete = _delete;
function move(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield api_1.default.posts.move(req, {
            pid: req.params.pid,
            tid: req.body.tid,
        });
        yield helpers.formatApiResponse(200, res);
    });
}
exports.move = move;
function mock(req) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const tid = yield posts_1.default.getPostField(req.params.pid, 'tid');
        return { pid: req.params.pid, room_id: `topic_${tid}` };
    });
}
function vote(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield mock(req);
        if (req.body.delta > 0) {
            yield api_1.default.posts.upvote(req, data);
        }
        else if (req.body.delta < 0) {
            yield api_1.default.posts.downvote(req, data);
        }
        else {
            yield api_1.default.posts.unvote(req, data);
        }
        yield helpers.formatApiResponse(200, res);
    });
}
exports.vote = vote;
function unvote(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield mock(req);
        yield api_1.default.posts.unvote(req, data);
        yield helpers.formatApiResponse(200, res);
    });
}
exports.unvote = unvote;
function bookmark(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield mock(req);
        yield api_1.default.posts.bookmark(req, data);
        yield helpers.formatApiResponse(200, res);
    });
}
exports.bookmark = bookmark;
function unbookmark(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield mock(req);
        yield api_1.default.posts.unbookmark(req, data);
        yield helpers.formatApiResponse(200, res);
    });
}
exports.unbookmark = unbookmark;
function endorse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield mock(req);
        yield api_1.default.posts.endorse(req, data);
        yield helpers.formatApiResponse(200, res);
    });
}
exports.endorse = endorse;
function unendorse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield mock(req);
        yield api_1.default.posts.unendorse(req, data);
        yield helpers.formatApiResponse(200, res);
    });
}
exports.unendorse = unendorse;
function getDiffs(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helpers.formatApiResponse(200, res, yield api_1.default.posts.getDiffs(req, Object.assign({}, req.params)));
    });
}
exports.getDiffs = getDiffs;
function loadDiff(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helpers.formatApiResponse(200, res, yield api_1.default.posts.loadDiff(req, Object.assign({}, req.params)));
    });
}
exports.loadDiff = loadDiff;
function restoreDiff(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helpers.formatApiResponse(200, res, yield api_1.default.posts.restoreDiff(req, Object.assign({}, req.params)));
    });
}
exports.restoreDiff = restoreDiff;
function deleteDiff(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!parseInt(req.params.pid, 10)) {
            throw new Error('[[error:invalid-data]]');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        const cid = yield posts_1.default.getCidByPid(req.params.pid);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const [isAdmin, isModerator] = yield Promise.all([
            privileges_1.default.users.isAdministrator(req.uid),
            privileges_1.default.users.isModerator(req.uid, cid),
        ]);
        if (!(isAdmin || isModerator)) {
            return helpers.formatApiResponse(403, res, new Error('[[error:no-privileges]]'));
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        yield posts_1.default.diffs.delete(req.params.pid, req.params.timestamp, req.uid);
        yield helpers.formatApiResponse(200, res, yield api_1.default.posts.getDiffs(req, Object.assign({}, req.params)));
    });
}
exports.deleteDiff = deleteDiff;
