/* A generic REST 'server' executing REST operations
 * transport agnostic : can run on server or in client
 * Note : this class is merely a facade arond server/core with an easier API.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'base-objects/offinh/named_object',
	'base-objects/offinh/startable_object',
	'restlink/server/core',
	'restlink/server/middleware/base',
	'restlink/server/middleware/logger',
	'restlink/server/middleware/callback',
	'restlink/server/adapters/direct',
	'restlink/utils/serve_backbone_model'
],
function(_, NamedObject, StartableObject, ServerCore, BaseMiddleware, LoggerMiddleware, CallbackMiddleware, DirectServerAdapter, BBModelServiceUtils) {
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
	function build_middleware_chain_default_impl_() {
		this.core_.use( LoggerMiddleware.make_new() );
		this.core_.use( CallbackMiddleware.make_new() );
		this.core_.use( BaseMiddleware.make_new(function process(req, res, next) {
			res.set_to_not_found();
			res.send();
		}) );
	}
	// to be overriden if needed
	defaults.build_middleware_chain = build_middleware_chain_default_impl_;


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	methods.init_ = function() {
		// init of member objects
		this.core_ = ServerCore.make_new();

		// always add the direct adapter, for convenience
		var direct_adapter = DirectServerAdapter.make_new();
		this.add_adapter( direct_adapter );
		// and also keep a ref to it for later use
		// @see open_direct_connection
		this.direct_adapter_ = direct_adapter;
	};

	methods.ensure_middleware_ = function() {
		if(!this.core_.head_middleware_) {
			this.build_middleware_chain();
		}
	};

	methods.startup = function() {
		this.ensure_middleware_();

		// call parent
		StartableObject.methods.startup.call(this);

		// start members
		this.core_.startup();
	};
	methods.shutdown = function() {
		// (reverse order of start)

		// stop members
		this.core_.shutdown();

		// call parent
		StartableObject.methods.shutdown.call(this);
	};

	methods.add_adapter = function(adapter) {
		this.core_.add_adapter(adapter);
	};

	// convenience
	methods.open_direct_connection = function(adapter) {
		// that's why it was useful to keep a ref to this one
		return this.direct_adapter_.new_connection();
	};

	methods.on = function(route, method, handler, replace_existing) {
		CallbackMiddleware.add_callback_handler(this.core_.rest_indexed_shared_container, route, method, handler, replace_existing);
	};

	// serve Backbone models
	methods.serve_model_at = function(route, model, options) {
		BBModelServiceUtils.register_rest_routes_for_model(this.core_, route, model, options);
	};


	////////////////////////////////////

	// prototypal inheritance from StartableObject
	_.defaults(constants, StartableObject.constants);
	_.defaults(defaults,  StartableObject.defaults);
	_.defaults(methods,   StartableObject.methods);
	// exceptions ?

	// prototypal inheritance from NamedObject
	_.defaults(constants, NamedObject.constants);
	_.defaults(defaults,  NamedObject.defaults);
	_.defaults(methods,   NamedObject.methods);
	// exceptions ?

	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkServer() {
		_.defaults( this, defaults );
		// other inits...
		methods.init_.apply(this, arguments);
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
