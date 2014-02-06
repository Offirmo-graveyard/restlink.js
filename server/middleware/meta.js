/* A meta restLink request handler middleware.
 * Serves :
 * OPTIONS
 * TRACE
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'restlink/server/middleware/base',
	'restlink/server/rest_target_indexed_shared_container',
],
function(_, BaseMiddleware, RestContainer) {
	"use strict";

	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};

	////////////////////////////////////
	//constants. = ;

	////////////////////////////////////
	defaults.denomination_ = "MetaMW";

	////////////////////////////////////
	methods.process_OPTIONS_global_ = function(request, response) {
		// Test global server features.
		// Not handled for now.
		response.set_to_not_implemented();
		response.send();
	};
	methods.process_OPTIONS_local_ = function(request, response) {
		var known_methods = RestContainer.list_matched_methods(request.get_match_infos());
		var serialized_methods = known_methods.join(', ');
		response.meta['Allow'] = serialized_methods;
		// CORS headers http://www.w3.org/TR/cors/
		// very important : Backbone default sync() requires them to work !
		// TODO SEC
		response.meta['Access-Control-Allow-Methods'] = serialized_methods;
		response.meta['Access-Control-Allow-Origin'] = '*';
		response.meta['Access-Control-Allow-Headers'] = 'Content-Type'; // all alowed or just this one ??

		response.set_to_ok();
		response.send();
	};

	methods.process_TRACE_ = function(request, response) {
		// Just returns the same content we received.
		// SEC Note that there are security issues with this method,
		// but it's not here that it should be filtered.
		response.content = request.content;
		response.content_type = request.content_type;
		response.send();
	};

	// replace parent's one
	defaults.processing_function_ = function meta_mw_processing_function(request, response, next) {
		try {

			// those methods don't require match infos

			if(request.method === 'OPTIONS' && request.uri === '*') {
				this.process_OPTIONS_global_(request, response);
				return;
			}

			if(request.method === 'TRACE') {
				this.process_TRACE_(request, response);
				return;
			}

			// those methods DO require match infos

			var match_infos = request.get_match_infos();
			if(!match_infos.route_found) {
				// will forward to next handler.
				// not handled.
			}
			else {
				if(request.method === 'OPTIONS') {
					// this one is for us !
					this.process_OPTIONS_local_(request, response);
					return;
				}
			}
		}
		catch(e) {
			// unknown error
			response.content_type = 'text/plain';
			response.set_to_internal_error(e.name + "\n" + e.message + "\n" + e.stack);
			response.send();
			return;
		}

		// not handled yet ?
		next();
	};

	////////////////////////////////////
	// inheriting and extending base fields

	// prototypal inheritance from BaseMiddleware
	_.defaults( constants,  BaseMiddleware.constants );
	_.defaults( exceptions, BaseMiddleware.exceptions );
	_.defaults( defaults,   BaseMiddleware.defaults );
	_.defaults( methods,    BaseMiddleware.methods );

	Object.freeze(constants);
	Object.freeze(exceptions);
	Object.freeze(defaults);
	Object.freeze(methods);

	// contructor
	var DefinedClass = function RestlinkMetaMiddleware() {

		// first set our own defaults
		_.defaults( this, defaults );

		// call parent constructor
		BaseMiddleware.klass.prototype.constructor.apply(this);
	};

	// in this case, "class" inheritance via prototype chain
	DefinedClass.prototype = Object.create(BaseMiddleware.klass.prototype);
	DefinedClass.prototype.constructor = DefinedClass;

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);

	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		'make_new'   : function() { return new DefinedClass(); },
		// but we still expose the constructor to allow class inheritance
		'klass'      : DefinedClass,
		// exposing these allows convenient syntax and also prototypal inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
