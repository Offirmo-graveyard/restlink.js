/* A automatic REST Restlink request handler middleware.
 * Try to fulfill any CRUD request, even on undeclared objects.
 * Must be placed AFTER the callback middleware in the middleware chain !
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


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	constants.CRUD_methods = {
		'GET'    : true,
		'PUT'    : true,
		'POST'   : true,
		'DELETE' : true
	};


	function is_CRUD_request(request) {
		if(!request.method in constants.CRUD_methods)
			return false;

		return true;
	}

	function process_new_CRUD(request, response, next) {
		// TODO
		xxx
	}

	function processing_function(request, response, next) {
		// if we arrive to this middleware,
		// it means that no other MW was able to serve this request,
		// especially the callback one.
		// It means that this rsrc is either not CRUD or not known yet.
		if(is_CRUD_request(request))
		{
			// that's for us : serve it
			// TODO
		}
		else {
			// not for us
			next();
		}
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
