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
	// utility : create a blank request
	// this avoid having to explicit load the Request module
	methods.make_new_request = function() {
		return Request.make_new();
	};

	// called by user
	// returns a promise :
	// ✓ response
	//    -> NOTE that response may be an error response (ex. 404 etc.)
	// ✕ Error
	//    -> means that the request could not be processed
	//       only for exceptional reasons :
	//       - invalid state (connection lost)
	//       - bug from user = incorrect call, ex. bad arguments
	//       - internal bug
	methods.process_request = function(request) {
		try {
			if(!this.connected_)
				throw new EE.IllegalState("This client is disconnected !");

			// check the request and correct it if needed :
			// - serialize content if needed (may throw if failure)
			SerializationUtils.auto_serialize_content_if_needed(request);

			// call internal function
			var temp_promise = when.resolve( this.resolve_request_(request) );

			// filter the result
			var result_promise = temp_promise.then( function(response) {
					// may throw in which case result_promise will be rejected
					SerializationUtils.auto_deserialize_content_if_needed(request);
					SerializationUtils.auto_deserialize_content_if_needed(response);
					// return : so this value will be used to resolve result_promise
					return response;
				}
				// no need for an error function : will be automatically transferred to result_promise
			);
			return result_promise;
		}
		catch(e) {
			return when.reject( e );
		}
	};

	// TOREVIEW
	methods.process_long_living_request = function(request, callback) {
		throw new EE.NotImplemented("process_long_living_request");
	};

	// this method is to be overriden
	// must return a response or a promise(response), either way works
	methods.resolve_request_ = function(request) {
		// default implementation : always fail ! (since has to be overriden)
		var response = request.make_response()
			.with_status(http_constants.status_codes.status_501_server_error_not_implemented)
			.with_meta({ error_msg: 'ClientAdapterBase process_request is to be implemented in a derived class !' });

		return response;
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
