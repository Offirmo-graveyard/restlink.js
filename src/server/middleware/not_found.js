/* A "not found" RestLink request handler middleware.
 * Always answer with 404 not found.
 * Useful to set at the end of a middleware chain.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'restlink/server/middleware/base'
],
function(_, RestlinkMiddlewareBase) {
	"use strict";

	function processing_function(context, request, response, next) {
		response.set_to_not_found();
		response.send();
	}

	var DefinedClass = function RestlinkDefaultMiddleware() {
		// call parent constructor
		RestlinkMiddlewareBase.klass.prototype.constructor.apply(this, [ processing_function ]);
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
