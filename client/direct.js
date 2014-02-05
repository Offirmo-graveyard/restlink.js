/* RESTlink "direct" client adapter.
 * This class is not to be created manually,
 * it must be obtained directly from the server or direct server adapter.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'extended-exceptions',
	'restlink/client/base',
	'network-constants/http'
],
function(_, when, EE, BaseClient, http_constants) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	//constants. = ;


	////////////////////////////////////
	methods.init = function(server_core) {
		// init of member objects

		if(typeof server_core !== 'object')
			throw new EE.InvalidArgument("Direct client should not be created manually, and must be provided a server !")
		// call parent
		BaseClient.methods.init.apply(this);

		this.server_core_ = server_core;
		this.session_ = server_core.create_session();
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	// override of parent
	methods.resolve_request_ = function(request) {

		this.session_.register_request(request);

		var server_promise = this.server_core_.process_request(request);

		// filter a bit
		return server_promise.then(function(response) {
			if(!request.is_long_living)
				request.done(); // done with it
			return response;
		});
	};

	// override of parent
	methods.disconnect = function() {
		// call parent
		BaseClient.methods.disconnect.apply(this)

		this.session_.invalidate();
		// release refs
		this.session_ = undefined;
		this.server_core_ = undefined;
	};


	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function DirectClientAdapter(server_core) {
		_.defaults( this, defaults );

		// other inits...
		methods.init.apply(this, arguments);
	};

	// class inheritance via prototype chain
	DefinedClass.prototype = Object.create(BaseClient.klass.prototype);
	DefinedClass.prototype.constructor = DefinedClass;

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);


	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		'make_new'   : function(server_core) { return new DefinedClass(server_core); },
		// but we still expose the constructor to allow class inheritance
		'klass'      : DefinedClass,
		// exposing these allows convenient syntax and also prototypal inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
