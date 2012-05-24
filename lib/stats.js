/*!
 * Carbon Stats Middleware
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var hakaru = require('hakaru');

/*!
 * Main exports
 */

var exports = module.exports = createRepository;

/*!
 * Version
 */

exports.version = '0.0.0';

/*!
 * Adding storage options to stats exports
 */

exports.MemoryStore = hakaru.MemoryStore;

/*!
 * Returning a new hakaru repository with options
 */

function createRepository (options) {
  options = options || {};
  var stats = new hakaru.Repository(options);

  // Augmenting our stats object with middleware function
  stats.middleware = function (opts) {
    opts = opts || {};
    var request = opts.request || 'request'
      , response = opts.response || 'response'
      , missed = opts.missed || 'missed';

    // actual middleware function for proxy
    return function (req, res, next) {
      stats.mark(request);
      res.once('proxy start', function () {
        var end = stats.start(response);
        res.once('proxy end', end);
      });
      req.once('proxy miss', stats.deferMark(missed));
      next();
    }
  }

  // allows user to provide own reporting mechanisms
  return stats;
}
