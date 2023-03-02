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

Posts.unvote = async (req, res) => {
    const data = await mock(req);
    await api.posts.unvote(req, data);
    helpers.formatApiResponse(200, res);
};

Posts.bookmark = async (req, res) => {
    const data = await mock(req);
    await api.posts.bookmark(req, data);
    helpers.formatApiResponse(200, res);
};

Posts.unbookmark = async (req, res) => {
    const data = await mock(req);
    await api.posts.unbookmark(req, data);
    helpers.formatApiResponse(200, res);
};

//
Posts.endorse = async (req, res) => {
    const data = await mock(req);
    await api.posts.endorse(req, data);
    helpers.formatApiResponse(200, res);
};

Posts.unendorse = async (req, res) => {
    const data = await mock(req);
    await api.posts.unendorse(req, data);
    helpers.formatApiResponse(200, res);
};

Posts.getDiffs = async (req, res) => {
    helpers.formatApiResponse(200, res, await api.posts.getDiffs(req, { ...req.params }));
};

Posts.loadDiff = async (req, res) => {
    helpers.formatApiResponse(200, res, await api.posts.loadDiff(req, { ...req.params }));
};

Posts.restoreDiff = async (req, res) => {
    helpers.formatApiResponse(200, res, await api.posts.restoreDiff(req, { ...req.params }));
};

Posts.deleteDiff = async (req, res) => {
    if (!parseInt(req.params.pid, 10)) {
        throw new Error('[[error:invalid-data]]');
    }

    const cid = await posts.getCidByPid(req.params.pid);
    const [isAdmin, isModerator] = await Promise.all([
        privileges.users.isAdministrator(req.uid),
        privileges.users.isModerator(req.uid, cid),
    ]);

    if (!(isAdmin || isModerator)) {
        return helpers.formatApiResponse(403, res, new Error('[[error:no-privileges]]'));
    }

    await posts.diffs.delete(req.params.pid, req.params.timestamp, req.uid);

    helpers.formatApiResponse(200, res, await api.posts.getDiffs(req, { ...req.params }));
};
