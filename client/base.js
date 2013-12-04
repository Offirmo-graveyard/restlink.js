/* Base adapter class for a RESTlink client adapter
 * This class is not to be used 'as is' but is to be derived.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'restlink/core/response',
	'network-constants/http'
],
function(_, when, Response, http_constants) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	//constants. = ;

	// GET, PUT, POST, DELETE, OPTIONS, HEAD, TRACE, CONNECT


	////////////////////////////////////
	defaults.debug_mode = true; // add controls, etc.
	defaults.connected = true; // to mark disconnected

	methods.init = function() {
		// init of member objects
		//...
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	methods.process_request = function(request) {
		var result_deferred = when.defer();

		this.resolve_request_(request, result_deferred);

		return result_deferred.promise;
	};

	// this method is to be overriden
	methods.resolve_request_ = function(request, result_deferred) {
		// default implementation : always fail ! (since has to be overriden)
		var response = request.make_response()
			.with_status(http_constants.status_codes.status_501_server_error_not_implemented)
			.with_meta({ error_msg: 'ClientAdapterBase process_request is to be implemented in a derived class !' });

		result_deferred.resolve([request, response]);
	};

	methods.disconnect = function() {
		// TODO
		// requests should no longer be possible
	};

		////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function ClientAdapterBase() {
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