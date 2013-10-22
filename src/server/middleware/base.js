/* A generic RestLink request handler
 * Meant to be inserted in a server or in a handler chain
 * can handle requests or dispatch them to other objects.
 * API derived from express.js / connect.js for least surprise.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when'
],
function(_, when) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	//constants. = ;


	////////////////////////////////////
	//defaults. = ;
	defaults.processing_function = function base_middleware_default_processing_function(transaction, request, response, next) {
		todo
	};
	defaults.next_middleware_ = undefined; //< if chain, the middleware we must pass to

	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//methods. = ;


	// default implementation, to be overriden of course
	methods.use = function(middleware) {
		if(!this.next_middleware_) {
			this.next_middleware_ = middleware;
		}
		else {
			this.next_middleware_.use(middleware);
		}
	};

	function next_implementation(current_mw, transaction, request, response, optional_back_function) {
		if(!current_mw.next_middleware_) {
			// no middleware after us !
			// we should NOT have called next, then !
			todo generate an error
		}
		else {
			if(typeof optional_back_function !== 'function') {
				// WTF ?
			}
			else {
				var deferred = when.defer();
				var promise = deferred.promise;
				response.middleware_.deferred_chain_.push(deferred);
				promise.spread(function(transaction, request, response) {
					back_function(transaction, request, response);
				});
			}

			current_mw.next_middleware_.process_request(transaction, request, response);
		}
	}


	// default implementation, to be overriden of course
	methods.process_request = function(transaction, request, response) {

		var current_mw = this; // closure
		var next = function(optional_back_function) {
			// see above
			next_implementation(current_mw, transaction, request, response, optional_back_function);
		};

		this.processing_function(transaction, request, response, next);

		return deferred.promise;
	};


	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(exceptions);
	Object.freeze(defaults);
	Object.freeze(methods);

	var DefinedClass = function RestlinkMiddlewareBase(process, process_back) {
		_.defaults( this, defaults );

		// other inits...

	};

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
