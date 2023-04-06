'use strict';

const router = require('express').Router();
const middleware = require('../../middleware');
const controllers = require('../../controllers');
const routeHelpers = require('../helpers');

const { setupApiRoute } = routeHelpers;

module.exports = function () {
  const middlewares = [middleware.ensureLoggedIn];

  setupApiRoute(router, 'post', '/register', [...middlewares], controllers.write.career.register);

  return router;
};
