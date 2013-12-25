/* Transaction = restlink server request processing context
 * It stores essential data for processing one and only one request.
 * Observing handlers may store data in this transaction
 * to retrieve them later in the processing.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'extended-exceptions'
],
function(_, when, EE) {
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

	methods.init = function() {
		// init of member objects

		// direct access allowed
		this.parent_session = undefined; //< the session we belong to. If closed, we should be closed too.
		this.request        = undefined; //< the request which caused the creation of this transaction

		// direct access not allowed (use accessors)
		this.is_valid_ = true;
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//methods. = ;

	/* We may want to forcefully end a transaction.
	 * When marked for termination :
	 * - no request should be accepted (should not happen since 1 trans = 1 req)
	 * - only error messages may be sent back.
	 * - handlers or adapters must release their references (if any) on this transaction
	 *   and release associated resources (if any).
	 */
	methods.invalidate = function() {
		this.is_valid_ = false;
		this.parent_session = undefined; // for avoiding ref loops
	};

	methods.is_valid = function() {
		return this.is_valid_;
	};

	/*
	methods.forward_to_handler = function(request_handler) {
		request_handler.handle_request(this, this.request);
	};

	methods.forward_to_handler_and_intercept_response = function(request_handler) {
		var deferred = when.defer();
		this.deferred_chain_.push(deferred);

		request_handler.handle_request(this, this.request);

		return deferred.promise;
	};
*/
	// TOREVIEW
	/* Depending on the underlying protocol,
	 * push may or may not be possible.
	 * Handlers must know it to either :
	 * - mitigate if possible (aggregation)
	 * - reject requests if no mitigation possible.
	 * Note : This flag should be set by the adapter,
	 *        for use by handlers.
	 */
	//virtual void setPushAllowed(bool) = 0;



	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkServerTransaction() {
		_.defaults( this, defaults );
		// other inits...
		methods.init.apply(this, arguments);
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
