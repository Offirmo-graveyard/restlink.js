/* A generic RestLink request handler
 * Meant to be inserted in a server or in a handler chain
 * can handle requests or dispatch them to other objects.
 * API derived from express.js / connect.js for least surprise.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'extended-exceptions',
	'restlink/server/middleware/response_enrichments'
],
function(_, when, EE, ResponseEnricher) {
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

	// default implementation, to be overriden of course
	// @param context : user-provided context object (passed along but untouched by the middleware. Can be left to undefined.
	// @param request : a request object that will be passed along. Can be anything.
	// @param response : a response object that will be passed along. Can be anything, will have been "enriched" with the middleware special methods.
	// @param next : a function to call to transfer to next middleware. Will throw if none.
	defaults.processing_function_ = function base_middleware_default_processing_function(context, request, response, next) {
		if(typeof this.next_middleware_ !== "undefined") {
			// pass to next
			next();
		}
		else {
			response.send();
		}
	};
	defaults.next_middleware_ = undefined; //< if chain, the middleware just after us to whom we may transfer the processing

	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//methods. = ;


	// add a chained middleware after this one.
	// will be inserted at the end of current chain.
	methods.use = function(middleware) {
		if(!this.next_middleware_) {
			this.next_middleware_ = middleware;
		}
		else {
			this.next_middleware_.use(middleware);
		}
	};


	// implementation of method "next" which is provided as a param
	// if a back function is given, it'll have to call send() again to continue the processing.
	function next_implementation(current_mw, context, request, response, optional_back_function) {
		if(!current_mw.next_middleware_) {
			// no middleware after us !
			// we should NOT have called next, then !
			throw new EE.IllegalStateError("Can't forward to next middleware, having none !");
		}
		else {
			if(typeof optional_back_function !== "undefined") {
				var deferred = when.defer();
				response.middleware_.deferred_chain_.push(deferred);
				deferred.promise.spread(function(context, request, response) {
					optional_back_function(context, request, response);
				});
			}
		}

		current_mw.next_middleware_.process_request_(context, request, response);
	}


	// wrapper around the user-defined processing function
	// @see processing_function_
	methods.process_request_ = function(context, request, response) {

		// create the "next" parameter
		var current_mw = this; // closure
		var next = function(optional_back_function) {
			// see above
			next_implementation(current_mw, context, request, response, optional_back_function);
		};

		// call the (hopefully) user-defined processing function
		this.processing_function_(context, request, response, next);
	};


	// Launch of the middleware processing chain.
	// should only be called on the head middleware !
	// Not mandatory if you wan to initialize the middleware manually
	methods.head_process_request = function(context, request, response) {

		// create the response if not created yet
		if(typeof response === "undefined") {
			response = request.make_response(); // REM this response is set to "internal error" by default

			// we add some utility methods to the response
			ResponseEnricher.process(response, request, context);
		}

		// initiate the middleware chain
		// by inserting a root deferred
		if(response.middleware_.deferred_chain_.length !== 0) {
			// WAT ? what is the use of calling this function
			// if everything is already done ??
			throw new EE.InvalidArgument("Offirmo Middleware : Middleware chain already initialized !");
		}
		var deferred = when.defer();
		deferred.debug_mark = true;
		response.middleware_.deferred_chain_.push(deferred);

		// now use the usual function
		this.process_request_(context, request, response);

		return deferred.promise;
	};


	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(exceptions);
	Object.freeze(defaults);
	Object.freeze(methods);

	var DefinedClass = function RestlinkMiddlewareBase(process_func, process_back_func) {
		_.defaults( this, defaults );

		// other inits...
		if(typeof process_func !== "undefined") {
			this.processing_function_ = process_func;
		}
	};

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);


	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		'make_new'   : function(process_func, process_back_func) { return new DefinedClass(process_func, process_back_func); },
		// but we still expose the constructor to allow class inheritance
		'klass'      : DefinedClass,
		// exposing these allows convenient syntax and also prototypal inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
