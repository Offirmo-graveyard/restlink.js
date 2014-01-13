/* HTTP adapter class for a RESTlink client adapter
 * node.js only.
 */

var http = require('http');
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'when',
	'restlink/core/request',
	'restlink/server/adapters/base',
	'extended-exceptions'
],
function(_, when, Request, BaseServerAdapter, EE) {
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
	defaults.listening_port = 8080;

	methods.init = function(options) {
		// init of member objects
		options = options || {};

		this.listening_port = options.port || defaults.listening_port;
		this.restlink_core = undefined;
		this.http_server = undefined;
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	function server_callback(http_req, http_res) {
		http_res.writeHead(200);
		http_res.end('Salut tout le monde !');
	}

	methods.startup = function(core) {
		// call parent
		StartableObject.methods.startup.apply(this);

		// save ref
		this.restlink_core = core;

		// start listening and serving
		this.server.listen(this.listening_port);
	};
	methods.shutdown = function() {
		var this_ = this;

		// REM : close() is async
		this.server.close(function() {
			// release ref
			this_.server_ = undefined;

			// call parent
			StartableObject.methods.shutdown.apply(this_);
		});
	};

	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function RestlinkServerHTTPAdapter(options) {
		_.defaults( this, defaults ); // TODO enhance

		// call parent constructor (by choice)
		BaseServerAdapter.klass.prototype.constructor.apply(this, arguments);

		// other inits...
		methods.init.apply(this, arguments);

		this.server = http.createServer(server_callback);
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
		'make_new'   : function(options) { return new DefinedClass(options); },
		// but we still expose the constructor to allow class inheritance
		'klass'      : DefinedClass,
		// exposing these allows convenient syntax and also prototypal inheritance
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
