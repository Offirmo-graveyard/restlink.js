/* A passing RestLink request handler middleware.
 * Log request and response
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'restlink/server/middleware/base'
],
function(_, RestlinkMiddlewareBase) {
	"use strict";

	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};

	////////////////////////////////////
	constants.modes = ["simple"];

	////////////////////////////////////
	defaults.mode_ = "simple";

	////////////////////////////////////
	function default_log_function(){
		console.log.apply(console, arguments);
	}
	defaults.log_function_ = default_log_function;

	function processing_function(context, request, response, next, that) {
		that.log_function_(
				request.date
				+ " > request "
				+ request.uri
				+ "." + request.method
				+ "(" + request.content + ")"
			);
		next();
	}
	function back_processing_function(context, request, response, that) {
		that.log_function_(
				response.date
				+ " < response to "
				+ request.uri
				+ "." + request.method
				+ "(...) : "
				+ "[" + response.return_code + "] "
				+ '"' + response.content + '"'
			);
		response.send();
	}

	////////////////////////////////////
	// inheriting and extending base fields

	// prototypal inheritance from RestlinkMiddlewareBase
	_.defaults( constants,  RestlinkMiddlewareBase.constants );
	_.defaults( exceptions, RestlinkMiddlewareBase.exceptions );
	_.defaults( defaults,   RestlinkMiddlewareBase.defaults );
	_.defaults( methods,    RestlinkMiddlewareBase.methods );

	Object.freeze(constants);
	Object.freeze(exceptions);
	Object.freeze(defaults);
	Object.freeze(methods);

	// contructor
	var DefinedClass = function RestlinkLoggingMiddleware(mode, custom_log_function) {

		// analyze and fix params
		if(typeof mode === "function" && typeof custom_log_function === "undefined") {
			custom_log_function = mode;
			mode = undefined;
		}

		// call parent constructor
		RestlinkMiddlewareBase.klass.prototype.constructor.apply(this, [ processing_function, back_processing_function ]);

		// now apply our own defaults (in this order this time)
		_.defaults( this, defaults );

		// other custom processing
		if(typeof mode !== "undefined") {
			this.mode_ = mode;
		}
		if(typeof custom_log_function !== 'undefined') {
			this.log_function_ = custom_log_function;
		}
	};

	// in this case, "class" inheritance via prototype chain
	DefinedClass.prototype = Object.create(RestlinkMiddlewareBase.klass.prototype);
	DefinedClass.prototype.constructor = DefinedClass;

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);

	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		'make_new'   : function(mode, log_function) { return new DefinedClass(mode, log_function); },
		// but we still expose the constructor to allow class inheritance
		'klass'      : DefinedClass,
		// exposing these allows convenient syntax and also prototypal inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
