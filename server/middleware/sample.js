/* A passing RestLink request handler middleware.
 * Log request and response
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'restlink/server/middleware/base',
	'extended-exceptions',
	'network-constants/http'
],
function(_, BaseMiddleware, EE, http_constants) {
	"use strict";

	function processing_function(request, response, next) {
		next();
	}

	// optional
	function back_processing_function(request, response) {
		response.send();
	}

	var DefinedClass = function SampleMiddleware() {
		// call parent constructor
		BaseMiddleware.klass.prototype.constructor.apply(this, [ processing_function, back_processing_function ]);
	};

	// in this case, "class" inheritance via prototype chain
	DefinedClass.prototype = Object.create(BaseMiddleware.klass.prototype);
	DefinedClass.prototype.constructor = DefinedClass;


	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		'make_new'   : function() { return new DefinedClass(); },
		// but we still expose the constructor to allow class inheritance
		'klass'      : DefinedClass,
		// exposing these allows convenient syntax and also prototypal inheritance
		'constants'  : BaseMiddleware.constants,
		'exceptions' : BaseMiddleware.exceptions,
		'defaults'   : BaseMiddleware.defaults,
		'methods'    : BaseMiddleware.methods
	};
}); // requirejs module
