/* A generic RestLink server adapter
 * useful for using different transport mechanisms.
 * an adapter knows the linked server,
 * and is also registered to the server so it can pass him some events
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'extended-exceptions',
	'base-objects/offinh/startable_object'
],
function(_, EE, StartableObject) {
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

		// the adapter knows its server
		// (only while started)
		this.restlink_core = undefined;
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	methods.startup = function(core) {
		if(typeof core !== 'object') {
			throw new EE.InvalidArgument("Can't start adapter : missing server core !");
		}
		this.restlink_core = core;

		// call parent
		StartableObject.methods.startup.apply(this);
	};
	methods.shutdown = function() {
		// release ref
		this.restlink_core = undefined;

		// call parent
		StartableObject.methods.shutdown.apply(this);
	};
	methods.get_server_core = function() {
		return this.restlink_core;
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

	var DefinedClass = function RestlinkServerBaseAdapter() {
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
