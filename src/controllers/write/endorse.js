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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endorse = exports.post = void 0;
const posts_1 = __importDefault(require("../../posts"));
const privileges_1 = __importDefault(require("../../privileges"));
const api_1 = __importDefault(require("../../api"));
const helpers_1 = __importDefault(require("../helpers"));
function post(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const postData = yield api_1.default.posts.get(req, { pid: req.params.pid });
        try {
            yield helpers_1.default.formatApiResponse(200, res, postData);
        }
        catch (err) {
            console.log('error');
        }
    });
}
exports.post = post;
function mock(req) {
    return __awaiter(this, void 0, void 0, function* () {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const { tid } = yield posts_1.default.getPostField(req.params.pid, 'tid');
        return { pid: req.params.pid, room_id: `topic_${tid}` };
    });
}
function endorse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield mock(req);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield api_1.default.posts.endorse(req, data);
        yield helpers_1.default.formatApiResponse(200, res);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const cid = yield posts_1.default.getCidByPid(req.params.pid);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const [isAdmin, isModerator] = yield Promise.all([
            privileges_1.default.users.isAdministrator(req.uid),
            privileges_1.default.users.isModerator(req.uid, cid),
        ]);
        if (!(isAdmin || isModerator)) {
            return helpers_1.default.formatApiResponse(403, res, new Error('[[error:no-privileges]]'));
        }
    });
}
exports.endorse = endorse;
