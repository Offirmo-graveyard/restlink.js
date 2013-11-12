/* A utility module
 * for exposing restlink integrated middlewares.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'restlink/server/middleware/base',
	'restlink/server/middleware/callback',
	'restlink/server/middleware/default',
	'restlink/server/middleware/logger'
],
function(RestlinkMiddlewareBase, RestlinkCallbackMiddleware, RestlinkDefaultMiddleware, RestlinkLoggerMiddleware) {
	"use strict";

	////////////////////////////////////
	return {
		base:     function(process_func, process_back_func) { return RestlinkMiddlewareBase.make_new(process_func, process_back_func); },
		callback: function() { return RestlinkMiddlewareBase.make_new(); },
		default:  function() { return RestlinkDefaultMiddleware.make_new(); },
		logger:   function(mode, log_function)  { return RestlinkLoggerMiddleware.make_new(mode, log_function); }
	};
}); // requirejs module
