/* A restlink server session
 * A session is a set of data shared across several requests
 * Can contains login status, etc.
 * Can expire after a set of time, etc.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'extended-exceptions',
	'restlink/utils/fast_timestamp'
],
function(_, EE, FastTimestamp) {
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
	defaults.timeout_in_millis_ = 60000; // 1 min

	methods.init = function() {
		// init of member objects
		this.server_                = undefined; // ref to the server core
		this.last_access_timestamp_ = this.creation_timestamp_ = FastTimestamp.get_timestamp();
		this.is_valid_              = true; // by default
		this.current_requests_      = [];
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//methods. = ;
	methods.set_server = function(server) {
		this.server_ = server;
	};
	methods.get_server_core = function() {
		return this.server_;
	};

	/** Enrich a "raw" request to manage it
	 */
	function request_additions_get_session() {
		return this.session_infos_.parent_session;
	}
	function request_additions_is_done() {
		return this.session_infos_.is_done;
	}
	function request_additions_set_to_done() {
		this.session_infos_.is_done = true;
		this.session_infos_.parent_session = undefined;
	}
	methods.register_request = function(request) {
		if( typeof request !== "object")
			throw new EE.InvalidArgument("Session expected a request object !");

		if(!this.is_valid())
		{
			// this session is invalid. No new requests are possible.
			throw new EE.IllegalStateError("Closed session may not accept new requests !");
		}

		// augment the request object
		if(request.hasOwnProperty('session_infos_'))
		{
			// WAT ? already augmented ?
			throw new EE.IllegalStateError("Session : this request is already managed !");
		}

		// pack our additions under a common prop
		request.session_infos_ = {
			parent_session : this, // ref to parent session
			timestamp : FastTimestamp.get_timestamp(),
			is_done : false // are we done with this request ? (either fulfilled or rejected/expired)
		};

		// add some methods
		request.get_session = request_additions_get_session;
		request.is_done = request_additions_is_done;
		request.done = request_additions_set_to_done;

		// keep track of this request
		// for further inspection, invalidation or timeout
		this.current_requests_.push(request);
	};


	/**
	 * Sets the time in milliseconds that the session may remain idle before
	 * expiring.
	 */
	methods.set_timeout_in_millis = function(timeout) {
		this.timeout_in_millis_ = timeout;
		throw "not implemented : close expired requests";
	};

	/**
	 * Returns the time in milliseconds that the session session may remain
	 * idle before expiring.
	 */
	methods.get_timeout_in_millis = function() {
		return this.timeout_in_millis_;
	};

	/**
	 * Returns the time the session was created
	 * i.e. the time the system created the instance.
	 */
	methods.get_creation_timestamp = function() {
		return this.creation_timestamp_;
	};
	/**
	 * Returns the last time the application received a request or method invocation from the user associated
	 * with this session. Internal calls to this method should not affect access time.
	 */
	methods.get_last_access_timestamp = function() {
		return this.last_access_timestamp_;
	};

	/**
	 * Explicitly updates the {@link #getLastAccessTime lastAccessTime} of this session to the current
	 * time when this method is invoked.
	 */
	methods.touch = function() {
		this.last_access_timestamp_ = FastTimestamp.get_timestamp();
	};

	/**
	 * Explicitly invalidates this session and releases all associated
	 * resources. TOREVIEW
	 */
	methods.invalidate = function() {
		this.is_valid_ = false;
		// also invalidate all associated pending requests
		_.each(this.current_requests_, function(req) {
			req.done(); // done with it. TODO send error responses ?
		});
		this.current_requests_ = []; // no need to keep invalidated requests
		// release refs (really needed ?)
		this.server_ = undefined;
	};

	/** check current validity
	 */
	methods.is_valid = function() {
		return this.is_valid_;
	};

	methods.terminate_request = function(req) {
		req.done();
		// keep only the valid ones
		this.current_requests_ = _.filter(this.current_requests_, function(req){ return ! req.is_done(); });
	};



	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkServerSession() {
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
