/* Base class for a RESTlink client adapter
 * This class is not to be used 'as is' but is to be derived.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'extended-exceptions',
	'restlink/core/request',
	'restlink/utils/serialization_utils',
	'network-constants/http'
],
function(_, when, EE, Request, SerializationUtils, http_constants) {
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
	//defaults.

	methods.init = function() {
		// init of member objects
		this.debug_mode_ = true; // add controls, etc.
		this.connected_ = true; // to mark disconnected
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	// utility
	methods.make_new_request = function() {
		return Request.make_new();
	};

	methods.process_request = function(request) {
		if(!this.connected_)
			throw new EE.IllegalStateError("This client is disconnected !");

		// check the request and correct it if needed
		SerializationUtils.auto_serialize_content_if_needed(request);

		var result_deferred = when.defer();
		var temp_deferred = when.defer();

		this.resolve_request_(request, temp_deferred);
		temp_deferred.promise.spread(function(request, response) {
			SerializationUtils.auto_deserialize_content_if_needed(request);
			SerializationUtils.auto_deserialize_content_if_needed(response);
			result_deferred.resolve( [request, response] );
		});
		temp_deferred.promise.otherwise(function() {
			result_deferred.reject( arguments );
		});

		return result_deferred.promise;
	};

	// TOREVIEW
	methods.process_long_living_request = function(request, callback) {
		throw new EE.NotImplementedError("process_long_living_request");
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
		this.connected_ = false;
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
