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
	'restlink/server/session',
	'restlink/server/middleware/integrated',
],
function(_, when, EE, StartableObject, RestIndexedContainer, ServerSession, IntegratedMiddlewares) {
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
		this.server_adapters_ = [];
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
		this.server_adapters_.push(adapter);
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
		_.each(this.server_adapters_, function(adapter) {
			adapter.startup(this_);
		});
	};
	// for tests
	methods.startup_with_default_mw = function() {
		// add a default middleware
		this.use(IntegratedMiddlewares.default.make_new());

		// call the original function
		this.startup();
	};

	// override of parent
	methods.shutdown = function() {

		// shutdown adapters so we won't receive new requests
		_.each(this.server_adapters_, function(adapter) {
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

	// utility, very useful for unit tests
	methods.startup_create_session_and_create_transaction = function() {
		if(!this.is_started())
			this.startup();
		var session = this.create_session();
		return session.create_transaction();
	};

	methods.terminate_session = function(session) {
		session.invalidate();

		// keep only the valid sessions
		this.sessions_ = _.filter(this.sessions_, function(session){ return session.is_valid(); });
	};

	methods.process_request = function(transaction, request) {
		if(!this.is_started())
			throw new EE.IllegalStateError("Can't create new session : server is stopped !");

		// REM : middleware will correctly create the response if not provided
		return this.head_middleware_.head_process_request(transaction, request);
	};

	/// TOSORT
	// routes and their associated callbacks
	// let's use the convenient 'Router' from Backbone
	// TODO replace with optimized version ?
	//router: new Backbone.Router()



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
		//StartableObject.prototype.constructor.apply(this, arguments);
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
