/* Direct adapter class for a RESTlink client adapter
 * This adapter works via direct (local) function calls
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'restlink/core/request',
	'restlink/server/adapters/base',
	'restlink/client/base',
	'extended-exceptions'
],
function(_, when, Request, ServerBaseAdapter, BaseClient, EE) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	//constants. = ;


	////////////////////////////////////
	// internal class
	function DirectRestlinkClient(server) {
		var session = server.create_session();
		var connected = true; // by default at start

		// REM : this creates a closure
		this.process_request = function(request) {
			if(!connected) {
				throw new EE.IllegalStateError("Can't send request : This client is disconnected !");
			}

			var client_deferred = when.defer();

			var transaction = session.create_transaction(request);
			var server_promise = server.process_request(transaction, request);

			server_promise.spread(function(transaction, request, response){
				client_deferred.resolve([request, response]);
				transaction.invalidate(); // done with it
			});

			return client_deferred.promise;
		};

		this.send_long_living_request = function(request, callback) {
			// TODO
		};

		this.disconnect = function() {
			connected = false;
			session.invalidate();
		};
	}
	DirectRestlinkClient.prototype.make_new_request = function() {
		return Request.make_new();
	} ;

	////////////////////////////////////
	//defaults. = ;

	methods.init = function() {
		// init of member objects
		//...
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//methods. = ;

	methods.new_connection = function() {
		if(! this.is_started()) {
			// should never happen
			throw new Error("Can't open connection : server adapter is stopped.");
		}
		if(! this.server_) {
			// no server ! Can't process !
			// should also never happen
			throw new Error("Can't open connection : server adapter is misconfigured (no server).");
		}
		return new DirectRestlinkClient(this.server_);
	};

	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkServerAdapterDirect() {
		_.defaults( this, defaults ); // TODO enhance

		// call parent constructor (by choice)
		ServerBaseAdapter.klass.prototype.constructor.apply(this, arguments);

		// other inits...
		methods.init.apply(this, arguments);
	};

	// class inheritance via prototype chain
	DefinedClass.prototype = Object.create(ServerBaseAdapter.klass.prototype);
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