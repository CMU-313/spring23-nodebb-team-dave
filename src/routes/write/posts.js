"use strict";
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
const express_1 = __importDefault(require("express"));
const middleware = require("../../middleware");
const controllers = require("../../controllers");
const routeHelpers = require("../helpers");
const router = express_1.default.Router();
const { setupApiRoute } = routeHelpers;
module.exports = function () {
    const middlewares = [middleware.ensureLoggedIn];
    setupApiRoute(router, "get", "/:pid", [], controllers.write.posts.get);
    // There is no POST route because you POST to a topic to create a new post. Intuitive, no?
    setupApiRoute(
        router,
        "put",
        "/:pid",
        [...middlewares, middleware.checkRequired.bind(null, ["content"])],
        controllers.write.posts.edit
    );
    setupApiRoute(
        router,
        "delete",
        "/:pid",
        [...middlewares, middleware.assert.post],
        controllers.write.posts.purge
    );
    setupApiRoute(
        router,
        "put",
        "/:pid/state",
        [...middlewares, middleware.assert.post],
        controllers.write.posts.restore
    );
    setupApiRoute(
        router,
        "delete",
        "/:pid/state",
        [...middlewares, middleware.assert.post],
        controllers.write.posts.delete
    );
    setupApiRoute(
        router,
        "put",
        "/:pid/move",
        [
            ...middlewares,
            middleware.assert.post,
            middleware.checkRequired.bind(null, ["tid"]),
        ],
        controllers.write.posts.move
    );
    setupApiRoute(
        router,
        "put",
        "/:pid/vote",
        [
            ...middlewares,
            middleware.checkRequired.bind(null, ["delta"]),
            middleware.assert.post,
        ],
        controllers.write.posts.vote
    );
    setupApiRoute(
        router,
        "delete",
        "/:pid/vote",
        [...middlewares, middleware.assert.post],
        controllers.write.posts.unvote
    );
    setupApiRoute(
        router,
        "put",
        "/:pid/bookmark",
        [...middlewares, middleware.assert.post],
        controllers.write.posts.bookmark
    );
    setupApiRoute(
        router,
        "delete",
        "/:pid/bookmark",
        [...middlewares, middleware.assert.post],
        controllers.write.posts.unbookmark
    );
    // Below defines the middleware of backend api request of endorsing
    setupApiRoute(
        router,
        "put",
        "/:pid/endorse",
        [...middlewares, middleware.assert.post],
        controllers.write.posts.endorse
    );
    setupApiRoute(
        router,
        "delete",
        "/:pid/endorse",
        [...middlewares, middleware.assert.post],
        controllers.write.posts.unendorse
    );
    setupApiRoute(
        router,
        "get",
        "/:pid/diffs",
        [middleware.assert.post],
        controllers.write.posts.getDiffs
    );
    setupApiRoute(
        router,
        "get",
        "/:pid/diffs/:since",
        [middleware.assert.post],
        controllers.write.posts.loadDiff
    );
    setupApiRoute(
        router,
        "put",
        "/:pid/diffs/:since",
        [...middlewares, middleware.assert.post],
        controllers.write.posts.restoreDiff
    );
    setupApiRoute(
        router,
        "delete",
        "/:pid/diffs/:timestamp",
        [...middlewares, middleware.assert.post],
        controllers.write.posts.deleteDiff
    );
    return router;
};
