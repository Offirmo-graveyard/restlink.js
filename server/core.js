/* A generic REST 'server' executing REST operations
 * transport agnostic : can run on server or in client
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'extended-exceptions',
	'base-objects/offinh/startable_object',
	'restlink/server/rest_target_indexed_shared_container',
	'restlink/server/session'
],
function(_, when, EE, StartableObject, RestIndexedContainer, ServerSession) {
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

		// the server should know its adapters
		// to be able to transmit them some events (startup/shutdown for ex.)
		this.adapters_ = [];
		// handling is done by chainable middlewares.
		// We only know the head and don't care about the rest
		this.head_middleware_ = undefined; // or null ?
		// we provide a generic rest-indexed shared container
		this.rest_indexed_shared_container = RestIndexedContainer.make_new();
		// to be able to stop them
		this.sessions_ = [];
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//methods. = ;

	methods.add_adapter = function(adapter) {
		if(typeof adapter !== 'object')
			throw new EE.InvalidArgument("Invalid adapter provided !");

		this.adapters_.push(adapter);
		if( this.is_started()) {
			adapter.startup(this);
		}
	};

	methods.use = function(middleware) {
		if(!this.head_middleware_) {
			this.head_middleware_ = middleware;
		}
		else {
			this.head_middleware_.use(middleware);
		}
	};

	// override of parent
	methods.startup = function() {
		// do some verifications
		if(typeof this.head_middleware_ === 'undefined') {
			throw new EE.InvalidArgument("No middleware provided !");
		}
		// call parent
		StartableObject.methods.startup.apply(this);

		var this_ = this; // for the call below
		_.each(this.adapters_, function(adapter) {
			adapter.startup(this_);
		});
	};

	// override of parent
	methods.shutdown = function() {
		// shutdown adapters so we won't receive new requests
		_.each(this.adapters_, function(adapter) {
			adapter.shutdown();
		});

		// also invalidate all existing sessions
		_.each(this.sessions_, function(session) {
			session.invalidate();
		});
		this.sessions_ = []; // no need to keep invalidated sessions

		// call parent
		StartableObject.methods.shutdown.apply(this);
	};

	methods.create_session = function() {
		if(!this.is_started())
			throw new EE.IllegalStateError("Can't create new session : server is stopped !");
		var session = ServerSession.make_new();
		session.set_server(this);
		this.sessions_.push(session);
		return session;
	};

	methods.terminate_session = function(session) {
		session.invalidate();

		// keep only the valid sessions
		this.sessions_ = _.filter(this.sessions_, function(session){ return session.is_valid(); });
	};

	methods.process_request = function(request) {
		if(!this.is_started())
			throw new EE.IllegalStateError("Can't create new session : server is stopped !");

		if(!request.hasOwnProperty('get_session'))
			throw new EE.InvalidArgument("Core : request must be registered to a session before processing !");

		if(!request.get_session().is_valid())
			throw new EE.InvalidArgument("Core : request session is no longer valid !");

		// REM : middleware will correctly create the response if not provided
		return this.head_middleware_.initiate_processing(request);
	};

	methods.get_rest_indexed_container = function() {
		return this.rest_indexed_shared_container;
	};


	////////////////////////////////////

	// inheritance

	// prototypal inheritance from StartableObject
	_.defaults(constants, StartableObject.constants);
	_.defaults(defaults,  StartableObject.defaults);
	_.defaults(methods,   StartableObject.methods);
	// exceptions ?

	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkServerCore() {
		_.defaults( this, defaults ); // also set parent's defaults

		// optional : call parent constructor (after setting our defaults)
		//StartableObject.prototype.constructor.apply(this);

		// other inits...
		methods.init.apply(this, arguments);
	};

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);


	////////////////////////////////////
	return {
		'klass' : DefinedClass,
		// objects are created via a factory, more future-proof
		'make_new': function() { return new DefinedClass(); },
		// exposing these allows inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
