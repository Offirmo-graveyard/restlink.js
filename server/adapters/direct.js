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
	'restlink/client/direct',
	'extended-exceptions'
],
function(_, when, Request, BaseServerAdapter, DirectClient, EE) {
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
		//...
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	methods.new_connection = function() {
		if(! this.is_started()) {
			// should never happen
			throw new EE.IllegalStateError("Can't open connection : server adapter is stopped.");
		}
		if(! this.server_) {
			// no server ! Can't process !
			// should also never happen
			throw new EE.IllegalStateError("Can't open connection : server adapter is misconfigured (no server).");
		}
		return DirectClient.make_new(this.server_);
	};

	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkServerAdapterDirect() {
		_.defaults( this, defaults ); // TODO enhance

		// call parent constructor (by choice)
		BaseServerAdapter.klass.prototype.constructor.apply(this, arguments);

		// other inits...
		methods.init.apply(this, arguments);
	};

	// class inheritance via prototype chain
	DefinedClass.prototype = Object.create(BaseServerAdapter.klass.prototype);
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
