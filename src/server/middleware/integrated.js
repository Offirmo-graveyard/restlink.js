/* A utility module
 * for exposing restlink integrated middlewares.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'restlink/server/middleware/base',
	'restlink/server/middleware/callback',
	'restlink/server/middleware/logger',
	'restlink/server/middleware/no_middleware',
	'restlink/server/middleware/not_found',
],
function(RestlinkMiddlewareBase, RestlinkCallbackMiddleware, RestlinkLoggerMiddleware, RestlinkDefaultMiddleware, RestlinkNotFoundMiddleware) {
	"use strict";

	////////////////////////////////////
	return {
		base:          function(process_func, process_back_func) { return RestlinkMiddlewareBase.make_new(process_func, process_back_func); },
		callback:      function() { return RestlinkMiddlewareBase.make_new(); },
		logger:        function(mode, log_function)  { return RestlinkLoggerMiddleware.make_new(mode, log_function); },
		no_middleware: function() { return RestlinkDefaultMiddleware.make_new(); },
		not_found:     function() { return RestlinkNotFoundMiddleware.make_new(); }
	};
}); // requirejs module
