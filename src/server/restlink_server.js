/* A generic REST 'server' executing REST operations
 * transport agnostic : can run on server or in client
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'base-objects/offinh/named_object',
	'base-objects/offinh/startable_object',
	'restlink/server/core',
	'restlink/server/middleware/integrated',
	'restlink/server/middleware/actual',
	'restlink/server/adapters/direct'
],
function(_, NamedObject, StartableObject, ServerCore, IntegratedMiddlewares, ActualRequestHandler, DirectServerAdapter) {
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
		this.core_ = ServerCore.make_new();

		// always add the direct adapter, for convenience
		var direct_adapter = DirectServerAdapter.make_new();
		this.add_adapter( direct_adapter );
		// we also keep a ref to it for later use
		this.direct_adapter_ = direct_adapter;
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//methods. = ;


	methods.startup = function() {
		this.ensure_middleware_();

		// call parent
		StartableObject.methods.startup.call(this);

		// start members
		this.core_.startup();
	};
	methods.shutdown = function() {
		// stop members (reverse order)
		this.core_.shutdown();

		// call parent
		StartableObject.methods.shutdown.call(this);
	};

	methods.add_adapter = function(adapter) {
		this.core_.add_adapter(adapter);
	};

	// convenience
	methods.open_direct_connection = function(adapter) {
		return this.direct_adapter_.new_connection();
	};

	// to be overriden if needed
	methods.build_middleware_ = function() {
		this.core_.use( IntegratedMiddlewares.logger() );
		this.core_.use( IntegratedMiddlewares.actual() );
		this.core_.use( IntegratedMiddlewares.default() );
	};

	methods.ensure_middleware_ = function() {
		if(!this.core_.head_middleware_) {
			this.build_middleware_();
		}
	};

	methods.add_callback_handler = function(route, method, handler, replace_existing) {
		ActualRequestHandler.add_callback_handler(this.core_.rest_indexed_shared_container, route, method, handler, replace_existing);
	};

	methods.add_restful_rsrc_handler = function(restful_handler, replace_existing) {
		//todo !
	};


	/*
	 virtual void addAdapter(const server::IAdapterPtr& adapter);

	 virtual void addRsrcHandler(const server::IResourceHandlerPtr& handler, const std::string& parentRoute = "");

	 virtual void addRsrcHandler(const server::IResourceDeclarationPtr& handler, const std::string& parentRoute = "");
	 */
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
