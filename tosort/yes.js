/* A "Yes" RestLink request handler middleware.
 * Which atomatically accept all requests
 * (unless obviously wrong)
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
	[
		'underscore',
		'restlink/server/middleware/base',
		'extended-exceptions',
		'network-constants/http'
	],
	function(_, RestlinkMiddlewareBase, EE, http_constants) {
		"use strict";

		function processing_function(request, response, next) {

			// is the address known ?
			var match_infos = request.get_match_infos();
			// if no, create corresponding rsrc

			// is the method a classic ?
			// todo

			next();
		}

		function back_processing_function(request, response) {

			response.send();
		}

		var DefinedClass = function RestlinkLoggingMiddleware() {
			// call parent constructor
			RestlinkMiddlewareBase.klass.prototype.constructor.apply(this, [ processing_function, back_processing_function ]);
		};

		// in this case, "class" inheritance via prototype chain
		DefinedClass.prototype = Object.create(RestlinkMiddlewareBase.klass.prototype);
		DefinedClass.prototype.constructor = DefinedClass;


		////////////////////////////////////
		return {
			// objects are created via a factory, more future-proof
			'make_new'   : function() { return new DefinedClass(); },
			// but we still expose the constructor to allow class inheritance
			'klass'      : DefinedClass,
			// exposing these allows convenient syntax and also prototypal inheritance
			'constants'  : RestlinkMiddlewareBase.constants,
			'exceptions' : RestlinkMiddlewareBase.exceptions,
			'defaults'   : RestlinkMiddlewareBase.defaults,
			'methods'    : RestlinkMiddlewareBase.methods
		};
	}); // requirejs module
